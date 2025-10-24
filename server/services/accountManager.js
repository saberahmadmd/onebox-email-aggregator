const IMAPService = require('./imapService');
const smtpService = require('./smtpService');

class AccountManager {
  constructor() {
    this.accounts = new Map();
    console.log('✅ AccountManager initialized');
  }

  async addAccount(config) {
    console.log('🔍 DEBUG: Starting addAccount with config:', {
      email: config.email,
      host: config.host,
      port: config.port,
      hasPassword: !!config.password,
      tls: config.tls
    });

    try {
      // Step 1: Validate config
      if (!config.email || !config.password || !config.host) {
        throw new Error('Email, password, and host are required');
      }

      // Step 2: Create IMAP service
      const imapService = new IMAPService(config);

      // Step 3: Attempt IMAP connection
      await imapService.connect();
      console.log('✅ DEBUG: IMAP connection successful');

      // Step 4: Setup SMTP transporter (but don't fail the whole process if SMTP fails)
      let smtpEnabled = false;
      try {
        console.log('🔧 Setting up SMTP for sending replies...');
        await smtpService.createTransporter(config);
        smtpEnabled = true;
        console.log('✅ SMTP setup completed');
      } catch (smtpError) {
        console.warn('⚠️ SMTP setup failed, but continuing with IMAP only:', smtpError.message);
        // Continue without SMTP - the account will still work for receiving emails
      }

      // Step 5: Set up event listeners
      this.setupEmailHandlers(imapService, config.email);

      // Step 6: Sync historical emails
      console.log('🔍 DEBUG: Starting historical email sync');
      const historicalEmails = await imapService.syncHistoricalEmails(7);
      console.log(`✅ DEBUG: Synced ${historicalEmails.length} historical emails`);

      // Step 7: Store historical emails in memory
      const memoryStorage = require('./memoryStorageService');
      historicalEmails.forEach(email => {
        memoryStorage.addEmail(email);
      });

      // Add account to memory storage
      memoryStorage.addAccount({
        email: config.email,
        host: config.host,
        status: 'connected',
        smtpEnabled: smtpEnabled
      });

      // Step 8: Start real-time sync
      imapService.startRealTimeSync();

      // Step 9: Store account
      this.accounts.set(config.email, {
        imap: imapService,
        config: config,
        smtpEnabled: smtpEnabled
      });

      console.log(`✅ DEBUG: Account ${config.email} added successfully`);

      return {
        email: config.email,
        status: 'connected',
        synced: true,
        historicalCount: historicalEmails.length,
        smtpEnabled: smtpEnabled
      };

    } catch (error) {
      console.error('💥 DEBUG: CRITICAL ERROR in addAccount:', error.message);
      throw error;
    }
  }

  setupEmailHandlers(imapService, email) {
    // Handle new emails received in real-time
    imapService.on('emailReceived', async (emailData) => {
      try {
        console.log(`📧 DEBUG: New email received: ${emailData.subject}`);

        const memoryStorage = require('./memoryStorageService');
        const aiCategorizationService = require('./aiCategorizationService');
        const notificationService = require('./notificationService');

        // Categorize email using AI
        try {
          emailData.category = await aiCategorizationService.categorizeEmail(emailData);
          console.log(`🏷️ DEBUG: Email categorized as: ${emailData.category}`);
        } catch (aiError) {
          console.error('❌ AI categorization failed:', aiError);
          emailData.category = 'uncategorized';
        }

        // Store in memory
        memoryStorage.addEmail(emailData);

        // Send notifications for interested emails
        if (emailData.category === 'Interested') {
          try {
            await notificationService.sendSlackNotification(emailData);
            await notificationService.triggerWebhook(emailData);
          } catch (notifyError) {
            console.error('❌ Notification failed:', notifyError);
          }
        }

        // Broadcast to all connected clients
        if (global.broadcastFunction) {
          global.broadcastFunction({
            type: 'new_email',
            email: emailData
          });
        }

      } catch (error) {
        console.error('❌ DEBUG: Error processing email:', error);
      }
    });

    // Handle connection errors
    imapService.connection.on('error', (err) => {
      console.error(`❌ IMAP error for ${email}:`, err.message);
    });

    // Handle disconnections
    imapService.connection.on('close', () => {
      console.log(`🔌 IMAP connection closed for ${email}`);
    });
  }

  // FIXED: Add the missing getAccounts method
  getAccounts() {
    const accounts = Array.from(this.accounts.entries()).map(([email, account]) => ({
      email,
      status: account.imap.isConnected ? 'connected' : 'disconnected',
      synced: true,
      smtpEnabled: account.smtpEnabled || false
    }));
    console.log(`📊 Returning ${accounts.length} accounts`);
    return accounts;
  }

  removeAccount(email) {
    const account = this.accounts.get(email);
    if (account) {
      account.imap.disconnect();
      this.accounts.delete(email);

      // Remove SMTP transporter
      try {
        const smtpService = require('./smtpService');
        smtpService.removeTransporter(email);
      } catch (error) {
        console.error('Error removing SMTP transporter:', error);
      }

      // Remove from memory storage
      try {
        const memoryStorage = require('./memoryStorageService');
        memoryStorage.removeAccount(email);
      } catch (error) {
        console.error('Error removing account from storage:', error);
      }

      console.log(`✅ Account removed: ${email}`);
    }
  }

  // Method to send reply
  async sendReply(accountEmail, originalEmail, replyContent) {
    try {
      const account = this.accounts.get(accountEmail);
      if (!account) {
        throw new Error(`Account ${accountEmail} not found`);
      }

      if (!account.smtpEnabled) {
        throw new Error(`SMTP not enabled for ${accountEmail}`);
      }

      const smtpService = require('./smtpService');
      const result = await smtpService.sendReply(accountEmail, originalEmail, replyContent);
      return result;

    } catch (error) {
      console.error('Error sending reply:', error);
      throw error;
    }
  }

  // Method to manually trigger email sync for an account
  async syncAccountEmails(email, days = 7) {
    const account = this.accounts.get(email);
    if (account && account.imap.isConnected) {
      try {
        console.log(`🔄 Manual sync for: ${email}`);
        const emails = await account.imap.syncHistoricalEmails(days);

        const memoryStorage = require('./memoryStorageService');
        emails.forEach(email => memoryStorage.addEmail(email));

        return emails.length;
      } catch (error) {
        console.error(`❌ Sync failed for ${email}:`, error);
        throw error;
      }
    }
    return 0;
  }
}

module.exports = new AccountManager();