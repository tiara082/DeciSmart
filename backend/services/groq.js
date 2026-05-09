const Groq = require('groq-sdk');
const config = require('../config');

let groqInstance = null;

function getClient() {
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: config.groq.apiKey });
  }
  return groqInstance;
}

// ================================================================
// Prompt Templates
// ================================================================

function buildAnalysisPrompt(decision, mcdmResult) {
  const topChoice = mcdmResult.rankings[0];
  const runnerUp = mcdmResult.rankings[1];

  const scoreMatrix = decision.scores.map(s => {
    const alt = decision.alternatives.find(a => a.id === s.alternative_id);
    const cri = decision.criteria.find(c => c.id === s.criteria_id);
    return `- ${alt?.name} on ${cri?.name}: ${s.raw_value}`;
  }).join('\n');

  return `Analyze this multi-criteria decision and provide expert reasoning.

DECISION: ${decision.title}
${decision.description ? `DESCRIPTION: ${decision.description}` : ''}
${decision.domain_category ? `CATEGORY: ${decision.domain_category}` : ''}

ALTERNATIVES:
${decision.alternatives.map((a, i) => `${i + 1}. ${a.name}${a.description ? ` - ${a.description}` : ''}`).join('\n')}

CRITERIA (with weights):
${decision.criteria.map(c => `- ${c.name}: ${c.weight}% (${c.type})`).join('\n')}

SCORE MATRIX:
${scoreMatrix}

MCDM RESULTS (${mcdmResult.method}):
${mcdmResult.rankings.map(r => `#${r.rank}: ${r.name} (Score: ${r.finalScore})`).join('\n')}

Winner: ${topChoice.name} (${topChoice.finalScore})
${runnerUp ? `Runner-up: ${runnerUp.name} (${runnerUp.finalScore})` : ''}

Provide a concise analysis (max 300 words) covering:
1. Why ${topChoice.name} is the best choice
2. Key differentiating factors
3. Trade-offs or risks to consider
4. Confidence level in the recommendation`;
}

function buildComparisonPrompt(decision, mcdmResults) {
  const methods = Object.keys(mcdmResults);

  return `Compare these MCDM analysis results for the decision "${decision.title}".

ALTERNATIVES:
${decision.alternatives.map((a, i) => `${i + 1}. ${a.name}`).join('\n')}

RESULTS BY METHOD:
${methods.map(method => {
  const result = mcdmResults[method];
  return `\n${method}:
${result.rankings.map(r => `  #${r.rank}: ${r.name} (${r.finalScore})`).join('\n')}`;
}).join('\n')}

Provide a brief comparison (max 200 words) covering:
1. Do the methods agree on the best choice?
2. If not, which method is most suitable for this decision type?
3. Final recommendation`;
}

function buildEnrichmentPrompt(alternativeName, criteria) {
  return `For the alternative "${alternativeName}", suggest typical score values (0-100 scale) for these criteria:

${criteria.map(c => `- ${c.name} (${c.type})`).join('\n')}

Respond ONLY with valid JSON:
{
  "scores": [
    { "criteria_name": "...", "value": <number>, "confidence": <0-1>, "reasoning": "..." }
  ]
}`;
}

// ================================================================
// Core API Function
// ================================================================

async function callGroq(prompt, options = {}) {
  try {
    const groq = getClient();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: options.systemPrompt || 'You are a decision analysis expert. Be concise and data-driven.',
        },
        { role: 'user', content: prompt },
      ],
      model: options.model || config.groq.model,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 1024,
    });

    return completion.choices[0]?.message?.content || 'No response generated.';
  } catch (err) {
    console.error('Groq API error:', err.message);
    throw new Error('AI service unavailable. Please try again.');
  }
}

async function callGroqJSON(prompt, options = {}) {
  const response = await callGroq(prompt, {
    ...options,
    temperature: options.temperature ?? 0.3,
    systemPrompt: 'You are a data assistant. Always respond with valid JSON only.',
  });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : response);
  } catch {
    return null;
  }
}

// ================================================================
// High-Level Functions
// ================================================================

async function generateAnalysis(decision, mcdmResult) {
  const prompt = buildAnalysisPrompt(decision, mcdmResult);
  return callGroq(prompt);
}

async function compareAnalyses(decision, mcdmResults) {
  const prompt = buildComparisonPrompt(decision, mcdmResults);
  return callGroq(prompt, { maxTokens: 512 });
}

async function enrichScores(alternativeName, criteria) {
  const prompt = buildEnrichmentPrompt(alternativeName, criteria);
  return callGroqJSON(prompt);
}

module.exports = {
  callGroq,
  callGroqJSON,
  generateAnalysis,
  compareAnalyses,
  enrichScores,
};
