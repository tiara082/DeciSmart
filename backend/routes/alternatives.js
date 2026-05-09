const express = require('express');
const router = express.Router();
const {
  addAlternative,
  updateAlternative,
  removeAlternative,
} = require('../controllers/decisionController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validators/common');
const { addAlternativeValidation, updateAlternativeValidation } = require('../validators/decisions');
const { param } = require('express-validator');

const altIdParam = [
  param('altId').isUUID().withMessage('Invalid alternative ID'),
];

router.post('/:id/alternatives', authenticate, [...idParam, ...addAlternativeValidation], validate, addAlternative);
router.put('/:id/alternatives/:altId', authenticate, [...idParam, ...altIdParam, ...updateAlternativeValidation], validate, updateAlternative);
router.delete('/:id/alternatives/:altId', authenticate, [...idParam, ...altIdParam], validate, removeAlternative);

module.exports = router;
