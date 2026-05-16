require('dotenv').config();

function parseCorsOrigins(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const defaultCorsOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const configuredCorsOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);

module.exports = {
  // Server
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  // Groq AI
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },

  // CORS
  cors: {
    origins: configuredCorsOrigins.length > 0
      ? configuredCorsOrigins
      : defaultCorsOrigins,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
};
