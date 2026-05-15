const { supabaseAdmin } = require('../config/supabase');
const { success, error, paginated } = require('../utils/response');

// GET /api/decisions/:id/history - Get history for a specific decision
const getHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Verify ownership
    const { data: decision } = await supabaseAdmin
      .from('decisions')
      .select('user_id, title')
      .eq('id', id)
      .single();

    if (!decision) return error(res, 'Decision not found', 404);
    if (decision.user_id !== req.user.id) return error(res, 'Access denied', 403);

    let query = supabaseAdmin
      .from('decision_history')
      .select('*', { count: 'exact' })
      .eq('decision_id', id)
      .order('created_at', { ascending: false })
      .range(from, to);

    // Filter by action type
    if (req.query.action_type) {
      query = query.eq('action_type', req.query.action_type);
    }

    const { data: history, count, error: dataError } = await query;

    if (dataError) throw dataError;

    return paginated(res, history, { page, limit, total: count || 0 }, 'History retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /api/history - Get all history for the authenticated user
const getGlobalHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('decision_history')
      .select('*, decisions(id, title)', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    // Filter by action type
    if (req.query.action_type) {
      query = query.eq('action_type', req.query.action_type);
    }

    // Filter by date range
    if (req.query.from_date) {
      query = query.gte('created_at', req.query.from_date);
    }
    if (req.query.to_date) {
      query = query.lte('created_at', req.query.to_date);
    }

    const { data: history, count, error: dataError } = await query;

    if (dataError) throw dataError;

    return paginated(res, history, { page, limit, total: count || 0 }, 'History retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /api/history/:historyId - Get single history entry
const getHistoryEntry = async (req, res, next) => {
  try {
    const { historyId } = req.params;

    const { data: entry, error: dataError } = await supabaseAdmin
      .from('decision_history')
      .select('*, decisions(id, title, user_id)')
      .eq('id', historyId)
      .single();

    if (dataError || !entry) return error(res, 'History entry not found', 404);

    // Verify ownership through decision
    if (entry.decisions.user_id !== req.user.id) {
      return error(res, 'Access denied', 403);
    }

    return success(res, entry, 'History entry retrieved');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/decisions/:id/history - Clear history for a decision
const clearHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const { data: decision } = await supabaseAdmin
      .from('decisions')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!decision) return error(res, 'Decision not found', 404);
    if (decision.user_id !== req.user.id) return error(res, 'Access denied', 403);

    const { error: dataError } = await supabaseAdmin
      .from('decision_history')
      .delete()
      .eq('decision_id', id);

    if (dataError) throw dataError;

    return success(res, null, 'History cleared');
  } catch (err) {
    next(err);
  }
};

// GET /api/history/stats - Get activity statistics for the user
const getActivityStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { count: totalActions },
      { count: decisionsCreated },
      { count: decisionsCreatedThisMonth },
      { count: analysesRun },
      { count: decisionsViewed },
    ] = await Promise.all([
      supabaseAdmin.from('decision_history').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabaseAdmin.from('decision_history').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('action_type', 'created'),
      supabaseAdmin.from('decision_history').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('action_type', 'created').gte('created_at', firstDayOfMonth),
      supabaseAdmin.from('decision_history').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('action_type', 'analyzed'),
      supabaseAdmin.from('decision_history').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('action_type', 'viewed'),
    ]);

    return success(res, {
      total_actions: totalActions || 0,
      decisions_created: decisionsCreated || 0,
      decisions_created_this_month: decisionsCreatedThisMonth || 0,
      analyses_run: analysesRun || 0,
      decisions_viewed: decisionsViewed || 0,
    }, 'Activity stats retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHistory,
  getGlobalHistory,
  getHistoryEntry,
  clearHistory,
  getActivityStats,
};
