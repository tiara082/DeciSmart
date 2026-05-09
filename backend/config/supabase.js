const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

// Client untuk operasi umum (dengan RLS)
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

// Admin client untuk operasi yang butuh bypass RLS
const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = { supabase, supabaseAdmin };
