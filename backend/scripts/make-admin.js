require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function makeAdmin() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ role: 'admin' })
    .eq('email', 'admin@decismart.com')
    .select('id, email, full_name, role');

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('✅ User upgraded to admin:', JSON.stringify(data, null, 2));
  }
  process.exit(0);
}

makeAdmin();
