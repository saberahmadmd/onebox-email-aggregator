const express = require('express');
const router = express.Router();

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Accounts route is working',
    timestamp: new Date().toISOString()
  });
});

// Add IMAP account with background processing
router.post('/', async (req, res) => {
  try {
    req.setTimeout(120000); // Increase to 2 minutes
    
    console.log('📨 Received account add request:', {
      email: req.body.email,
      host: req.body.host,
      hasPassword: !!req.body.password
    });

    const { email, password, host, port, tls } = req.body;

    // Validate required fields
    if (!email || !password || !host) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Email, password, and host are required'
      });
    }

    console.log(`🔄 Processing account for: ${email}`);

    // Return immediate response and process in background
    res.json({
      success: true,
      message: 'Account addition started. This may take 1-2 minutes...',
      data: { 
        email: email,
        status: 'connecting',
        message: 'Account is being added in background. Check accounts list in a few minutes.'
      }
    });

    // Process account addition in background
    setTimeout(async () => {
      try {
        const accountManager = require('../services/accountManager');
        const account = await accountManager.addAccount({
          email,
          password,
          host,
          port: port || 993,
          tls: tls !== false
        });

        console.log(`✅ Background account addition successful: ${email}`);
        
        // Broadcast update via WebSocket
        if (global.broadcastFunction) {
          global.broadcastFunction({
            type: 'account_added',
            account: account,
            message: `Account ${email} added successfully`
          });
        }
      } catch (error) {
        console.error('💥 Background account addition failed:', error.message);
        
        // Broadcast error via WebSocket
        if (global.broadcastFunction) {
          global.broadcastFunction({
            type: 'account_error',
            email: email,
            error: error.message
          });
        }
      }
    }, 100);

  } catch (error) {
    console.error('💥 Add account error:', error.message);

    // Provide user-friendly error messages
    let errorMessage = error.message;

    if (error.message.includes('Invalid credentials') || error.message.includes('Authentication failed')) {
      errorMessage = 'Invalid email or password. For Gmail, use an App Password instead of your regular password.';
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      errorMessage = `Cannot connect to IMAP server: ${req.body.host}. Please check the server address.`;
    } else if (error.message.includes('Timed out')) {
      errorMessage = 'Connection timed out. Please check your network connection and try again.';
    } else if (error.message.includes('self signed certificate')) {
      errorMessage = 'SSL certificate error. Try disabling TLS or check server certificate.';
    } else if (error.message.includes('SMTP setup failed')) {
      errorMessage = 'Email receiving setup successful, but sending replies may not work. You can still receive and manage emails.';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      // Include original error in development for debugging
      ...(process.env.NODE_ENV === 'development' && {
        originalError: error.message
      })
    });
  }
});

// Get all accounts
router.get('/', (req, res) => {
  try {
    console.log('📊 Getting all accounts');
    const accountManager = require('../services/accountManager');
    const accounts = accountManager.getAccounts();

    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get accounts: ' + error.message
    });
  }
});

// Remove account
router.delete('/:email', (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter is required'
      });
    }

    console.log(`🗑️ Removing account: ${email}`);
    const accountManager = require('../services/accountManager');
    accountManager.removeAccount(email);

    res.json({
      success: true,
      message: 'Account removed successfully'
    });
  } catch (error) {
    console.error('Remove account error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test account status
router.get('/status/:email', (req, res) => {
  try {
    const { email } = req.params;
    const accountManager = require('../services/accountManager');
    const accounts = accountManager.getAccounts();
    const account = accounts.find(acc => acc.email === email);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;




/*
const express = require('express');
const router = express.Router();

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Accounts route is working',
    timestamp: new Date().toISOString()
  });
});

// Add IMAP account with enhanced error handling
router.post('/', async (req, res) => {
  try {
    req.setTimeout(120000);
    console.log('📨 Received account add request:', {
      email: req.body.email,
      host: req.body.host,
      hasPassword: !!req.body.password
    });

    const { email, password, host, port, tls } = req.body;

    // Validate required fields
    if (!email || !password || !host) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Email, password, and host are required'
      });
    }

    console.log(`🔄 Processing account for: ${email}`);

    // Import accountManager inside function to avoid circular dependencies
    const accountManager = require('../services/accountManager');

    const account = await accountManager.addAccount({
      email,
      password,
      host,
      port: port || 993,
      tls: tls !== false
    });

    console.log(`✅ Account added successfully: ${email}`);

    res.json({
      success: true,
      data: account,
      message: 'Account added successfully'
    });

  } catch (error) {
    console.error('💥 Add account error:', error.message);

    // Provide user-friendly error messages
    let errorMessage = error.message;

    if (error.message.includes('Invalid credentials') || error.message.includes('Authentication failed')) {
      errorMessage = 'Invalid email or password. For Gmail, use an App Password instead of your regular password.';
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      errorMessage = `Cannot connect to IMAP server: ${req.body.host}. Please check the server address.`;
    } else if (error.message.includes('Timed out')) {
      errorMessage = 'Connection timed out. Please check your network connection and try again.';
    } else if (error.message.includes('self signed certificate')) {
      errorMessage = 'SSL certificate error. Try disabling TLS or check server certificate.';
    } else if (error.message.includes('SMTP setup failed')) {
      errorMessage = 'Email receiving setup successful, but sending replies may not work. You can still receive and manage emails.';
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      // Include original error in development for debugging
      ...(process.env.NODE_ENV === 'development' && {
        originalError: error.message
      })
    });
  }
});

// Get all accounts - FIXED: Now uses the correct method
router.get('/', (req, res) => {
  try {
    console.log('📊 Getting all accounts');
    const accountManager = require('../services/accountManager');
    const accounts = accountManager.getAccounts();

    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get accounts: ' + error.message
    });
  }
});

// Remove account
router.delete('/:email', (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter is required'
      });
    }

    console.log(`🗑️ Removing account: ${email}`);
    const accountManager = require('../services/accountManager');
    accountManager.removeAccount(email);

    res.json({
      success: true,
      message: 'Account removed successfully'
    });
  } catch (error) {
    console.error('Remove account error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
*/
