/**
 * MCDM Engine - Multi-Criteria Decision Making
 * Supports: TOPSIS, SAW (Simple Additive Weighting), VIKOR
 */

/**
 * Build score matrix from alternatives, criteria, and scores
 */
function buildMatrix(alternatives, criteria, scores) {
  const matrix = {};
  for (const alt of alternatives) {
    matrix[alt.id] = { name: alt.name, scores: {} };
    for (const cri of criteria) {
      matrix[alt.id].scores[cri.id] = 0;
    }
  }
  for (const score of scores) {
    if (matrix[score.alternative_id]) {
      matrix[score.alternative_id].scores[score.criteria_id] = parseFloat(score.raw_value);
    }
  }
  return matrix;
}

/**
 * Normalize matrix using vector normalization (for TOPSIS)
 */
function vectorNormalize(matrix, alternatives, criteria) {
  const normalized = {};

  for (const cri of criteria) {
    const sumSquares = alternatives.reduce((sum, alt) => {
      return sum + Math.pow(matrix[alt.id].scores[cri.id] || 0, 2);
    }, 0);
    const divisor = Math.sqrt(sumSquares);

    for (const alt of alternatives) {
      if (!normalized[alt.id]) normalized[alt.id] = {};
      const raw = matrix[alt.id].scores[cri.id] || 0;
      normalized[alt.id][cri.id] = divisor > 0 ? raw / divisor : 0;
    }
  }

  return normalized;
}

/**
 * Normalize matrix using linear normalization (for SAW)
 */
function linearNormalize(matrix, alternatives, criteria) {
  const normalized = {};

  for (const cri of criteria) {
    const values = alternatives.map(a => matrix[a.id].scores[cri.id] || 0);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);

    for (const alt of alternatives) {
      if (!normalized[alt.id]) normalized[alt.id] = {};
      const raw = matrix[alt.id].scores[cri.id] || 0;

      if (cri.type === 'benefit') {
        normalized[alt.id][cri.id] = maxVal > 0 ? raw / maxVal : 0;
      } else {
        normalized[alt.id][cri.id] = raw > 0 ? minVal / raw : 0;
      }
    }
  }

  return normalized;
}

/**
 * Calculate weighted normalized matrix
 */
function weightedNormalize(normalized, criteria) {
  const weighted = {};

  for (const alt of Object.keys(normalized)) {
    weighted[alt] = {};
    for (const cri of criteria) {
      const weight = parseFloat(cri.weight) / 100;
      weighted[alt][cri.id] = (normalized[alt][cri.id] || 0) * weight;
    }
  }

  return weighted;
}

/**
 * Rank alternatives by final scores (descending)
 */
function rankByScore(scores) {
  return Object.entries(scores)
    .map(([id, data]) => ({
      alternative_id: id,
      name: data.name,
      finalScore: data.finalScore,
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

// ================================================================
// TOPSIS Method
// ================================================================
function calculateTOPSIS(alternatives, criteria, scores) {
  const matrix = buildMatrix(alternatives, criteria, scores);

  // Step 1: Vector normalization
  const normalized = vectorNormalize(matrix, alternatives, criteria);

  // Step 2: Weighted normalized matrix
  const weighted = weightedNormalize(normalized, criteria);

  // Step 3: Determine ideal best (A+) and ideal worst (A-)
  const idealBest = {};
  const idealWorst = {};

  for (const cri of criteria) {
    const values = alternatives.map(a => weighted[a.id][cri.id] || 0);

    if (cri.type === 'benefit') {
      idealBest[cri.id] = Math.max(...values);
      idealWorst[cri.id] = Math.min(...values);
    } else {
      idealBest[cri.id] = Math.min(...values);
      idealWorst[cri.id] = Math.max(...values);
    }
  }

  // Step 4: Calculate separation measures
  const separationBest = {};
  const separationWorst = {};

  for (const alt of alternatives) {
    separationBest[alt.id] = Math.sqrt(
      criteria.reduce((sum, cri) => {
        return sum + Math.pow((weighted[alt.id][cri.id] || 0) - idealBest[cri.id], 2);
      }, 0)
    );

    separationWorst[alt.id] = Math.sqrt(
      criteria.reduce((sum, cri) => {
        return sum + Math.pow((weighted[alt.id][cri.id] || 0) - idealWorst[cri.id], 2);
      }, 0)
    );
  }

  // Step 5: Calculate relative closeness to ideal solution
  const finalScores = {};
  for (const alt of alternatives) {
    const denominator = separationBest[alt.id] + separationWorst[alt.id];
    const closeness = denominator > 0 ? separationWorst[alt.id] / denominator : 0;

    finalScores[alt.id] = {
      name: alt.name,
      finalScore: parseFloat(closeness.toFixed(4)),
      normalizedScores: normalized[alt.id],
      weightedScores: weighted[alt.id],
      separationBest: parseFloat(separationBest[alt.id].toFixed(4)),
      separationWorst: parseFloat(separationWorst[alt.id].toFixed(4)),
    };
  }

  const rankings = rankByScore(finalScores);

  return {
    method: 'TOPSIS',
    scores: finalScores,
    rankings,
    idealBest,
    idealWorst,
  };
}

// ================================================================
// SAW (Simple Additive Weighting) Method
// ================================================================
function calculateSAW(alternatives, criteria, scores) {
  const matrix = buildMatrix(alternatives, criteria, scores);

  // Step 1: Linear normalization
  const normalized = linearNormalize(matrix, alternatives, criteria);

  // Step 2: Calculate weighted sum
  const finalScores = {};
  for (const alt of alternatives) {
    let total = 0;
    for (const cri of criteria) {
      const weight = parseFloat(cri.weight) / 100;
      total += weight * (normalized[alt.id][cri.id] || 0);
    }

    finalScores[alt.id] = {
      name: alt.name,
      finalScore: parseFloat(total.toFixed(4)),
      normalizedScores: normalized[alt.id],
    };
  }

  const rankings = rankByScore(finalScores);

  return {
    method: 'SAW',
    scores: finalScores,
    rankings,
  };
}

// ================================================================
// VIKOR Method
// ================================================================
function calculateVIKOR(alternatives, criteria, scores, v = 0.5) {
  const matrix = buildMatrix(alternatives, criteria, scores);

  // Step 1: Determine best (f*) and worst (f-) values for each criterion
  const bestValues = {};
  const worstValues = {};

  for (const cri of criteria) {
    const values = alternatives.map(a => matrix[a.id].scores[cri.id] || 0);

    if (cri.type === 'benefit') {
      bestValues[cri.id] = Math.max(...values);
      worstValues[cri.id] = Math.min(...values);
    } else {
      bestValues[cri.id] = Math.min(...values);
      worstValues[cri.id] = Math.max(...values);
    }
  }

  // Step 2: Calculate S_i (group utility) and R_i (individual regret)
  const S = {};
  const R = {};

  for (const alt of alternatives) {
    let maxRegret = 0;
    let weightedSum = 0;

    for (const cri of criteria) {
      const weight = parseFloat(cri.weight) / 100;
      const fi = matrix[alt.id].scores[cri.id] || 0;
      const denominator = bestValues[cri.id] - worstValues[cri.id];

      let normalizedDiff;
      if (denominator === 0) {
        normalizedDiff = 0;
      } else {
        normalizedDiff = (bestValues[cri.id] - fi) / denominator;
      }

      const weightedRegret = weight * normalizedDiff;
      weightedSum += weightedRegret;

      if (weightedRegret > maxRegret) {
        maxRegret = weightedRegret;
      }
    }

    S[alt.id] = weightedSum;
    R[alt.id] = maxRegret;
  }

  // Step 3: Calculate VIKOR index Q_i
  const SValues = Object.values(S);
  const RValues = Object.values(R);
  const SStar = Math.min(...SValues);
  const SMinus = Math.max(...SValues);
  const RStar = Math.min(...RValues);
  const RMinus = Math.max(...RValues);

  const finalScores = {};
  for (const alt of alternatives) {
    const denominator1 = SMinus - SStar;
    const denominator2 = RMinus - RStar;

    const term1 = denominator1 > 0 ? v * (S[alt.id] - SStar) / denominator1 : 0;
    const term2 = denominator2 > 0 ? (1 - v) * (R[alt.id] - RStar) / denominator2 : 0;

    finalScores[alt.id] = {
      name: alt.name,
      finalScore: parseFloat((term1 + term2).toFixed(4)),
      S: parseFloat(S[alt.id].toFixed(4)),
      R: parseFloat(R[alt.id].toFixed(4)),
    };
  }

  // VIKOR: Lower Q is better, so we sort ascending then invert for ranking
  const rankings = Object.entries(finalScores)
    .map(([id, data]) => ({
      alternative_id: id,
      name: data.name,
      finalScore: data.finalScore,
      S: data.S,
      R: data.R,
    }))
    .sort((a, b) => a.finalScore - b.finalScore)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    method: 'VIKOR',
    v,
    scores: finalScores,
    rankings,
    bestValues,
    worstValues,
  };
}

// ================================================================
// Main engine function
// ================================================================
function analyze(method, alternatives, criteria, scores, options = {}) {
  if (!alternatives || alternatives.length < 2) {
    throw new Error('Minimum 2 alternatives required');
  }
  if (!criteria || criteria.length < 1) {
    throw new Error('At least 1 criteria required');
  }

  const normalizedMethod = (method || 'TOPSIS').toUpperCase();

  switch (normalizedMethod) {
    case 'TOPSIS':
      return calculateTOPSIS(alternatives, criteria, scores);
    case 'SAW':
      return calculateSAW(alternatives, criteria, scores);
    case 'VIKOR':
      return calculateVIKOR(alternatives, criteria, scores, options.v || 0.5);
    default:
      throw new Error(`Unknown MCDM method: ${method}. Supported: TOPSIS, SAW, VIKOR`);
  }
}

module.exports = {
  analyze,
  calculateTOPSIS,
  calculateSAW,
  calculateVIKOR,
};
