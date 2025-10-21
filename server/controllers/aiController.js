const aiCategorizationService = require('../services/aiCategorizationService');
const aiReplyService = require('../services/aiReplyService'); // Add this import
const memoryStorage = require('../services/memoryStorageService');

exports.categorizeEmail = async (req, res) => {
  try {
    const { emailId } = req.body;

    const email = memoryStorage.getEmail(emailId);
    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    const category = await aiCategorizationService.categorizeEmail(email);

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
    console.error('Categorization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to categorize email'
    });
  }
};

exports.suggestReply = async (req, res) => {
  try {
    const { emailId, context } = req.body;

    const email = memoryStorage.getEmail(emailId);
    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    // Use AI to generate contextual replies
    const suggestedReplies = await aiReplyService.generateSuggestedReplies(email, context);

    res.json({
      success: true,
      data: {
        suggestedReplies: suggestedReplies,
        contextUsed: context || 'default'
      }
    });
  } catch (error) {
    console.error('Reply suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggested replies'
    });
  }
};
