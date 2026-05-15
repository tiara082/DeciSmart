const { validationResult } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { success, error, paginated } = require('../utils/response');

// POST /api/decisions — Create new decision
const createDecision = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed', 400, errors.array());
    }

    const { title, description, domain_category } = req.body;

    const { data: decision, error: dataError } = await supabaseAdmin
      .from('decisions')
      .insert({
        user_id: req.user.id,
        title,
        description: description || null,
        domain_category: domain_category || null,
        status: 'draft',
      })
      .select()
      .single();

    if (dataError) throw dataError;

    // Log to history
    await supabaseAdmin.from('decision_history').insert({
      decision_id: decision.id,
      user_id: req.user.id,
      action_type: 'created',
      metadata: { title },
    });

    return success(res, decision, 'Decision created', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/decisions — List user's decisions
const getDecisions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('decisions')
      .select('*, alternatives(count), criteria(count)', { count: 'exact' })
      .eq('user_id', req.user.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .range(from, to);

    // Filter by status
    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    // Filter by category
    if (req.query.category) {
      query = query.eq('domain_category', req.query.category);
    }

    const { data: decisions, count, error: dataError } = await query;

    if (dataError) throw dataError;

    return paginated(res, decisions, { page, limit, total: count || 0 }, 'Decisions retrieved');
  } catch (err) {
    next(err);
  }
};

// GET /api/decisions/:id — Get single decision with all details
const getDecision = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: decision, error: dataError } = await supabaseAdmin
      .from('decisions')
      .select(`
        *,
        alternatives(*),
        criteria(*),
        recommendations(*)
      `)
      .eq('id', id)
      .single();

    if (dataError || !decision) {
      return error(res, 'Decision not found', 404);
    }

    // Fetch scores separately since there is no direct FK from scores to decisions
    if (decision.alternatives && decision.alternatives.length > 0) {
      const altIds = decision.alternatives.map(a => a.id);
      const { data: scores } = await supabaseAdmin
        .from('scores')
        .select('*')
        .in('alternative_id', altIds);
      decision.scores = scores || [];
    } else {
      decision.scores = [];
    }

    // Check ownership
    if (decision.user_id !== req.user.id) {
      return error(res, 'Access denied', 403);
    }

    // Log view
    await supabaseAdmin.from('decision_history').insert({
      decision_id: decision.id,
      user_id: req.user.id,
      action_type: 'viewed',
    });

    return success(res, decision, 'Decision retrieved');
  } catch (err) {
    next(err);
  }
};

// PUT /api/decisions/:id — Update decision header
const updateDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, domain_category, status } = req.body;

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('decisions')
      .select('user_id, status')
      .eq('id', id)
      .single();

    if (!existing) return error(res, 'Decision not found', 404);
    if (existing.user_id !== req.user.id) return error(res, 'Access denied', 403);

    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (domain_category) updates.domain_category = domain_category;
    if (status) updates.status = status;

    const { data: updated, error: dataError } = await supabaseAdmin
      .from('decisions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (dataError) throw dataError;

    return success(res, updated, 'Decision updated');
  } catch (err) {
    next(err);
  }
};

// POST /api/decisions/:id/alternatives — Add alternative
const addAlternative = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed', 400, errors.array());
    }

    const { id: decisionId } = req.params;

    // Verify ownership & count
    const { data: decision } = await supabaseAdmin
      .from('decisions')
      .select('id, user_id')
      .eq('id', decisionId)
      .single();

    if (!decision) return error(res, 'Decision not found', 404);
    if (decision.user_id !== req.user.id) return error(res, 'Access denied', 403);

    const { count } = await supabaseAdmin
      .from('alternatives')
      .select('*', { count: 'exact', head: true })
      .eq('decision_id', decisionId);

    if (count >= 10) {
      return error(res, 'Maximum 10 alternatives allowed', 400);
    }

    // Check duplicate name
    const { data: dupName } = await supabaseAdmin
      .from('alternatives')
      .select('id')
      .eq('decision_id', decisionId)
      .eq('name', req.body.name)
      .single();

    if (dupName) {
      return error(res, 'Alternative name already exists in this decision', 409);
    }

    const { data: alternative, error: dataError } = await supabaseAdmin
      .from('alternatives')
      .insert({
        decision_id: decisionId,
        name: req.body.name,
        description: req.body.description || null,
        order_index: req.body.order_index || count || 0,
      })
      .select()
      .single();

    if (dataError) throw dataError;

    return success(res, alternative, 'Alternative added', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/decisions/:id/alternatives/:altId — Update alternative
const updateAlternative = async (req, res, next) => {
  try {
    const { altId } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('alternatives')
      .select('id, decision_id, decisions!inner(user_id)')
      .eq('id', altId)
      .single();

    if (!existing) return error(res, 'Alternative not found', 404);

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.order_index !== undefined) updates.order_index = req.body.order_index;

    const { data: updated, error: dataError } = await supabaseAdmin
      .from('alternatives')
      .update(updates)
      .eq('id', altId)
      .select()
      .single();

    if (dataError) throw dataError;

    return success(res, updated, 'Alternative updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/decisions/:id/alternatives/:altId — Remove alternative
const removeAlternative = async (req, res, next) => {
  try {
    const { id: decisionId, altId } = req.params;

    // Check minimum alternatives
    const { count } = await supabaseAdmin
      .from('alternatives')
      .select('*', { count: 'exact', head: true })
      .eq('decision_id', decisionId);

    if (count <= 2) {
      return error(res, 'Minimum 2 alternatives required', 400);
    }

    const { error: dataError } = await supabaseAdmin
      .from('alternatives')
      .delete()
      .eq('id', altId)
      .eq('decision_id', decisionId);

    if (dataError) throw dataError;

    return success(res, null, 'Alternative removed');
  } catch (err) {
    next(err);
  }
};

// POST /api/decisions/:id/criteria — Add criteria
const addCriteria = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed', 400, errors.array());
    }

    const { id: decisionId } = req.params;

    // Verify ownership
    const { data: decision } = await supabaseAdmin
      .from('decisions')
      .select('id, user_id')
      .eq('id', decisionId)
      .single();

    if (!decision) return error(res, 'Decision not found', 404);
    if (decision.user_id !== req.user.id) return error(res, 'Access denied', 403);

    // Check weight total doesn't exceed 100
    const { data: existingCriteria } = await supabaseAdmin
      .from('criteria')
      .select('weight')
      .eq('decision_id', decisionId);

    const currentTotal = existingCriteria
      ? existingCriteria.reduce((sum, c) => sum + parseFloat(c.weight), 0)
      : 0;

    if (currentTotal + parseFloat(req.body.weight) > 100) {
      return error(res, `Total weight would exceed 100%. Current: ${currentTotal}%, Adding: ${req.body.weight}%`, 400);
    }

    const { count } = await supabaseAdmin
      .from('criteria')
      .select('*', { count: 'exact', head: true })
      .eq('decision_id', decisionId);

    const { data: criteria, error: dataError } = await supabaseAdmin
      .from('criteria')
      .insert({
        decision_id: decisionId,
        name: req.body.name,
        weight: req.body.weight,
        type: req.body.type,
        description: req.body.description || null,
        order_index: req.body.order_index || count || 0,
      })
      .select()
      .single();

    if (dataError) throw dataError;

    return success(res, criteria, 'Criteria added', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/decisions/:id/criteria/:criId — Update criteria
const updateCriteria = async (req, res, next) => {
  try {
    const { id: decisionId, criId } = req.params;

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.weight !== undefined) updates.weight = req.body.weight;
    if (req.body.type) updates.type = req.body.type;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.order_index !== undefined) updates.order_index = req.body.order_index;

    const { data: updated, error: dataError } = await supabaseAdmin
      .from('criteria')
      .update(updates)
      .eq('id', criId)
      .eq('decision_id', decisionId)
      .select()
      .single();

    if (dataError) throw dataError;

    return success(res, updated, 'Criteria updated');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/decisions/:id/criteria/:criId — Remove criteria
const removeCriteria = async (req, res, next) => {
  try {
    const { id: decisionId, criId } = req.params;

    const { error: dataError } = await supabaseAdmin
      .from('criteria')
      .delete()
      .eq('id', criId)
      .eq('decision_id', decisionId);

    if (dataError) throw dataError;

    return success(res, null, 'Criteria removed');
  } catch (err) {
    next(err);
  }
};

// POST /api/decisions/:id/scores — Upsert scores matrix
const upsertScores = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed', 400, errors.array());
    }

    const { id: decisionId } = req.params;
    const { scores } = req.body;

    // Verify ownership
    const { data: decision } = await supabaseAdmin
      .from('decisions')
      .select('id, user_id')
      .eq('id', decisionId)
      .single();

    if (!decision) return error(res, 'Decision not found', 404);
    if (decision.user_id !== req.user.id) return error(res, 'Access denied', 403);

    // Verify alternatives belong to this decision
    const { data: alts } = await supabaseAdmin
      .from('alternatives')
      .select('id')
      .eq('decision_id', decisionId);

    const validAltIds = new Set(alts.map(a => a.id));

    // Verify criteria belong to this decision
    const { data: cris } = await supabaseAdmin
      .from('criteria')
      .select('id')
      .eq('decision_id', decisionId);

    const validCriIds = new Set(cris.map(c => c.id));

    // Validate all scores reference valid alternatives and criteria
    for (const s of scores) {
      if (!validAltIds.has(s.alternative_id)) {
        return error(res, `Invalid alternative_id: ${s.alternative_id}`, 400);
      }
      if (!validCriIds.has(s.criteria_id)) {
        return error(res, `Invalid criteria_id: ${s.criteria_id}`, 400);
      }
    }

    // Upsert scores
    const { data: upserted, error: dataError } = await supabaseAdmin
      .from('scores')
      .upsert(
        scores.map(s => ({
          alternative_id: s.alternative_id,
          criteria_id: s.criteria_id,
          raw_value: s.raw_value,
          source: s.source || 'manual',
        })),
        { onConflict: 'alternative_id,criteria_id' }
      )
      .select();

    if (dataError) throw dataError;

    return success(res, upserted, 'Scores saved');
  } catch (err) {
    next(err);
  }
};

// GET /api/decisions/:id/validate — Validate decision completeness
const validateDecision = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: decision } = await supabaseAdmin
      .from('decisions')
      .select('*, alternatives(*), criteria(*)')
      .eq('id', id)
      .single();

    if (!decision) return error(res, 'Decision not found', 404);
    if (decision.user_id !== req.user.id) return error(res, 'Access denied', 403);

    const issues = [];

    // Check alternatives
    if (!decision.alternatives || decision.alternatives.length < 2) {
      issues.push({ field: 'alternatives', message: 'Minimum 2 alternatives required' });
    }

    // Check criteria
    if (!decision.criteria || decision.criteria.length < 1) {
      issues.push({ field: 'criteria', message: 'At least 1 criteria required' });
    }

    // Check weights sum to 100
    if (decision.criteria && decision.criteria.length > 0) {
      const totalWeight = decision.criteria.reduce((sum, c) => sum + parseFloat(c.weight), 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        issues.push({
          field: 'criteria_weights',
          message: `Total weight is ${totalWeight.toFixed(2)}%, must be exactly 100%`,
          current: totalWeight,
          remaining: 100 - totalWeight,
        });
      }
    }

    // Check scores completeness
    if (decision.alternatives && decision.criteria) {
      const { data: scores } = await supabaseAdmin
        .from('scores')
        .select('alternative_id, criteria_id')
        .in('alternative_id', decision.alternatives.map(a => a.id));

      const scoreSet = new Set((scores || []).map(s => `${s.alternative_id}-${s.criteria_id}`));

      for (const alt of decision.alternatives) {
        for (const cri of decision.criteria) {
          if (!scoreSet.has(`${alt.id}-${cri.id}`)) {
            issues.push({
              field: 'scores',
              message: `Missing score for "${alt.name}" on "${cri.name}"`,
            });
          }
        }
      }
    }

    const isValid = issues.length === 0;

    return success(res, {
      isValid,
      issues,
      summary: {
        alternatives: decision.alternatives?.length || 0,
        criteria: decision.criteria?.length || 0,
        totalWeight: decision.criteria?.reduce((sum, c) => sum + parseFloat(c.weight), 0) || 0,
      },
    }, isValid ? 'Decision is valid for analysis' : 'Decision has issues');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/decisions/:id — Delete decision (soft or hard)
const deleteDecision = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('decisions')
      .select('user_id, status')
      .eq('id', id)
      .single();

    if (!existing) return error(res, 'Decision not found', 404);
    if (existing.user_id !== req.user.id) return error(res, 'Access denied', 403);

    // Log deletion to history before deleting
    await supabaseAdmin.from('decision_history').insert({
      decision_id: id,
      user_id: req.user.id,
      action_type: 'deleted',
      metadata: { previousStatus: existing.status },
    });

    // Hard delete (cascade will remove related records)
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

module.exports = {
  createDecision,
  getDecisions,
  getDecision,
  updateDecision,
  deleteDecision,
  addAlternative,
  updateAlternative,
  removeAlternative,
  addCriteria,
  updateCriteria,
  removeCriteria,
  upsertScores,
  validateDecision,
};
