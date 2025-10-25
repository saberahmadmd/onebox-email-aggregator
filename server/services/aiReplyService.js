const { GoogleGenAI } = require("@google/genai");

class AIReplyService {
  constructor() {
    this.isEnabled = false;
    this.initialized = false;

    console.log('🔧 Initializing AI Reply Service with Google GenAI...');

    // Initialize with new SDK
    this.initializeGenAI();
  }

  initializeGenAI() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error('❌ GEMINI_API_KEY is not set in environment variables');
        this.isEnabled = false;
        return;
      }

      console.log('🔧 Creating Google GenAI instance...');
      this.ai = new GoogleGenAI({ apiKey: apiKey });

      // Start with the model we know works
      this.model = "gemini-2.0-flash-exp";
      this.successfulModel = this.model;

      // Test the AI service
      this.testAI();

    } catch (error) {
      console.error('❌ Failed to initialize Google GenAI:', error.message);
      this.isEnabled = false;
    }
  }

  async testAI() {
    if (!this.ai) return;

    try {
      console.log('🧪 Testing AI with simple prompt...');
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: "Say 'AI is working' in one word."
      });

      console.log('✅ AI Test Response:', response.text);

      this.isEnabled = true;
      this.initialized = true;

      console.log(`✅ AI Service initialized successfully with model: ${this.model}`);

    } catch (error) {
      console.error('❌ AI Test Failed:', error.message);
      this.isEnabled = false;
    }
  }

  // ... rest of your methods remain the same
  async generateSuggestedReplies(email, contextType = "job_application") {
    console.log('🤖 generateSuggestedReplies called with:', {
      hasEmail: !!email,
      contextType,
      subject: email?.subject,
      aiEnabled: this.isEnabled,
      model: this.successfulModel
    });

    if (!this.isEnabled) {
      console.log('⚠️ AI is disabled, returning fallback replies');
      return this.getFallbackReplies();
    }

    if (!email) {
      console.error('❌ No email provided to generateSuggestedReplies');
      return this.getFallbackReplies();
    }

    try {
      const context = this.productContext[contextType] || this.productContext["job_application"];

      console.log('🔧 Building AI prompt...');
      const prompt = this.buildReplyPrompt(email, context);

      console.log('🚀 Sending request to Google GenAI...');
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt
      });

      console.log('✅ AI Response received:', response.text.substring(0, 100) + '...');

      const suggestedReplies = this.parseAIResponse(response.text);

      console.log(`🤖 Generated ${suggestedReplies.length} AI suggested replies`);

      if (suggestedReplies.length === 0) {
        console.log('⚠️ AI returned empty replies, using fallback');
        return this.getFallbackReplies();
      }

      return suggestedReplies;

    } catch (error) {
      console.error('❌ Error generating AI replies:', error.message);
      return this.getFallbackReplies();
    }
  }

  buildReplyPrompt(email, context) {
    const emailText = (email.text || '').substring(0, 1000);
    const emailSubject = email.subject || 'No Subject';
    const fromName = email.from?.name || 'Unknown Sender';

    return `
You are an AI assistant helping to write professional email replies. 
Based on the product context and the received email, generate 3 contextual and professional reply suggestions.

PRODUCT CONTEXT: ${context.context}

RECEIVED EMAIL:
Subject: ${emailSubject}
From: ${fromName}
Body: ${emailText}

Generate 3 different reply variations that:
1. Are professional and contextually appropriate
2. Reference the product context when relevant
3. Include the booking link (${context.booking_link}) if the email seems positive
4. Vary in tone and approach
5. Are ready to use with minimal editing

Format your response as a JSON array of reply strings:
["reply 1", "reply 2", "reply 3"]

IMPORTANT: Respond with ONLY the JSON array, no other text.
`.trim();
  }

  parseAIResponse(response) {
    console.log('🔧 Parsing AI response...');

    try {
      // Clean the response - remove markdown code blocks
      let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      console.log('Cleaned AI response:', cleanResponse.substring(0, 200) + '...');

      // Try to parse JSON response
      const parsed = JSON.parse(cleanResponse);

      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('✅ Successfully parsed JSON array from AI');
        return parsed.slice(0, 3);
      } else {
        console.log('❌ AI returned empty or invalid array');
        return this.getFallbackReplies();
      }
    } catch (error) {
      console.error('❌ JSON parsing failed, trying text extraction:', error.message);

      // Fallback: extract replies from text
      const lines = response.split('\n')
        .filter(line => line.trim().length > 20)
        .filter(line => !line.includes('```') && !line.includes('JSON'))
        .map(line => line.replace(/^[\d-\.\s]*["']?/, '').replace(/["']?$/, '').trim())
        .filter(line => line.length > 0);

      if (lines.length > 0) {
        return lines.slice(0, 3);
      }

      return this.getFallbackReplies();
    }
  }

  getFallbackReplies() {
    console.log('🔄 Using fallback replies');
    return [
      "Thank you for your email. I'll get back to you soon with more information.",
      "I appreciate you reaching out. Let me review this and I'll respond shortly.",
      "Thanks for the information. I'll look into this and follow up with you."
    ];
  }

  // Product context definitions
  productContext = {
    "job_application": {
      context: "I am applying for a job position. If the lead is interested, share the meeting booking link: https://cal.com/example",
      booking_link: "https://cal.com/example"
    },
    "sales_outreach": {
      context: "I am reaching out about our product demo. If interested, please schedule a call using our booking link: https://cal.com/demo",
      booking_link: "https://cal.com/demo"
    },
    "partnership": {
      context: "I'm interested in exploring partnership opportunities. Let's schedule a meeting to discuss: https://cal.com/partner",
      booking_link: "https://cal.com/partner"
    }
  };

  getStatus() {
    return {
      initialized: this.initialized,
      enabled: this.isEnabled,
      hasApiKey: !!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_gemini'),
      model: this.successfulModel || 'none',
      sdk: 'Google GenAI (new)'
    };
  }
}

module.exports = new AIReplyService();




/*
const { GoogleGenAI } = require("@google/genai");

class AIReplyService {
  constructor() {
    this.isEnabled = false;
    this.initialized = false;

    console.log('🔧 Initializing AI Reply Service with Google GenAI...');

    // Initialize with new SDK
    this.initializeGenAI();
  }

  initializeGenAI() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error('❌ GEMINI_API_KEY is not set in environment variables');
        this.isEnabled = false;
        return;
      }

      console.log('🔧 Creating Google GenAI instance...');
      this.ai = new GoogleGenAI({ apiKey: apiKey });

      // Start with the model we know works
      this.model = "gemini-2.0-flash-exp";
      this.successfulModel = this.model;

      // Test the AI service
      this.testAI();

    } catch (error) {
      console.error('❌ Failed to initialize Google GenAI:', error.message);
      this.isEnabled = false;
    }
  }

  async testAI() {
    if (!this.ai) return;

    try {
      console.log('🧪 Testing AI with simple prompt...');
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: "Say 'AI is working' in one word."
      });

      console.log('✅ AI Test Response:', response.text);

      this.isEnabled = true;
      this.initialized = true;

      console.log(`✅ AI Service initialized successfully with model: ${this.model}`);

    } catch (error) {
      console.error('❌ AI Test Failed:', error.message);
      this.isEnabled = false;
    }
  }

  // ... rest of your methods remain the same
  async generateSuggestedReplies(email, contextType = "job_application") {
    console.log('🤖 generateSuggestedReplies called with:', {
      hasEmail: !!email,
      contextType,
      subject: email?.subject,
      aiEnabled: this.isEnabled,
      model: this.successfulModel
    });

    if (!this.isEnabled) {
      console.log('⚠️ AI is disabled, returning fallback replies');
      return this.getFallbackReplies();
    }

    if (!email) {
      console.error('❌ No email provided to generateSuggestedReplies');
      return this.getFallbackReplies();
    }

    try {
      const context = this.productContext[contextType] || this.productContext["job_application"];

      console.log('🔧 Building AI prompt...');
      const prompt = this.buildReplyPrompt(email, context);

      console.log('🚀 Sending request to Google GenAI...');
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt
      });

      console.log('✅ AI Response received:', response.text.substring(0, 100) + '...');

      const suggestedReplies = this.parseAIResponse(response.text);

      console.log(`🤖 Generated ${suggestedReplies.length} AI suggested replies`);

      if (suggestedReplies.length === 0) {
        console.log('⚠️ AI returned empty replies, using fallback');
        return this.getFallbackReplies();
      }

      return suggestedReplies;

    } catch (error) {
      console.error('❌ Error generating AI replies:', error.message);
      return this.getFallbackReplies();
    }
  }

  buildReplyPrompt(email, context) {
    const emailText = (email.text || '').substring(0, 1000);
    const emailSubject = email.subject || 'No Subject';
    const fromName = email.from?.name || 'Unknown Sender';

    return `
You are an AI assistant helping to write professional email replies. 
Based on the product context and the received email, generate 3 contextual and professional reply suggestions.

PRODUCT CONTEXT: ${context.context}

RECEIVED EMAIL:
Subject: ${emailSubject}
From: ${fromName}
Body: ${emailText}

Generate 3 different reply variations that:
1. Are professional and contextually appropriate
2. Reference the product context when relevant
3. Include the booking link (${context.booking_link}) if the email seems positive
4. Vary in tone and approach
5. Are ready to use with minimal editing

Format your response as a JSON array of reply strings:
["reply 1", "reply 2", "reply 3"]

IMPORTANT: Respond with ONLY the JSON array, no other text.
`.trim();
  }

  parseAIResponse(response) {
    console.log('🔧 Parsing AI response...');

    try {
      // Clean the response - remove markdown code blocks
      let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      console.log('Cleaned AI response:', cleanResponse.substring(0, 200) + '...');

      // Try to parse JSON response
      const parsed = JSON.parse(cleanResponse);

      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('✅ Successfully parsed JSON array from AI');
        return parsed.slice(0, 3);
      } else {
        console.log('❌ AI returned empty or invalid array');
        return this.getFallbackReplies();
      }
    } catch (error) {
      console.error('❌ JSON parsing failed, trying text extraction:', error.message);

      // Fallback: extract replies from text
      const lines = response.split('\n')
        .filter(line => line.trim().length > 20)
        .filter(line => !line.includes('```') && !line.includes('JSON'))
        .map(line => line.replace(/^[\d-\.\s]*["']?/, '').replace(/["']?$/, '').trim())
        .filter(line => line.length > 0);

      if (lines.length > 0) {
        return lines.slice(0, 3);
      }

      return this.getFallbackReplies();
    }
  }

  getFallbackReplies() {
    console.log('🔄 Using fallback replies');
    return [
      "Thank you for your email. I'll get back to you soon with more information.",
      "I appreciate you reaching out. Let me review this and I'll respond shortly.",
      "Thanks for the information. I'll look into this and follow up with you."
    ];
  }

  // Product context definitions
  productContext = {
    "job_application": {
      context: "I am applying for a job position. If the lead is interested, share the meeting booking link: https://cal.com/example",
      booking_link: "https://cal.com/example"
    },
    "sales_outreach": {
      context: "I am reaching out about our product demo. If interested, please schedule a call using our booking link: https://cal.com/demo",
      booking_link: "https://cal.com/demo"
    },
    "partnership": {
      context: "I'm interested in exploring partnership opportunities. Let's schedule a meeting to discuss: https://cal.com/partner",
      booking_link: "https://cal.com/partner"
    }
  };

  getStatus() {
    return {
      initialized: this.initialized,
      enabled: this.isEnabled,
      hasApiKey: !!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_gemini'),
      model: this.successfulModel || 'none',
      sdk: 'Google GenAI (new)'
    };
  }
}

module.exports = new AIReplyService();
*/
