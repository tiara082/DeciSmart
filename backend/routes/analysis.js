const express = require('express');
const router = express.Router();
const {
  getAnalysis,
  runAnalysis,
  sensitivityAnalysis,
} = require('../controllers/analysisController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validators/common');
const {
  runAnalysisValidation,
  sensitivityAnalysisValidation,
} = require('../validators/analysis');

// Decision-scoped endpoints (mounted under /decisions)
router.get('/:id/analysis', authenticate, idParam, validate, getAnalysis);
router.post('/:id/analysis/run', authenticate, idParam, runAnalysisValidation, validate, runAnalysis);
router.post('/:id/analysis/sensitivity', authenticate, idParam, sensitivityAnalysisValidation, validate, sensitivityAnalysis);

module.exports = router;
