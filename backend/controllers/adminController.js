const { supabaseAdmin } = require('../config/supabase');
const { success, error, paginated } = require('../utils/response');
const bcrypt = require('bcryptjs');

// ================================================================
// USER MANAGEMENT
// ================================================================

// POST /api/admin/users - Create a new user
const createUser = async (req, res, next) => {
  try {
    const { full_name, email, password } = req.body;

    if (!email || !password || !full_name) {
      return error(res, 'full_name, email and password are required', 400);
    }

    // Check duplicate
    const { data: existing } = await supabaseAdmin
      .from('users').select('id').eq('email', email).single();
    if (existing) return error(res, 'Email already registered', 409);

    const password_hash = await bcrypt.hash(password, 12);

    const { data: newUser, error: dbErr } = await supabaseAdmin
      .from('users')
      .insert({ email, password_hash, full_name, role: 'user', is_active: true, preferences: {} })
      .select('id, email, full_name, role, is_active, created_at')
      .single();

    if (dbErr) throw dbErr;

    return success(res, newUser, 'User created', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:userId - Edit user info (name & email only, no role change)
const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { full_name, email } = req.body;

    if (!full_name && !email) {
      return error(res, 'Provide full_name or email to update', 400);
    }

    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (email) {
      // Check email not taken by someone else
      const { data: existing } = await supabaseAdmin
        .from('users').select('id').eq('email', email).neq('id', userId).single();
      if (existing) return error(res, 'Email already in use by another user', 409);
      updates.email = email;
    }

    const { data: updated, error: dbErr } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, email, full_name, role, is_active, created_at')
      .single();

    if (dbErr) throw dbErr;
    if (!updated) return error(res, 'User not found', 404);

    return success(res, updated, 'User updated');
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users - Get all users
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, is_active, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (req.query.search) {
      query = query.or(`email.ilike.%${req.query.search}%,full_name.ilike.%${req.query.search}%`);
    }

    if (req.query.role) {
      query = query.eq('role', req.query.role);
    }

    if (req.query.is_active !== undefined) {
      query = query.eq('is_active', req.query.is_active === 'true');
    }

    const { data: users, count, error: dataError } = await query;

    if (dataError) throw dataError;

    return paginated(res, users, { page, limit, total: count || 0 }, 'Users retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:userId - Get single user details
const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { data: user, error: dataError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, is_active, preferences, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (dataError || !user) return error(res, 'User not found', 404);

    // Get user's decision count
    const { count: decisionCount } = await supabaseAdmin
      .from('decisions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return success(res, {
      ...user,
      stats: {
        total_decisions: decisionCount || 0,
      },
    }, 'User retrieved');
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:userId/toggle - Toggle user active status
const toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, is_active')
      .eq('id', userId)
      .single();

    if (!user) return error(res, 'User not found', 404);

    const { data: updated, error: dataError } = await supabaseAdmin
      .from('users')
      .update({ is_active: !user.is_active })
      .eq('id', userId)
      .select('id, email, full_name, is_active')
      .single();

    if (dataError) throw dataError;

    return success(res, updated, `User ${updated.is_active ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:userId/role - Update user role
const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return error(res, 'Invalid role. Must be "user" or "admin"', 400);
    }

    // Prevent self-demotion
    if (userId === req.user.id && role !== 'admin') {
      return error(res, 'Cannot change your own admin role', 400);
    }

    const { data: updated, error: dataError } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select('id, email, full_name, role')
      .single();

    if (dataError) throw dataError;
    if (!updated) return error(res, 'User not found', 404);

    return success(res, updated, 'User role updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:userId - Delete user (soft: deactivate, hard: delete)
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const hard = req.query.hard === 'true';

    // Prevent self-deletion
    if (userId === req.user.id) {
      return error(res, 'Cannot delete your own account', 400);
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!user) return error(res, 'User not found', 404);

    if (hard) {
      // Hard delete - cascade will remove decisions, scores, etc.
      const { error: dataError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (dataError) throw dataError;

      return success(res, null, 'User permanently deleted');
    } else {
      // Soft delete - deactivate
      const { error: dataError } = await supabaseAdmin
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (dataError) throw dataError;

      return success(res, null, 'User deactivated');
    }
  } catch (err) {
    next(err);
  }
};

// ================================================================
// DECISION MANAGEMENT
// ================================================================

// GET /api/admin/decisions - Get all decisions
const getAllDecisions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('decisions')
      .select('*, users(id, email, full_name), alternatives(count), criteria(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    if (req.query.user_id) {
      query = query.eq('user_id', req.query.user_id);
    }

    const { data: decisions, count, error: dataError } = await query;

    if (dataError) throw dataError;

    return paginated(res, decisions, { page, limit, total: count || 0 }, 'Decisions retrieved');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/decisions/:id - Delete a decision
const deleteDecision = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: decision } = await supabaseAdmin
      .from('decisions')
      .select('id')
      .eq('id', id)
      .single();

    if (!decision) return error(res, 'Decision not found', 404);

    const { error: dataError } = await supabaseAdmin
      .from('decisions')
      .delete()
      .eq('id', id);

    if (dataError) throw dataError;

    return success(res, null, 'Decision deleted');
  } catch (err) {
    next(err);
  }
};

// ================================================================
// STATISTICS
// ================================================================

// GET /api/admin/stats - Get dashboard statistics
const getStats = async (req, res, next) => {
  try {
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: adminUsers },
      { count: totalDecisions },
      { count: completedDecisions },
      { count: totalRecommendations },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabaseAdmin.from('decisions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('decisions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabaseAdmin.from('recommendations').select('*', { count: 'exact', head: true }),
    ]);

    return success(res, {
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        admins: adminUsers || 0,
      },
      decisions: {
        total: totalDecisions || 0,
        completed: completedDecisions || 0,
      },
      recommendations: {
        total: totalRecommendations || 0,
      },
    }, 'Stats retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/analytics - Get detailed analytics from real data
const getAnalytics = async (req, res, next) => {
  try {
    // 1. All decisions with user and criteria/alternative counts
    const { data: allDecisions, error: decErr } = await supabaseAdmin
      .from('decisions')
      .select('id, status, created_at, user_id, users(full_name, email)')
      .order('created_at', { ascending: true });

    if (decErr) throw decErr;

    // 2. Alternatives & Criteria counts
    const { count: totalAlternatives } = await supabaseAdmin
      .from('alternatives')
      .select('*', { count: 'exact', head: true });

    const { count: totalCriteria } = await supabaseAdmin
      .from('criteria')
      .select('*', { count: 'exact', head: true });

    // 3. Build decisions per day (last 30 days)
    const today = new Date();
    const dayMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayMap[key] = 0;
    }
    allDecisions.forEach(dec => {
      const d = new Date(dec.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (key in dayMap) dayMap[key]++;
    });
    const decisionTrend = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

    // 4. Decisions by status
    const statusMap = {};
    allDecisions.forEach(dec => {
      statusMap[dec.status] = (statusMap[dec.status] || 0) + 1;
    });
    const decisionsByStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    // 5. Decisions by day of week
    const dayOfWeekMap = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    allDecisions.forEach(dec => {
      const day = days[new Date(dec.created_at).getDay()];
      dayOfWeekMap[day]++;
    });
    const dayOfWeekStats = Object.entries(dayOfWeekMap).map(([day, decisions]) => ({ day, decisions }));

    // 6. Top users by decision count
    const userDecCount = {};
    allDecisions.forEach(dec => {
      const name = dec.users?.full_name || dec.users?.email || 'Unknown';
      userDecCount[name] = (userDecCount[name] || 0) + 1;
    });
    const topUsers = Object.entries(userDecCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, decisions: count }));

    return success(res, {
      totalDecisions: allDecisions.length,
      totalAlternatives: totalAlternatives || 0,
      totalCriteria: totalCriteria || 0,
      completedDecisions: statusMap['completed'] || 0,
      decisionTrend,
      decisionsByStatus,
      dayOfWeekStats,
      topUsers,
    }, 'Analytics retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/activity - Get recent system activity
const getRecentActivity = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const { data: activity, error: dataError } = await supabaseAdmin
      .from('decision_history')
      .select('*, users(email, full_name), decisions(id, title)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (dataError) throw dataError;

    return success(res, activity, 'Recent activity retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  toggleUserStatus,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser,
  getAllDecisions,
  deleteDecision,
  getStats,
  getAnalytics,
  getRecentActivity,
};
