const express = require('express');
const router = express.Router();
const { getMethods } = require('../controllers/analysisController');

// Public endpoint (mounted under /analysis)
router.get('/methods', getMethods);

module.exports = router;
