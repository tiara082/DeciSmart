const express = require('express');
const router = express.Router();
const {
  getHistory,
  getHistoryEntry,
  clearHistory,
  getActivityStats,
} = require('../controllers/historyController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParam, historyIdParam, paginationQuery } = require('../validators/common');
const { query } = require('express-validator');

const historyFilterQuery = [
  query('action_type')
    .optional()
    .isIn(['created', 'analyzed', 'viewed', 'duplicated', 'archived', 'deleted'])
    .withMessage('Invalid action type'),
];

// Decision-scoped history (mounted under /decisions)
// GET /api/decisions/:id/history
router.get('/:id/history', authenticate, [...idParam, ...paginationQuery, ...historyFilterQuery], validate, getHistory);
// DELETE /api/decisions/:id/history
router.delete('/:id/history', authenticate, idParam, validate, clearHistory);

module.exports = router;
