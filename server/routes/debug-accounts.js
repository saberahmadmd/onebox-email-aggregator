const express = require('express');
const router = express.Router();

// Test IMAP connection without adding to manager
router.post('/test-connection', async (req, res) => {
  try {
    const { email, password, host, port = 993, tls = true } = req.body;

    console.log('🧪 Testing IMAP connection:', { email, host, port, tls });

    if (!email || !password || !host) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and host are required'
      });
    }

    // Test connection directly
    const Imap = require('imap');

    const imap = new Imap({
      user: email,
      password: password,
      host: host,
      port: port,
      tls: tls,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
      connTimeout: 10000
    });

    await new Promise((resolve, reject) => {
      imap.once('ready', resolve);
      imap.once('error', reject);
      imap.connect();
    });

    imap.end();

    res.json({
      success: true,
      message: 'IMAP connection successful!',
      data: {
        email,
        host,
        port,
        tls
      }
    });

  } catch (error) {
    console.error('🧪 IMAP connection test failed:', error.message);

    let userMessage = error.message;
    if (error.message.includes('Invalid credentials')) {
      userMessage = 'Invalid email or password. For Gmail, use an App Password.';
    } else if (error.message.includes('ECONNREFUSED')) {
      userMessage = 'Cannot connect to the IMAP server. Check the host and port.';
    }

    res.status(400).json({
      success: false,
      error: userMessage,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;