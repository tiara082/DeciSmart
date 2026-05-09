const express = require('express');
const router = express.Router();
const { upsertScores } = require('../controllers/decisionController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validators/common');
const { upsertScoresValidation } = require('../validators/decisions');

router.post('/:id/scores', authenticate, [...idParam, ...upsertScoresValidation], validate, upsertScores);

module.exports = router;
