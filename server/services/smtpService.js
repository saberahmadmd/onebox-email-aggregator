const nodemailer = require('nodemailer');

class SMTPService {
  constructor() {
    this.transporters = new Map(); // Store transporters for each account
    console.log('✅ SMTP Service initialized');
  }

  // Create transporter for an email account
  async createTransporter(accountConfig) {
    try {
      const transporter = nodemailer.createTransport({
        host: accountConfig.smtpHost || this.getSMTPHost(accountConfig.host),
        port: accountConfig.smtpPort || 587,
        secure: false, // Use TLS
        auth: {
          user: accountConfig.email,
          pass: accountConfig.password,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify the transporter
      await transporter.verify();
      console.log(`✅ SMTP transporter created for: ${accountConfig.email}`);

      this.transporters.set(accountConfig.email, transporter);
      return transporter;
    } catch (error) {
      console.error(`❌ Failed to create SMTP transporter for ${accountConfig.email}:`, error.message);
      throw new Error(`SMTP setup failed: ${error.message}`);
    }
  }

  // Get SMTP host based on IMAP host
  getSMTPHost(imapHost) {
    const smtpMap = {
      'imap.gmail.com': 'smtp.gmail.com',
      'outlook.office365.com': 'smtp.office365.com',
      'imap.mail.yahoo.com': 'smtp.mail.yahoo.com',
      'imap.aol.com': 'smtp.aol.com'
    };

    return smtpMap[imapHost] || imapHost.replace('imap', 'smtp');
  }

  // Send email reply
  async sendReply(accountEmail, originalEmail, replyContent, subjectPrefix = 'Re: ') {
    try {
      const transporter = this.transporters.get(accountEmail);

      if (!transporter) {
        throw new Error(`No SMTP transporter found for ${accountEmail}. Please setup SMTP first.`);
      }

      // Prepare email data
      const mailOptions = {
        from: `"${originalEmail.from.name || 'Me'}" <${accountEmail}>`,
        to: originalEmail.from.address, // Reply to the original sender
        subject: subjectPrefix + (originalEmail.subject || 'No Subject'),
        text: replyContent,
        html: this.textToHtml(replyContent),
        inReplyTo: originalEmail.messageId, // Reference original email
        references: [originalEmail.messageId] // Thread reference
      };

      console.log('📤 Sending email reply:', {
        from: accountEmail,
        to: originalEmail.from.address,
        subject: mailOptions.subject
      });

      // Send the email
      const result = await transporter.sendMail(mailOptions);

      console.log('✅ Email sent successfully:', result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };

    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Convert text to HTML for better email formatting
  textToHtml(text) {
    return text
      .split('\n')
      .map(line => {
        if (line.trim() === '') return '<br>';
        return `<p>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
      })
      .join('');
  }

  // Remove transporter when account is removed
  removeTransporter(email) {
    this.transporters.delete(email);
    console.log(`✅ SMTP transporter removed for: ${email}`);
  }

  // Get SMTP status for an account
  getStatus(email) {
    const transporter = this.transporters.get(email);
    return {
      hasTransporter: !!transporter,
      email: email
    };
  }
}

module.exports = new SMTPService();