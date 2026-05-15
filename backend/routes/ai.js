const express = require('express');
const router = express.Router();
const { success, error } = require('../utils/response');
const groqService = require('../services/groq');
const { authenticate } = require('../middleware/auth');

// POST /api/ai/suggest-criteria
router.post('/suggest-criteria', authenticate, async (req, res, next) => {
  try {
    const { title, context } = req.body;
    if (!title) {
      return error(res, 'Decision title is required', 400);
    }
    const result = await groqService.suggestCriteria(title, context);
    if (!result || !result.criteria) {
      return error(res, 'Failed to generate criteria', 500);
    }
    return success(res, result.criteria, 'Criteria suggested');
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/suggest-alternatives
router.post('/suggest-alternatives', authenticate, async (req, res, next) => {
  try {
    const { title, context, criteria } = req.body;
    if (!title) {
      return error(res, 'Decision title is required', 400);
    }
    const result = await groqService.suggestAlternatives(title, context, criteria || []);
    if (!result || !result.alternatives) {
      return error(res, 'Failed to generate alternatives', 500);
    }
    return success(res, result.alternatives, 'Alternatives suggested');
  } catch (err) {
    next(err);
  }
});
// POST /api/ai/suggest-scores
router.post('/suggest-scores', authenticate, async (req, res, next) => {
  try {
    const { title, context, criteria, alternatives } = req.body;
    if (!title || !criteria || !alternatives) {
      return error(res, 'Decision title, criteria, and alternatives are required', 400);
    }
    const result = await groqService.suggestScores(title, context, criteria, alternatives);
    if (!result || !result.scores) {
      return error(res, 'Failed to generate scores', 500);
    }
    return success(res, result.scores, 'Scores suggested');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
