const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/categorize', aiController.categorizeEmail);

router.post('/suggest-reply', aiController.suggestReply);

module.exports = router;