require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { generateAnalysis } = require('./services/groq');
const mcdm = require('./utils/mcdm');

async function check() {
  const { data: decision, error } = await supabase.from('decisions').select('*, alternatives(*), criteria(*)').eq('id', '39f6daa7-93f5-4799-8c6a-a576e03810a2').single();
  if (error) { console.error(error); return; }
  
  const { data: scores } = await supabase.from('scores').select('*').in('alternative_id', decision.alternatives.map(a => a.id));
  decision.scores = scores;
  
  try {
    const mcdmResult = mcdm.analyze('SAW', decision.alternatives, decision.criteria, decision.scores, {});
    console.log('MCDM Result:', mcdmResult.rankings);
    console.log('Calling Groq...');
    const reasoning = await generateAnalysis(decision, mcdmResult);
    console.log('Reasoning:', reasoning.substring(0, 50));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
