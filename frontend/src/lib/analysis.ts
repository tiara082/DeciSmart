export interface Decision {
  id: string;
  decision: string;
  context: string;
  alternatives: string[];
  criteria: Array<{ name: string; weight: number }>;
  createdAt: string;
  status: string;
}

export interface AnalysisResult {
  decision: Decision;
  scores: Record<string, number>;
  reasoning: Record<string, string>;
  recommendation: string;
  criteriaScores: Array<{
    alternative: string;
    scores: Record<string, number>;
  }>;
}

export function getDecisionFromStorage(id: string): Decision | null {
  if (typeof window === 'undefined') return null;
  const decisions = JSON.parse(localStorage.getItem('decisions') || '[]');
  return decisions.find((d: Decision) => d.id === id) || null;
}

export function generateMockAnalysis(decision: Decision): AnalysisResult {
  const scores: Record<string, number> = {};
  const reasoning: Record<string, string> = {};
  const criteriaScores = decision.alternatives.map((alt) => ({
    alternative: alt,
    scores: {},
  }));

  // Generate mock scores
  decision.alternatives.forEach((alt, idx) => {
    const baseScore = 60 + Math.random() * 35;
    scores[alt] = Math.round(baseScore);

    // Generate reasoning
    const reasons = [
      'Shows strong alignment with your primary criteria',
      'Excellent value proposition compared to alternatives',
      'Demonstrates superior performance characteristics',
      'Well-balanced across all your evaluation factors',
      'Offers the best long-term potential',
    ];
    reasoning[alt] = reasons[idx % reasons.length];

    // Generate criterion scores
    decision.criteria.forEach((criterion) => {
      criteriaScores[idx].scores[criterion.name] = Math.round(50 + Math.random() * 45);
    });
  });

  // Find recommendation
  const [recommendation] = Object.entries(scores).reduce((prev, current) =>
    current[1] > prev[1] ? current : prev
  );

  return {
    decision,
    scores,
    reasoning,
    recommendation,
    criteriaScores,
  };
}
