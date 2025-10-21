const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { EventEmitter } = require('events');

class IMAPService extends EventEmitter {
  constructor(accountConfig) {
    super();
    this.config = accountConfig;
    this.connection = null;
    this.isConnected = false;
    this.isIdle = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.connection) {
          this.connection.destroy();
        }
        reject(new Error('Connection timeout - IMAP server not responding'));
      }, 30000);

      console.log(`🔗 Connecting to IMAP: ${this.config.host}:${this.config.port}`);

      this.connection = new Imap({
        user: this.config.email,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port || 993,
        tls: this.config.tls !== false,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 30000,
        connTimeout: 30000
      });

      this.connection.once('ready', () => {
        clearTimeout(connectionTimeout);
        this.isConnected = true;
        console.log(`✅ IMAP connected for ${this.config.email}`);
        resolve();
      });

      this.connection.once('error', (err) => {
        clearTimeout(connectionTimeout);
        console.error(`❌ IMAP connection error for ${this.config.email}:`, err.message);

        let errorMessage = err.message;
        if (err.source === 'authentication') {
          errorMessage = 'Invalid email or password';
        } else if (err.code === 'ECONNREFUSED') {
          errorMessage = `Cannot connect to ${this.config.host}:${this.config.port}`;
        } else if (err.code === 'ENOTFOUND') {
          errorMessage = `Cannot find server: ${this.config.host}`;
        }

        reject(new Error(errorMessage));
      });

      this.connection.once('end', () => {
        clearTimeout(connectionTimeout);
        this.isConnected = false;
        this.isIdle = false;
        console.log(`🔌 IMAP connection ended for ${this.config.email}`);
      });

      this.connection.connect();
    });
  }

  async syncHistoricalEmails(days = 7) {
    if (!this.isConnected) {
      throw new Error('IMAP not connected');
    }

    return new Promise((resolve, reject) => {
      this.connection.openBox('INBOX', false, (err, box) => {
        if (err) return reject(err);

        const since = new Date();
        since.setDate(since.getDate() - days);

        const searchCriteria = ['ALL', ['SINCE', since.toISOString().split('T')[0]]];

        this.connection.search(searchCriteria, (err, results) => {
          if (err) return reject(err);

          if (!results || results.length === 0) {
            console.log(`📭 No emails found for ${this.config.email} in last ${days} days`);
            return resolve([]);
          }

          console.log(`📧 Found ${results.length} emails to sync`);

          const fetch = this.connection.fetch(results, {
            bodies: '',
            struct: true
          });

          const emails = [];

          fetch.on('message', (msg) => {
            let emailData = '';
            let attributes = null;

            msg.on('attributes', (attrs) => {
              attributes = attrs;
            });

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                emailData += chunk.toString('utf8');
              });
            });

            msg.once('end', async () => {
              try {
                const parsed = await simpleParser(emailData);
                const email = this.transformEmail(parsed, this.config.email, attributes);
                emails.push(email);
                this.emit('emailReceived', email);
              } catch (parseErr) {
                console.error('❌ Error parsing email:', parseErr);
              }
            });
          });

          fetch.once('end', () => {
            console.log(`✅ Synced ${emails.length} historical emails for ${this.config.email}`);
            resolve(emails);
          });

          fetch.once('error', reject);
        });
      });
    });
  }

  startRealTimeSync() {
    this.connection.on('mail', async (numNewMsgs) => {
      console.log(`📨 New email received for ${this.config.email}: ${numNewMsgs} new messages`);
      await this.syncHistoricalEmails(1);
    });

    this.startIdle();
  }

  startIdle() {
    if (this.isIdle) return;

    this.connection.once('ready', () => {
      this.connection.openBox('INBOX', true, (err) => {
        if (err) {
          console.error('❌ Error opening mailbox:', err);
          return;
        }

        this.connection.idle(() => {
          console.log(`🔄 IDLE mode started for ${this.config.email}`);
          this.isIdle = true;
        });
      });
    });
  }

  transformEmail(parsedEmail, accountEmail, attributes) {
    return {
      messageId: parsedEmail.messageId || `manual-${Date.now()}-${Math.random()}`,
      account: accountEmail,
      from: parsedEmail.from?.value[0] || { address: '', name: '' },
      to: parsedEmail.to?.value || [],
      subject: parsedEmail.subject || '(No Subject)',
      text: parsedEmail.text || '',
      html: parsedEmail.html || '',
      date: parsedEmail.date || new Date(),
      category: 'uncategorized',
      labels: [],
      folder: 'INBOX',
      threadId: parsedEmail.inReplyTo || parsedEmail.messageId,
      hasAttachments: parsedEmail.attachments && parsedEmail.attachments.length > 0,
      attachments: parsedEmail.attachments || []
    };
  }

  disconnect() {
    if (this.connection) {
      this.connection.end();
      this.isConnected = false;
      this.isIdle = false;
      console.log(`✅ IMAP disconnected for ${this.config.email}`);
    }
  }
}

module.exports = IMAPService;