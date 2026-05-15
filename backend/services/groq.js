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

Tuliskan analisis yang komprehensif, naratif, dan terdengar natural (seperti manusia yang sedang memberikan saran kepada temannya atau kliennya) dalam BAHASA INDONESIA.
Jangan gunakan format poin-poin AI yang kaku seperti (1. Best Choice: ..., 2. Key Differentiating Factors: ...). 
Gunakan paragraf yang mengalir secara alami (maksimal 3-4 paragraf) yang membahas:
- Mengapa ${topChoice.name} adalah pilihan terbaik dan unggul di kriteria apa saja.
- Bandingkan secara singkat dengan ${runnerUp ? runnerUp.name : 'alternatif lainnya'} sebagai runner-up.
- Jelaskan apakah ada kompromi (kelemahan) dari memilih opsi terbaik tersebut (misalnya harganya lebih mahal).
- Berikan kesimpulan dan tingkat keyakinan (confidence) dari hasil perhitungan ini.`;
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

function buildCriteriaSuggestionPrompt(decisionTitle, decisionContext) {
  return `For a decision about "${decisionTitle}" ${decisionContext ? `with context: "${decisionContext}"` : ''}, suggest 3 to 5 evaluation criteria.
  
Respond ONLY with valid JSON:
{
  "criteria": [
    { "name": "...", "weight": <number 1-10>, "type": "benefit" }
  ]
}`;
}

function buildAlternativesSuggestionPrompt(decisionTitle, decisionContext, criteria) {
  const criteriaList = criteria.map(c => `- ${c.name}`).join('\n');
  return `For a decision about "${decisionTitle}" ${decisionContext ? `with context: "${decisionContext}"` : ''}.
The evaluation criteria are:
${criteriaList}

Suggest 3 to 5 strong alternatives.
Respond ONLY with valid JSON:
{
  "alternatives": [
    { "name": "...", "description": "..." }
  ]
}`;
}

function buildScoresSuggestionPrompt(decisionTitle, decisionContext, criteria, alternatives) {
  const criteriaList = criteria.map(c => `- ${c.name}`).join('\n');
  const alternativesList = alternatives.map(a => `- ${a}`).join('\n');
  return `For a decision about "${decisionTitle}" ${decisionContext ? `with context: "${decisionContext}"` : ''}.
We have the following alternatives:
${alternativesList}

And the following criteria:
${criteriaList}

For EACH alternative, estimate a score from 1 to 10 for EACH criteria based on real-world knowledge or logical assumptions.
Return a 2D array matrix called "scores" where rows correspond to alternatives (in the exact order provided) and columns correspond to criteria (in the exact order provided).
Respond ONLY with valid JSON in this exact format, with NO COMMENTS:
{
  "scores": [
    [8, 9, 7],
    [6, 7, 5]
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

async function suggestCriteria(title, context) {
  const prompt = buildCriteriaSuggestionPrompt(title, context);
  return callGroqJSON(prompt);
}

async function suggestAlternatives(title, context, criteria) {
  const prompt = buildAlternativesSuggestionPrompt(title, context, criteria);
  return callGroqJSON(prompt);
}

async function suggestScores(title, context, criteria, alternatives) {
  const prompt = buildScoresSuggestionPrompt(title, context, criteria, alternatives);
  return callGroqJSON(prompt);
}

module.exports = {
  callGroq,
  callGroqJSON,
  generateAnalysis,
  compareAnalyses,
  enrichScores,
  suggestCriteria,
  suggestAlternatives,
  suggestScores,
};
