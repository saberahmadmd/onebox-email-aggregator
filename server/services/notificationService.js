const { WebClient } = require('@slack/web-api');
const axios = require('axios');

class NotificationService {
  constructor() {
    try {
      this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
      this.slackEnabled = !!process.env.SLACK_BOT_TOKEN;
      console.log('✅ Slack client initialized');
    } catch (error) {
      console.error('❌ Slack initialization failed:', error);
      this.slackEnabled = false;
    }

    this.webhookEnabled = !!process.env.WEBHOOK_URL;
  }

  async sendSlackNotification(email) {
    if (!this.slackEnabled) {
      console.log('⚠️ Slack notifications disabled');
      return;
    }

    try {
      const result = await this.slack.chat.postMessage({
        channel: process.env.SLACK_CHANNEL || '#general',
        text: `🎯 New Interested Email from ${email.from.name}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*📧 New Interested Email Received*`
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*From:*\n${email.from.name} <${email.from.address}>`
              },
              {
                type: 'mrkdwn',
                text: `*Subject:*\n${email.subject}`
              },
              {
                type: 'mrkdwn',
                text: `*Date:*\n${new Date(email.date).toLocaleString()}`
              },
              {
                type: 'mrkdwn',
                text: `*Account:*\n${email.account}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Preview:*\n${(email.text || '').substring(0, 200)}...`
            }
          }
        ]
      });
      console.log(`✅ Slack notification sent for: ${email.from.address}`);
    } catch (error) {
      console.error('❌ Error sending Slack notification:', error.message);

      // Disable Slack if channel not found or other critical errors
      if (error.data?.error === 'channel_not_found' || error.data?.error === 'not_in_channel') {
        console.warn('⚠️ Slack channel not found, disabling Slack notifications');
        this.slackEnabled = false;
      }
    }
  }

  async triggerWebhook(email) {
    if (!this.webhookEnabled) {
      return;
    }

    try {
      await axios.post(process.env.WEBHOOK_URL, {
        event: 'email_categorized',
        category: 'Interested',
        email: {
          from: email.from,
          subject: email.subject,
          messageId: email.messageId,
          date: email.date,
          account: email.account
        },
        timestamp: new Date().toISOString(),
        source: 'Onebox Email Aggregator'
      });
      console.log(`✅ Webhook triggered for: ${email.messageId}`);
    } catch (error) {
      console.error('❌ Error triggering webhook:', error.message);
    }
  }
}

module.exports = new NotificationService();