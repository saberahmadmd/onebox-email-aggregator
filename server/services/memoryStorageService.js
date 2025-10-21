class MemoryStorageService {
  constructor() {
    this.emails = [];
    this.accounts = [];
    this.stats = {
      total: 0, interested: 0, meetings: 0, notInterested: 0,
      spam: 0, outOfOffice: 0, uncategorized: 0, accounts: 0
    };
    console.log('✅ Memory Storage Service initialized');
  }

  addEmail(email) {
    const existingIndex = this.emails.findIndex(e => e.messageId === email.messageId);
    if (existingIndex === -1) {
      this.emails.push({ ...email, id: this.emails.length + 1 });
      this.updateStats();
      return true;
    }
    return false;
  }

  searchEmails(query = '', filters = {}, page = 1, limit = 20) {
    let filteredEmails = [...this.emails];

    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filteredEmails = filteredEmails.filter(email =>
        email.subject?.toLowerCase().includes(searchTerm) ||
        email.text?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.account) {
      filteredEmails = filteredEmails.filter(email => email.account === filters.account);
    }

    if (filters.category) {
      filteredEmails = filteredEmails.filter(email => email.category === filters.category);
    }

    filteredEmails.sort((a, b) => new Date(b.date) - new Date(a.date));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEmails = filteredEmails.slice(startIndex, endIndex);

    return {
      emails: paginatedEmails,
      total: filteredEmails.length,
      page, limit,
      pages: Math.ceil(filteredEmails.length / limit)
    };
  }

  getEmail(messageId) {
    return this.emails.find(email => email.messageId === messageId);
  }

  updateEmailCategory(messageId, category) {
    const emailIndex = this.emails.findIndex(email => email.messageId === messageId);
    if (emailIndex !== -1) {
      this.emails[emailIndex].category = category;
      this.updateStats();
      return true;
    }
    return false;
  }

  addAccount(account) {
    this.accounts.push({ ...account, id: this.accounts.length + 1 });
    this.updateStats();
  }

  getAccounts() {
    return this.accounts;
  }

  removeAccount(email) {
    const accountIndex = this.accounts.findIndex(acc => acc.email === email);
    if (accountIndex !== -1) {
      this.accounts.splice(accountIndex, 1);
      this.emails = this.emails.filter(e => e.account !== email);
      this.updateStats();
      return true;
    }
    return false;
  }

  updateStats() {
    this.stats.total = this.emails.length;
    this.stats.accounts = [...new Set(this.emails.map(e => e.account))].length;

    // Reset counts
    Object.keys(this.stats).forEach(key => {
      if (key !== 'total' && key !== 'accounts') {
        this.stats[key] = 0;
      }
    });

    // Count by category
    this.emails.forEach(email => {
      const category = email.category?.toLowerCase().replace(' ', '') || 'uncategorized';
      if (this.stats[category] !== undefined) {
        this.stats[category]++;
      }
    });
  }

  getStats() {
    return this.stats;
  }
}

const memoryStorage = new MemoryStorageService();
module.exports = memoryStorage;