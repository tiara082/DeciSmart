const express = require('express');
const router = express.Router();
const {
  createDecision,
  getDecisions,
  getDecision,
  updateDecision,
  deleteDecision,
  validateDecision,
} = require('../controllers/decisionController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validators/common');
const { createDecisionValidation, updateDecisionValidation } = require('../validators/decisions');

router.post('/', authenticate, createDecisionValidation, validate, createDecision);
router.get('/', authenticate, getDecisions);
router.get('/:id', authenticate, idParam, validate, getDecision);
router.put('/:id', authenticate, [...idParam, ...updateDecisionValidation], validate, updateDecision);
router.delete('/:id', authenticate, idParam, validate, deleteDecision);
router.get('/:id/validate', authenticate, idParam, validate, validateDecision);

module.exports = router;
