const aiCategorizationService = require('../services/aiCategorizationService');
const aiReplyService = require('../services/aiReplyService');
const memoryStorage = require('../services/memoryStorageService');

exports.categorizeEmail = async (req, res) => {
  try {
    const { emailId } = req.body;

    console.log('🏷️ Categorizing email:', emailId);

    const email = memoryStorage.getEmail(emailId);
    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    const category = await aiCategorizationService.categorizeEmail(email);

    console.log('✅ Email categorized as:', category);

    // Update the email category in memory storage
    memoryStorage.updateEmailCategory(emailId, category);

    res.json({
      success: true,
      data: {
        messageId: emailId,
        category: category
      },
      message: 'Email categorized successfully'
    });
  } catch (error) {
    console.error('❌ Categorization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to categorize email: ' + error.message
    });
  }
};

exports.suggestReply = async (req, res) => {
  try {
    const { emailId, context } = req.body;

    console.log('🤖 Generating reply suggestions for:', emailId, 'context:', context);

    const email = memoryStorage.getEmail(emailId);
    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    // Use AI to generate contextual replies
    const suggestedReplies = await aiReplyService.generateSuggestedReplies(email, context);

    const isAIGenerated = !aiReplyService.getFallbackReplies().includes(suggestedReplies[0]);

    console.log('✅ Reply suggestions generated:', {
      count: suggestedReplies.length,
      isAIGenerated: isAIGenerated,
      firstReply: suggestedReplies[0]?.substring(0, 50) + '...'
    });

    res.json({
      success: true,
      data: {
        suggestedReplies: suggestedReplies,
        contextUsed: context || 'job_application',
        isAIGenerated: isAIGenerated,
        aiServiceStatus: aiReplyService.getStatus()
      }
    });
  } catch (error) {
    console.error('❌ Reply suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggested replies: ' + error.message,
      data: {
        suggestedReplies: aiReplyService.getFallbackReplies(),
        isAIGenerated: false,
        aiServiceStatus: aiReplyService.getStatus()
      }
    });
  }
};

// Get AI service status
exports.getAIStatus = async (req, res) => {
  try {
    const categorizationStatus = aiCategorizationService.getStatus ? aiCategorizationService.getStatus() : { enabled: true };
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
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};