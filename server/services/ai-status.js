const express = require('express');
const router = express.Router();
const aiCategorizationService = require('../services/aiCategorizationService');
const aiReplyService = require('../services/aiReplyService');

// Get AI service status
router.get('/status', (req, res) => {
  try {
    const categorizationStatus = aiCategorizationService.getStatus();
    const replyServiceStatus = aiReplyService.getStatus();

    res.json({
      success: true,
      data: {
        categorization: categorizationStatus,
        replyService: replyServiceStatus,
        environment: {
          hasGeminiKey: !!process.env.GEMINI_API_KEY,
          geminiKeyValid: !process.env.GEMINI_API_KEY?.includes('your_gemini')
        }
      },
      message: 'AI Services Status'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reset AI services (for development)
router.post('/reset', (req, res) => {
  try {
    // This would require modifying your services to allow reset
    // For now, just return current status
    res.json({
      success: true,
      message: 'AI services would be reset (implementation needed)',
      data: {
        categorization: aiCategorizationService.getStatus(),
        replyService: aiReplyService.getStatus()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
