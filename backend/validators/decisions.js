
const { body, param } = require('express-validator');

const createDecisionValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim(),
  body('domain_category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Domain category must be max 50 characters'),
];

const updateDecisionValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .optional()
    .trim(),
  body('domain_category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Domain category must be max 50 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'completed', 'archived'])
    .withMessage('Status must be draft, active, completed, or archived'),
];

const addAlternativeValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Alternative name is required (max 150 characters)'),
  body('description')
    .optional()
    .trim(),
  body('order_index')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order index must be a non-negative integer'),
];

const updateAlternativeValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Alternative name must be 1-150 characters'),
  body('description')
    .optional()
    .trim(),
  body('order_index')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order index must be a non-negative integer'),
];

const addCriteriaValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Criteria name is required (max 100 characters)'),
  body('weight')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Weight must be between 0 and 100'),
  body('type')
    .isIn(['benefit', 'cost'])
    .withMessage('Type must be "benefit" or "cost"'),
  body('description')
    .optional()
    .trim(),
  body('order_index')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order index must be a non-negative integer'),
];

const updateCriteriaValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Criteria name must be 1-100 characters'),
  body('weight')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Weight must be between 0 and 100'),
  body('type')
    .optional()
    .isIn(['benefit', 'cost'])
    .withMessage('Type must be "benefit" or "cost"'),
  body('description')
    .optional()
    .trim(),
  body('order_index')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order index must be a non-negative integer'),
];

const upsertScoresValidation = [
  body('scores')
    .isArray({ min: 1 })
    .withMessage('Scores must be a non-empty array'),
  body('scores.*.alternative_id')
    .isUUID()
    .withMessage('Each score must have a valid alternative_id'),
  body('scores.*.criteria_id')
    .isUUID()
    .withMessage('Each score must have a valid criteria_id'),
  body('scores.*.raw_value')
    .isFloat()
    .withMessage('Each score must have a numeric raw_value'),
];

const decisionIdValidation = [
  param('decisionId')
    .isUUID()
    .withMessage('Invalid decision ID'),
];

const idParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid decision ID'),
];

module.exports = {
  createDecisionValidation,
  updateDecisionValidation,
  addAlternativeValidation,
  updateAlternativeValidation,
  addCriteriaValidation,
  updateCriteriaValidation,
  upsertScoresValidation,
  decisionIdValidation,
  idParamValidation,
};
