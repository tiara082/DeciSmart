const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { logger } = require('./middleware/logger');

const app = express();

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;

  if (config.cors.origins.includes(origin)) return true;

  try {
    const hostname = new URL(origin).hostname;
    return hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname.endsWith('.vercel.app')
      || hostname === 'vercel.app';
  } catch {
    return false;
  }
}

// Request logging
app.use(logger);

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin(origin, callback) {
    if (isAllowedCorsOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, message: 'Too many requests' },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`DeciSmart API running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

module.exports = app;
