const { supabaseAdmin } = require('../config/supabase');
const { success, error, paginated } = require('../utils/response');

// ================================================================
// USER MANAGEMENT
// ================================================================

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
  updateUserRole,
  deleteUser,
  getAllDecisions,
  deleteDecision,
  getStats,
  getRecentActivity,
};
