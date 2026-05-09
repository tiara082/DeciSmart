const { supabaseAdmin } = require('../config/supabase');
const { success, error } = require('../utils/response');
const mcdm = require('../utils/mcdm');
const { generateAnalysis, compareAnalyses, enrichScores } = require('../services/groq');

// POST /api/decisions/:id/analyze - Generate AI recommendation
const generateRecommendation = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { id } = req.params;
    const method = req.body.method || 'TOPSIS';

    // Fetch decision with all related data
    const { data: decision } = await supabaseAdmin
      .from('decisions')
      .select(`*, alternatives(*), criteria(*), scores(*)`)
      .eq('id', id)
      .single();

    if (!decision) return error(res, 'Decision not found', 404);
    if (decision.user_id !== req.user.id) return error(res, 'Access denied', 403);

    // Validate completeness
    if (!decision.alternatives || decision.alternatives.length < 2) {
      return error(res, 'Minimum 2 alternatives required for analysis', 400);
    }

    if (!decision.criteria || decision.criteria.length < 1) {
      return error(res, 'At least 1 criteria required for analysis', 400);
    }

    const totalWeight = decision.criteria.reduce((sum, c) => sum + parseFloat(c.weight), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return error(res, `Total criteria weight must be 100%. Current: ${totalWeight.toFixed(2)}%`, 400);
    }

    // Check scores completeness
    const scoreSet = new Set(decision.scores.map(s => `${s.alternative_id}-${s.criteria_id}`));
    for (const alt of decision.alternatives) {
      for (const cri of decision.criteria) {
        if (!scoreSet.has(`${alt.id}-${cri.id}`)) {
          return error(res, `Missing score for "${alt.name}" on "${cri.name}"`, 400);
        }
      }
    }

    // Run MCDM analysis
    const mcdmResult = mcdm.analyze(method, decision.alternatives, decision.criteria, decision.scores);

    // Generate AI reasoning
    const aiReasoning = await generateAnalysis(decision, mcdmResult);

    const rankedAlternatives = mcdmResult.rankings.map(r => ({
      rank: r.rank,
      alternative_id: r.alternative_id,
      alternative_name: r.name,
      final_score: r.finalScore,
    }));

    const processingTime = Date.now() - startTime;

    // Save recommendation
    const { data: recommendation, error: dataError } = await supabaseAdmin
      .from('recommendations')
      .upsert({
        decision_id: id,
        ranked_alternatives: rankedAlternatives,
        mcdm_scores: { method: mcdmResult.method, scores: mcdmResult.scores },
        ai_reasoning: aiReasoning,
        processing_time_ms: processingTime,
      }, { onConflict: 'decision_id' })
      .select()
      .single();

    if (dataError) throw dataError;

    // Update decision status
    await supabaseAdmin
      .from('decisions')
      .update({ status: 'completed' })
      .eq('id', id);

    // Log to history
    await supabaseAdmin.from('decision_history').insert({
      decision_id: id,
      user_id: req.user.id,
      action_type: 'analyzed',
      metadata: { method, processing_time_ms: processingTime },
    });

    return success(res, {
      recommendation,
      method: mcdmResult.method,
      rankings: rankedAlternatives,
      mcdm_details: mcdmResult,
      ai_reasoning: aiReasoning,
      processing_time_ms: processingTime,
    }, 'Analysis completed');
  } catch (err) {
    next(err);
  }
};

// POST /api/decisions/:id/compare - Compare multiple MCDM methods
const compareMethods = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { id } = req.params;
    const methods = req.body.methods || ['TOPSIS', 'SAW', 'VIKOR'];

    const { data: decision } = await supabaseAdmin
      .from('decisions')
      .select(`*, alternatives(*), criteria(*), scores(*)`)
      .eq('id', id)
      .single();

    if (!decision) return error(res, 'Decision not found', 404);
    if (decision.user_id !== req.user.id) return error(res, 'Access denied', 403);

    if (!decision.alternatives || decision.alternatives.length < 2) {
      return error(res, 'Minimum 2 alternatives required', 400);
    }

    if (!decision.criteria || decision.criteria.length < 1) {
      return error(res, 'At least 1 criteria required', 400);
    }

    // Run all requested methods
    const results = {};
    for (const method of methods) {
      try {
        results[method] = mcdm.analyze(method, decision.alternatives, decision.criteria, decision.scores);
      } catch (err) {
        results[method] = { error: err.message };
      }
    }

    // Generate AI comparison
    const aiComparison = await compareAnalyses(decision, results);

    const processingTime = Date.now() - startTime;

    return success(res, {
      methods: results,
      ai_comparison: aiComparison,
      processing_time_ms: processingTime,
    }, 'Comparison completed');
  } catch (err) {
    next(err);
  }
};

// POST /api/decisions/:id/enrich - AI-enrich scores for an alternative
const enrichAlternative = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { alternative_id } = req.body;

    const { data: decision } = await supabaseAdmin
      .from('decisions')
      .select(`*, alternatives(*), criteria(*)`)
      .eq('id', id)
      .single();

    if (!decision) return error(res, 'Decision not found', 404);
    if (decision.user_id !== req.user.id) return error(res, 'Access denied', 403);

    const alternative = decision.alternatives.find(a => a.id === alternative_id);
    if (!alternative) return error(res, 'Alternative not found', 404);

    // Call AI to suggest scores
    const enriched = await enrichScores(alternative.name, decision.criteria);

    if (!enriched) {
      return error(res, 'AI enrichment failed', 500);
    }

    // Map AI scores to criteria IDs
    const scoreSuggestions = (enriched.scores || []).map(s => {
      const criteria = decision.criteria.find(c =>
        c.name.toLowerCase() === s.criteria_name?.toLowerCase()
      );
      return {
        criteria_id: criteria?.id,
        criteria_name: s.criteria_name,
        raw_value: s.value,
        confidence: s.confidence,
        reasoning: s.reasoning,
      };
    }).filter(s => s.criteria_id);

    return success(res, {
      alternative_id,
      alternative_name: alternative.name,
      scores: scoreSuggestions,
    }, 'Scores enriched');
  } catch (err) {
    next(err);
  }
};

// GET /api/decisions/:id/recommendation - Get existing recommendation
const getRecommendation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: decision } = await supabaseAdmin
      .from('decisions')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!decision) return error(res, 'Decision not found', 404);
    if (decision.user_id !== req.user.id) return error(res, 'Access denied', 403);

    const { data: recommendation, error: dataError } = await supabaseAdmin
      .from('recommendations')
      .select('*')
      .eq('decision_id', id)
      .single();

    if (dataError || !recommendation) {
      return error(res, 'No recommendation found. Run analysis first.', 404);
    }

    return success(res, recommendation, 'Recommendation retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateRecommendation,
  compareMethods,
  enrichAlternative,
  getRecommendation,
};
