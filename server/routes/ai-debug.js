const express = require('express');
const router = express.Router();
const aiReplyService = require('../services/aiReplyService');

// Test AI service status
router.get('/status', (req, res) => {
  const status = aiReplyService.getStatus();
  res.json({
    success: true,
    data: status,
    message: 'AI Service Status'
  });
});

// Test AI with sample email
router.post('/test', async (req, res) => {
  try {
    const { contextType = "job_application" } = req.body;

    console.log('🧪 Testing AI service with context:', contextType);

    const sampleEmail = {
      subject: "Interview Invitation",
      text: "Hi, we were impressed with your resume and would like to schedule an interview. When are you available?",
      from: {
        name: "HR Manager",
        address: "hr@company.com"
      }
    };

    const replies = await aiReplyService.generateSuggestedReplies(sampleEmail, contextType);

    res.json({
      success: true,
      data: {
        replies,
        contextUsed: contextType,
        isAIGenerated: !aiReplyService.getFallbackReplies().includes(replies[0])
      },
      message: 'AI Test Completed'
    });

  } catch (error) {
    console.error('AI Test Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;