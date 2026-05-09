const { body, query } = require('express-validator');

const getUsersQuery = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be max 100 characters'),
  query('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be "user" or "admin"'),
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const updateUserRoleValidation = [
  body('role')
    .notEmpty()
    .isIn(['user', 'admin'])
    .withMessage('Role must be "user" or "admin"'),
];

const getDecisionsQuery = [
  query('status')
    .optional()
    .isIn(['draft', 'active', 'completed', 'archived'])
    .withMessage('Status must be draft, active, completed, or archived'),
  query('user_id')
    .optional()
    .isUUID()
    .withMessage('user_id must be a valid UUID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

module.exports = {
  getUsersQuery,
  updateUserRoleValidation,
  getDecisionsQuery,
};
