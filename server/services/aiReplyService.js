const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIReplyService {
  constructor() {
    // Initialize Gemini AI
    try {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      console.log('✅ AI Reply Service initialized');
      this.isEnabled = true;
    } catch (error) {
      console.error('❌ Failed to initialize AI Reply Service:', error);
      this.isEnabled = false;
    }

    // Store product/outreach context (in production, use a vector database)
    this.productContext = {
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
  }

  async generateSuggestedReplies(email, contextType = "job_application") {
    if (!this.isEnabled) {
      return this.getFallbackReplies();
    }

    try {
      const context = this.productContext[contextType] || this.productContext["job_application"];

      const prompt = this.buildReplyPrompt(email, context);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const suggestedReplies = this.parseAIResponse(response.text());

      console.log(`🤖 Generated ${suggestedReplies.length} AI suggested replies`);
      return suggestedReplies;

    } catch (error) {
      console.error('❌ Error generating AI replies:', error);
      return this.getFallbackReplies();
    }
  }

  buildReplyPrompt(email, context) {
    return `
You are an AI assistant helping to write professional email replies. 
Based on the product context and the received email, generate 3 contextual and professional reply suggestions.

PRODUCT CONTEXT: ${context.context}

RECEIVED EMAIL:
Subject: ${email.subject}
From: ${email.from.name} (${email.from.address})
Body: ${(email.text || '').substring(0, 1000)}

Generate 3 different reply variations that:
1. Are professional and contextually appropriate
2. Reference the product context when relevant
3. Include the booking link (${context.booking_link}) if the email seems positive
4. Vary in tone and approach
5. Are ready to use with minimal editing

Format your response as a JSON array of reply strings:
["reply 1", "reply 2", "reply 3"]
`.trim();
  }

  parseAIResponse(response) {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3); // Return max 3 replies
      }
    } catch (error) {
      // If JSON parsing fails, extract replies from text
      console.log('Falling back to text parsing for AI response');
    }

    // Fallback: split by new lines and clean up
    const replies = response.split('\n')
      .filter(line => line.trim().length > 20 && !line.includes('```'))
      .map(line => line.replace(/^[\d-\.\s]*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 3);

    return replies.length > 0 ? replies : this.getFallbackReplies();
  }

  getFallbackReplies() {
    return [
      "Thank you for your email. I'll get back to you soon.",
      "I appreciate you reaching out. Let me check and revert.",
      "Thanks for the information. I'll review it and respond accordingly."
    ];
  }

  // Method to add custom context (for different use cases)
  addProductContext(key, context, bookingLink) {
    this.productContext[key] = {
      context: context,
      booking_link: bookingLink
    };
    console.log(`✅ Added product context for: ${key}`);
  }
}

module.exports = new AIReplyService();