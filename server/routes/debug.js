const express = require('express');
const router = express.Router();

// Test if services are loading correctly
router.get('/services', (req, res) => {
  try {
    const services = {
      accountManager: 'Loading...',
      memoryStorage: 'Loading...',
      aiService: 'Loading...',
      notificationService: 'Loading...'
    };

    try {
      const accountManager = require('../services/accountManager');
      services.accountManager = '✅ Loaded';
    } catch (e) {
      services.accountManager = `❌ Error: ${e.message}`;
    }

    try {
      const memoryStorage = require('../services/memoryStorageService');
      services.memoryStorage = '✅ Loaded';
    } catch (e) {
      services.memoryStorage = `❌ Error: ${e.message}`;
    }

    try {
      const aiService = require('../services/aiCategorizationService');
      services.aiService = '✅ Loaded';
    } catch (e) {
      services.aiService = `❌ Error: ${e.message}`;
    }

    try {
      const notificationService = require('../services/notificationService');
      services.notificationService = '✅ Loaded';
    } catch (e) {
      services.notificationService = `❌ Error: ${e.message}`;
    }

    res.json({ success: true, services });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test account addition with mock data
router.post('/test-account', async (req, res) => {
  try {
    console.log('🧪 DEBUG: Testing account addition with mock');

    // Simulate a successful account addition
    const mockAccount = {
      email: 'test@example.com',
      status: 'connected',
      synced: true,
      historicalCount: 0
    };

    res.json({
      success: true,
      data: mockAccount,
      message: 'Mock account added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;