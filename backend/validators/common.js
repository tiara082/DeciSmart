const { param, query } = require('express-validator');

// ================================================================
// PARAM VALIDATORS
// ================================================================

const idParam = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
];

const decisionIdParam = [
  param('decisionId')
    .isUUID()
    .withMessage('Invalid decision ID'),
];

const altIdParam = [
  param('altId')
    .isUUID()
    .withMessage('Invalid alternative ID'),
];

const criIdParam = [
  param('criId')
    .isUUID()
    .withMessage('Invalid criteria ID'),
];

const historyIdParam = [
  param('historyId')
    .isUUID()
    .withMessage('Invalid history entry ID'),
];

const userIdParam = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID'),
];

// ================================================================
// QUERY VALIDATORS
// ================================================================

const paginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const searchQuery = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be max 100 characters'),
];

const dateRangeQuery = [
  query('from_date')
    .optional()
    .isISO8601()
    .withMessage('from_date must be a valid ISO 8601 date'),
  query('to_date')
    .optional()
    .isISO8601()
    .withMessage('to_date must be a valid ISO 8601 date'),
];

const sortQuery = (allowedFields = []) => [
  query('sort_by')
    .optional()
    .isIn(allowedFields)
    .withMessage(`sort_by must be one of: ${allowedFields.join(', ')}`),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sort_order must be "asc" or "desc"'),
];

module.exports = {
  idParam,
  decisionIdParam,
  altIdParam,
  criIdParam,
  historyIdParam,
  userIdParam,
  paginationQuery,
  searchQuery,
  dateRangeQuery,
  sortQuery,
};
