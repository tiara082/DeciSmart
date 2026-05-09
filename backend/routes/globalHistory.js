const express = require('express');
const router = express.Router();
const {
  getGlobalHistory,
  getHistoryEntry,
  getActivityStats,
} = require('../controllers/historyController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { historyIdParam, paginationQuery, dateRangeQuery } = require('../validators/common');
const { query } = require('express-validator');

const historyFilterQuery = [
  query('action_type')
    .optional()
    .isIn(['created', 'analyzed', 'viewed', 'duplicated', 'archived', 'deleted'])
    .withMessage('Invalid action type'),
];

// Global history endpoints (mounted under /history)
router.use(authenticate);

router.get('/', [...paginationQuery, ...dateRangeQuery, ...historyFilterQuery], validate, getGlobalHistory);
router.get('/stats', getActivityStats);
router.get('/entry/:historyId', historyIdParam, validate, getHistoryEntry);

module.exports = router;
