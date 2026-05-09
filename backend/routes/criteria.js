const express = require('express');
const router = express.Router();
const {
  addCriteria,
  updateCriteria,
  removeCriteria,
} = require('../controllers/decisionController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validators/common');
const { addCriteriaValidation, updateCriteriaValidation } = require('../validators/decisions');
const { param } = require('express-validator');

const criIdParam = [
  param('criId').isUUID().withMessage('Invalid criteria ID'),
];

router.post('/:id/criteria', authenticate, [...idParam, ...addCriteriaValidation], validate, addCriteria);
router.put('/:id/criteria/:criId', authenticate, [...idParam, ...criIdParam, ...updateCriteriaValidation], validate, updateCriteria);
router.delete('/:id/criteria/:criId', authenticate, [...idParam, ...criIdParam], validate, removeCriteria);

module.exports = router;
