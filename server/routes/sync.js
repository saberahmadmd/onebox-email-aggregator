const express = require('express');
const router = express.Router();

// Manual sync endpoint
router.post('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { days = 7 } = req.body;

    console.log(`🔄 Manual sync requested for: ${email}, days: ${days}`);

    const accountManager = require('../services/accountManager');
    const emailCount = await accountManager.syncAccountEmails(email, days);

    res.json({
      success: true,
      message: `Synced ${emailCount} emails from ${email}`,
      data: {
        email,
        syncedCount: emailCount,
        days: days
      }
    });

  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get sync status
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const memoryStorage = require('../services/memoryStorageService');

    const accountEmails = memoryStorage.emails.filter(e => e.account === email);

    res.json({
      success: true,
      data: {
        email: email,
        totalEmails: accountEmails.length,
        categories: {
          interested: accountEmails.filter(e => e.category === 'Interested').length,
          meetings: accountEmails.filter(e => e.category === 'Meeting Booked').length,
          notInterested: accountEmails.filter(e => e.category === 'Not Interested').length,
          spam: accountEmails.filter(e => e.category === 'Spam').length,
          outOfOffice: accountEmails.filter(e => e.category === 'Out of Office').length,
          uncategorized: accountEmails.filter(e => e.category === 'uncategorized').length
        }
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