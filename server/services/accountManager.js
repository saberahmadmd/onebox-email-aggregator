const IMAPService = require('./imapService');

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
      console.log('🔍 DEBUG: Step 1 - Validating config');
      if (!config.email || !config.password || !config.host) {
        throw new Error('Email, password, and host are required');
      }

      // Step 2: Create IMAP service
      console.log('🔍 DEBUG: Step 2 - Creating IMAP service');
      const imapService = new IMAPService(config);

      // Step 3: Attempt connection
      console.log('🔍 DEBUG: Step 3 - Attempting IMAP connection');
      await imapService.connect();
      console.log('✅ DEBUG: IMAP connection successful');

      // Step 4: Set up event listeners
      console.log('🔍 DEBUG: Step 4 - Setting up event listeners');
      imapService.on('emailReceived', async (email) => {
        try {
          console.log(`📧 DEBUG: New email received: ${email.subject}`);

          // Try to load services dynamically
          try {
            const aiCategorizationService = require('./aiCategorizationService');
            const notificationService = require('./notificationService');
            const memoryStorage = require('./memoryStorageService');

            // Categorize email
            email.category = await aiCategorizationService.categorizeEmail(email);
            console.log(`🏷️ DEBUG: Email categorized as: ${email.category}`);

            // Store in memory
            memoryStorage.addEmail(email);

            // Send notifications
            if (email.category === 'Interested') {
              await notificationService.sendSlackNotification(email);
              await notificationService.triggerWebhook(email);
            }

            // Broadcast update
            if (global.broadcastFunction) {
              global.broadcastFunction({ type: 'new_email', email: email });
            }
          } catch (serviceError) {
            console.error('❌ DEBUG: Service error in email processing:', serviceError);
          }
        } catch (error) {
          console.error('❌ DEBUG: Error processing email:', error);
        }
      });

      // Step 5: Sync historical emails
      console.log('🔍 DEBUG: Step 5 - Syncing historical emails');
      const historicalEmails = await imapService.syncHistoricalEmails(1);
      console.log(`✅ DEBUG: Synced ${historicalEmails.length} historical emails`);

      // Step 6: Store historical emails
      console.log('🔍 DEBUG: Step 6 - Storing emails in memory');
      try {
        const memoryStorage = require('./memoryStorageService');
        historicalEmails.forEach(email => {
          memoryStorage.addEmail(email);
        });
        memoryStorage.addAccount({
          email: config.email,
          host: config.host,
          status: 'connected'
        });
      } catch (storageError) {
        console.error('❌ DEBUG: Memory storage error:', storageError);
      }

      // Step 7: Start real-time sync
      console.log('🔍 DEBUG: Step 7 - Starting real-time sync');
      imapService.startRealTimeSync();

      // Step 8: Store account
      console.log('🔍 DEBUG: Step 8 - Storing account');
      this.accounts.set(config.email, imapService);

      console.log(`✅ DEBUG: Account ${config.email} added successfully`);

      return {
        email: config.email,
        status: 'connected',
        synced: true,
        historicalCount: historicalEmails.length
      };

    } catch (error) {
      console.error('💥 DEBUG: CRITICAL ERROR in addAccount:');
      console.error('💥 DEBUG: Error message:', error.message);
      console.error('💥 DEBUG: Error stack:', error.stack);
      console.error('💥 DEBUG: Error code:', error.code);
      console.error('💥 DEBUG: Error source:', error.source);

      throw error;
    }
  }

  getAccounts() {
    const accounts = Array.from(this.accounts.entries()).map(([email, service]) => ({
      email,
      status: service.isConnected ? 'connected' : 'disconnected'
    }));
    return accounts;
  }

  removeAccount(email) {
    const service = this.accounts.get(email);
    if (service) {
      service.disconnect();
      this.accounts.delete(email);
      console.log(`✅ Account removed: ${email}`);
    }
  }
}

module.exports = new AccountManager();