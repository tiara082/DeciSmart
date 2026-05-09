const express = require('express');
const router = express.Router();
const {
  generateRecommendation,
  compareMethods,
  enrichAlternative,
  getRecommendation,
} = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validators/common');
const {
  compareMethodsValidation,
  enrichAlternativeValidation,
} = require('../validators/analysis');

router.post('/:id/analyze', authenticate, idParam, validate, generateRecommendation);
router.post('/:id/compare', authenticate, idParam, compareMethodsValidation, validate, compareMethods);
router.post('/:id/enrich', authenticate, idParam, enrichAlternativeValidation, validate, enrichAlternative);
router.get('/:id/recommendation', authenticate, idParam, validate, getRecommendation);

module.exports = router;
