const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const decisionRoutes = require('./decisions');
const alternativeRoutes = require('./alternatives');
const criteriaRoutes = require('./criteria');
const scoreRoutes = require('./scores');
const analysisRoutes = require('./analysis');
const globalAnalysisRoutes = require('./globalAnalysis');
const recommendationRoutes = require('./recommendations');
const historyRoutes = require('./history');
const globalHistoryRoutes = require('./globalHistory');
const adminRoutes = require('./admin');
const aiRoutes = require('./ai');

// Auth
router.use('/auth', authRoutes);

// Decision CRUD + sub-resources (mounted under /decisions)
router.use('/decisions', decisionRoutes);
router.use('/decisions', alternativeRoutes);
router.use('/decisions', criteriaRoutes);
router.use('/decisions', scoreRoutes);
router.use('/decisions', analysisRoutes);
router.use('/decisions', recommendationRoutes);
router.use('/decisions', historyRoutes);

// Global endpoints
router.use('/history', globalHistoryRoutes);
router.use('/analysis', globalAnalysisRoutes);

// Admin
router.use('/admin', adminRoutes);

// AI
router.use('/ai', aiRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'DeciSmart API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      decisions: '/api/decisions',
      history: '/api/history',
      analysis: '/api/analysis',
      admin: '/api/admin',
    },
  });
});

module.exports = router;
