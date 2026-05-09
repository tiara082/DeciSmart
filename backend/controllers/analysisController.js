const { supabaseAdmin } = require('../config/supabase');
const { success, error } = require('../utils/response');
const mcdm = require('../utils/mcdm');
const { generateAnalysis } = require('../services/groq');

// GET /api/decisions/:id/analysis - Get analysis results for a decision
const getAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: decision } = await supabaseAdmin
      .from('decisions')
      .select('user_id, status')
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
      return error(res, 'No analysis found. Run analysis first.', 404);
    }

    return success(res, {
      decision_id: id,
      decision_status: decision.status,
      recommendation,
    }, 'Analysis retrieved');
  } catch (err) {
    next(err);
  }
};

// POST /api/decisions/:id/analysis/run - Run MCDM analysis
const runAnalysis = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { id } = req.params;
    const { method = 'TOPSIS', v = 0.5 } = req.body;

    // Fetch decision with all data
    const { data: decision } = await supabaseAdmin
      .from('decisions')
      .select(`*, alternatives(*), criteria(*), scores(*)`)
      .eq('id', id)
      .single();

    if (!decision) return error(res, 'Decision not found', 404);
    if (decision.user_id !== req.user.id) return error(res, 'Access denied', 403);

    // Validate
    if (!decision.alternatives || decision.alternatives.length < 2) {
      return error(res, 'Minimum 2 alternatives required', 400);
    }
    if (!decision.criteria || decision.criteria.length < 1) {
      return error(res, 'At least 1 criteria required', 400);
    }

    const totalWeight = decision.criteria.reduce((sum, c) => sum + parseFloat(c.weight), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return error(res, `Total criteria weight must be 100%. Current: ${totalWeight.toFixed(2)}%`, 400);
    }

    // Check scores
    const scoreSet = new Set(decision.scores.map(s => `${s.alternative_id}-${s.criteria_id}`));
    for (const alt of decision.alternatives) {
      for (const cri of decision.criteria) {
        if (!scoreSet.has(`${alt.id}-${cri.id}`)) {
          return error(res, `Missing score for "${alt.name}" on "${cri.name}"`, 400);
        }
      }
    }

    // Run MCDM
    const mcdmResult = mcdm.analyze(method, decision.alternatives, decision.criteria, decision.scores, { v });

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

    // Update status
    await supabaseAdmin
      .from('decisions')
      .update({ status: 'completed' })
      .eq('id', id);

    // Log history
    await supabaseAdmin.from('decision_history').insert({
      decision_id: id,
      user_id: req.user.id,
      action_type: 'analyzed',
      metadata: { method: mcdmResult.method, processing_time_ms: processingTime },
    });

    return success(res, {
      recommendation,
      method: mcdmResult.method,
      rankings: rankedAlternatives,
      mcdm_details: mcdmResult,
      ai_reasoning: aiReasoning,
      processing_time_ms: processingTime,
    }, 'Analysis completed', 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/decisions/:id/analysis/sensitivity - Sensitivity analysis
const sensitivityAnalysis = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { id } = req.params;
    const { method = 'TOPSIS', criteria_id, weight_range } = req.body;

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

    const targetCriteria = decision.criteria.find(c => c.id === criteria_id);
    if (!targetCriteria) return error(res, 'Criteria not found', 404);

    const minWeight = weight_range?.min ?? 0;
    const maxWeight = weight_range?.max ?? 100;
    const steps = weight_range?.steps ?? 10;
    const increment = (maxWeight - minWeight) / steps;

    const results = [];
    const originalWeight = parseFloat(targetCriteria.weight);

    for (let i = 0; i <= steps; i++) {
      const newWeight = minWeight + (increment * i);
      const adjustedCriteria = decision.criteria.map(c =>
        c.id === criteria_id ? { ...c, weight: newWeight } : c
      );

      // Renormalize other weights
      const otherWeightTotal = adjustedCriteria
        .filter(c => c.id !== criteria_id)
        .reduce((sum, c) => sum + parseFloat(c.weight), 0);

      if (otherWeightTotal > 0 && newWeight < 100) {
        const scaleFactor = (100 - newWeight) / otherWeightTotal;
        const normalizedCriteria = adjustedCriteria.map(c =>
          c.id === criteria_id ? c : { ...c, weight: parseFloat(c.weight) * scaleFactor }
        );

        try {
          const result = mcdm.analyze(method, decision.alternatives, normalizedCriteria, decision.scores);
          results.push({
            weight: parseFloat(newWeight.toFixed(2)),
            rankings: result.rankings,
            winner: result.rankings[0]?.name,
          });
        } catch {
          results.push({ weight: parseFloat(newWeight.toFixed(2)), error: 'Calculation failed' });
        }
      }
    }

    const processingTime = Date.now() - startTime;

    // Find stability point (where winner changes)
    const stabilityChanges = [];
    for (let i = 1; i < results.length; i++) {
      if (results[i].winner && results[i - 1].winner && results[i].winner !== results[i - 1].winner) {
        stabilityChanges.push({
          at_weight: results[i].weight,
          from: results[i - 1].winner,
          to: results[i].winner,
        });
      }
    }

    return success(res, {
      method,
      criteria_analyzed: {
        id: targetCriteria.id,
        name: targetCriteria.name,
        original_weight: originalWeight,
      },
      results,
      stability_changes: stabilityChanges,
      is_stable: stabilityChanges.length === 0,
      processing_time_ms: processingTime,
    }, 'Sensitivity analysis completed');
  } catch (err) {
    next(err);
  }
};

// GET /api/analysis/methods - Get available MCDM methods
const getMethods = async (req, res) => {
  const methods = [
    {
      id: 'TOPSIS',
      name: 'TOPSIS',
      full_name: 'Technique for Order of Preference by Similarity to Ideal Solution',
      description: 'Selects the alternative closest to the ideal solution and farthest from the negative-ideal solution.',
      normalization: 'Vector',
      best_for: 'Comparing alternatives against ideal benchmarks',
    },
    {
      id: 'SAW',
      name: 'SAW',
      full_name: 'Simple Additive Weighting',
      description: 'Calculates a weighted sum of normalized criterion values for each alternative.',
      normalization: 'Linear (Max/Min)',
      best_for: 'Straightforward weighted comparisons',
    },
    {
      id: 'VIKOR',
      name: 'VIKOR',
      full_name: 'VIseKriterijumska Optimizacija I Kompromisno Resenje',
      description: 'Finds a compromise solution by maximizing group utility and minimizing individual regret.',
      normalization: 'Linear (Min-Max)',
      best_for: 'Conflict resolution and compromise solutions',
    },
  ];

  return success(res, methods, 'Available MCDM methods');
};

module.exports = {
  getAnalysis,
  runAnalysis,
  sensitivityAnalysis,
  getMethods,
};
