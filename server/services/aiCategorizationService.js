const { GoogleGenAI } = require("@google/genai");

class AICategorizationService {
  constructor() {
    this.categories = [
      'Interested',
      'Meeting Booked',
      'Not Interested',
      'Spam',
      'Out of Office'
    ];

    this.isEnabled = false;
    this.model = "gemini-2.0-flash-exp"; // Use the working model

    this.initializeGenAI();
  }

  initializeGenAI() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey.includes('your_gemini')) {
        console.log('⚠️ Gemini API key not set, using default categorization');
        this.isEnabled = false;
        return;
      }

      console.log('🔧 Creating Google GenAI instance for categorization...');
      this.ai = new GoogleGenAI({ apiKey: apiKey });

      // Test the service with the working model
      this.testAI();

    } catch (error) {
      console.error('❌ Failed to initialize Google GenAI for categorization:', error);
      this.isEnabled = false;
    }
  }

  async testAI() {
    try {
      console.log('🧪 Testing categorization AI...');
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: "Say 'Test'"
      });

      console.log('✅ Categorization AI working:', response.text);
      this.isEnabled = true;
      console.log(`✅ Categorization service initialized with model: ${this.model}`);

    } catch (error) {
      console.error('❌ Categorization AI test failed:', error.message);
      this.isEnabled = false;
    }
  }

  async categorizeEmail(email) {
    if (!this.isEnabled) {
      return this.getDefaultCategory(email);
    }

    try {
      const prompt = this.buildCategorizationPrompt(email);

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt
      });

      const category = this.parseCategory(response.text);

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

  getStatus() {
    return {
      enabled: this.isEnabled,
      model: this.model,
      sdk: 'Google GenAI (new)'
    };
  }
}

module.exports = new AICategorizationService();





/*
const { GoogleGenAI } = require("@google/genai");

class AICategorizationService {
  constructor() {
    this.categories = [
      'Interested',
      'Meeting Booked',
      'Not Interested',
      'Spam',
      'Out of Office'
    ];

    this.isEnabled = false;
    this.model = "gemini-2.0-flash-exp"; // Use the working model

    this.initializeGenAI();
  }

  initializeGenAI() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey.includes('your_gemini')) {
        console.log('⚠️ Gemini API key not set, using default categorization');
        this.isEnabled = false;
        return;
      }

      console.log('🔧 Creating Google GenAI instance for categorization...');
      this.ai = new GoogleGenAI({ apiKey: apiKey });

      // Test the service with the working model
      this.testAI();

    } catch (error) {
      console.error('❌ Failed to initialize Google GenAI for categorization:', error);
      this.isEnabled = false;
    }
  }

  async testAI() {
    try {
      console.log('🧪 Testing categorization AI...');
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: "Say 'Test'"
      });

      console.log('✅ Categorization AI working:', response.text);
      this.isEnabled = true;
      console.log(`✅ Categorization service initialized with model: ${this.model}`);

    } catch (error) {
      console.error('❌ Categorization AI test failed:', error.message);
      this.isEnabled = false;
    }
  }

  async categorizeEmail(email) {
    if (!this.isEnabled) {
      return this.getDefaultCategory(email);
    }

    try {
      const prompt = this.buildCategorizationPrompt(email);

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt
      });

      const category = this.parseCategory(response.text);

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

  getStatus() {
    return {
      enabled: this.isEnabled,
      model: this.model,
      sdk: 'Google GenAI (new)'
    };
  }
}

module.exports = new AICategorizationService();
*/
