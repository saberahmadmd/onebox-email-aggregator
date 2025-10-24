const express = require('express');
const router = express.Router();

// Send email reply
router.post('/send', async (req, res) => {
  try {
    const { accountEmail, emailId, replyContent, subjectPrefix = 'Re: ' } = req.body;

    console.log('📤 Sending email reply:', {
      accountEmail,
      emailId,
      replyLength: replyContent?.length
    });

    if (!accountEmail || !emailId || !replyContent) {
      return res.status(400).json({
        success: false,
        error: 'accountEmail, emailId, and replyContent are required'
      });
    }

    // Get the original email
    const memoryStorage = require('../services/memoryStorageService');
    const originalEmail = memoryStorage.getEmail(emailId);

    if (!originalEmail) {
      return res.status(404).json({
        success: false,
        error: 'Original email not found'
      });
    }

    // Send the reply
    const accountManager = require('../services/accountManager');
    const result = await accountManager.sendReply(accountEmail, originalEmail, replyContent, subjectPrefix);

    if (result.success) {
      res.json({
        success: true,
        message: 'Reply sent successfully',
        data: {
          messageId: result.messageId,
          to: originalEmail.from.address,
          subject: subjectPrefix + (originalEmail.subject || 'No Subject')
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Send reply error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get SMTP status for an account
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const smtpService = require('../services/smtpService');
    const status = smtpService.getStatus(email);

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;