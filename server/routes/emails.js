const express = require('express');
const router = express.Router();
const memoryStorage = require('../services/memoryStorageService');

// Search emails
router.get('/search', (req, res) => {
  try {
    const { q, account, category, page = 1, limit = 20 } = req.query;

    const result = memoryStorage.searchEmails(
      q || '',
      { account, category },
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result.emails,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    });
  }
});

// Get email statistics
router.get('/stats/overview', (req, res) => {
  try {
    const stats = memoryStorage.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({
      success: true,
      data: {
        total: 0, interested: 0, meetings: 0, notInterested: 0,
        spam: 0, outOfOffice: 0, uncategorized: 0, accounts: 0
      }
    });
  }
});

// Get email by ID
router.get('/:messageId', (req, res) => {
  try {
    const { messageId } = req.params;
    const email = memoryStorage.getEmail(messageId);

    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    res.json({
      success: true,
      data: email
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email'
    });
  }
});

module.exports = router;