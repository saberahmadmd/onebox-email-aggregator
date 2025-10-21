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











/*
// backend/routes/emails.js
const express = require('express');
const router = express.Router();
const elasticsearchService = require('../services/elasticsearchService');

// Search emails
router.get('/search', async (req, res) => {
  try {
    const { q, account, category, folder, page = 1, limit = 20 } = req.query;

    const from = (parseInt(page) - 1) * parseInt(limit);
    const result = await elasticsearchService.searchEmails(
      q,
      { account, category, folder },
      from,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result.emails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search emails'
    });
  }
});

// Get email by ID
router.get('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const email = await elasticsearchService.getEmail(messageId);

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

// Get email statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const result = await elasticsearchService.searchEmails('', {}, 0, 1000);
    const emails = result.emails;

    const stats = {
      total: emails.length,
      interested: emails.filter(e => e.category === 'Interested').length,
      meetings: emails.filter(e => e.category === 'Meeting Booked').length,
      spam: emails.filter(e => e.category === 'Spam').length,
      accounts: [...new Set(emails.map(e => e.account))].length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

module.exports = router;
*/