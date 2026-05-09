const { body } = require('express-validator');

const runAnalysisValidation = [
  body('method')
    .optional()
    .isIn(['TOPSIS', 'SAW', 'VIKOR'])
    .withMessage('Method must be TOPSIS, SAW, or VIKOR'),
  body('v')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('V parameter (for VIKOR) must be between 0 and 1'),
];

const sensitivityAnalysisValidation = [
  body('method')
    .optional()
    .isIn(['TOPSIS', 'SAW', 'VIKOR'])
    .withMessage('Method must be TOPSIS, SAW, or VIKOR'),
  body('criteria_id')
    .isUUID()
    .withMessage('criteria_id is required and must be a valid UUID'),
  body('weight_range')
    .optional()
    .isObject()
    .withMessage('weight_range must be an object'),
  body('weight_range.min')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('weight_range.min must be between 0 and 100'),
  body('weight_range.max')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('weight_range.max must be between 0 and 100'),
  body('weight_range.steps')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('weight_range.steps must be between 2 and 50'),
];

const compareMethodsValidation = [
  body('methods')
    .optional()
    .isArray({ min: 2 })
    .withMessage('methods must be an array with at least 2 methods'),
  body('methods.*')
    .isIn(['TOPSIS', 'SAW', 'VIKOR'])
    .withMessage('Each method must be TOPSIS, SAW, or VIKOR'),
];

const enrichAlternativeValidation = [
  body('alternative_id')
    .isUUID()
    .withMessage('alternative_id is required and must be a valid UUID'),
];

module.exports = {
  runAnalysisValidation,
  sensitivityAnalysisValidation,
  compareMethodsValidation,
  enrichAlternativeValidation,
};
