const { GoogleGenerativeAI } = require('@google/generative-ai');

class AICategorizationService {
  constructor() {
    this.categories = [
      'Interested',
      'Meeting Booked',
      'Not Interested',
      'Spam',
      'Out of Office'
    ];

    // Initialize Gemini
    try {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      console.log('✅ Google Gemini initialized successfully');
      this.isEnabled = true;
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error);
      this.isEnabled = false;
    }
  }

  async categorizeEmail(email) {
    if (!this.isEnabled) {
      return this.getDefaultCategory(email);
    }

    try {
      const prompt = this.buildCategorizationPrompt(email);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const category = this.parseCategory(response.text());

      console.log(`🤖 Gemini categorization: ${category}`);
      return category || 'uncategorized';
    } catch (error) {
      console.error('❌ Error in Gemini categorization:', error);
      return this.getDefaultCategory(email);
    }
  }

  buildCategorizationPrompt(email) {
    return `
Analyze this email and categorize it into exactly one of these categories:
${this.categories.join(', ')}

EMAIL SUBJECT: ${email.subject}
EMAIL BODY: ${(email.text || email.html || '').substring(0, 1500)}

Respond with ONLY the category name, nothing else.
Category:`.trim();
  }

  parseCategory(response) {
    const cleanResponse = response.trim().toLowerCase();
    for (const category of this.categories) {
      if (cleanResponse.includes(category.toLowerCase())) {
        return category;
      }
    }
    return null;
  }

  getDefaultCategory(email) {
    const text = (email.text || email.html || '').toLowerCase();
    const subject = (email.subject || '').toLowerCase();

    // Meeting detection
    const meetingKeywords = ['meeting', 'calendar', 'schedule', 'appointment', 'call', 'zoom', 'teams', 'google meet'];
    if (meetingKeywords.some(keyword => text.includes(keyword) || subject.includes(keyword))) {
      return 'Meeting Booked';
    }

    // Interest detection
    const interestKeywords = ['interested', 'want to learn', 'tell me more', 'please share', 'looking for', 'sounds good', 'let\'s proceed'];
    if (interestKeywords.some(keyword => text.includes(keyword))) {
      return 'Interested';
    }

    // Rejection detection
    const rejectionKeywords = ['not interested', 'decline', 'reject', 'no thank you', 'unsubscribe', 'not now'];
    if (rejectionKeywords.some(keyword => text.includes(keyword))) {
      return 'Not Interested';
    }

    // Spam detection
    const spamKeywords = ['unsubscribe', 'opt-out', 'prescription', 'lottery', 'winner', 'viagra', 'click here'];
    if (spamKeywords.some(keyword => text.includes(keyword)) || subject.includes('spam')) {
      return 'Spam';
    }

    // Out of office detection
    const oooKeywords = ['out of office', 'vacation', 'away from', 'auto-reply', 'automatic response', 'ooo'];
    if (oooKeywords.some(keyword => text.includes(keyword))) {
      return 'Out of Office';
    }

    return 'uncategorized';
  }
}

module.exports = new AICategorizationService();