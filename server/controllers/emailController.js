const elasticsearchService = require('../services/elasticsearchService');

exports.searchEmails = async (req, res) => {
  try {
    const { q, account, category, folder, page = 1, limit = 20 } = req.query;

    const from = (parseInt(page) - 1) * parseInt(limit);
    const result = await elasticsearchService.searchEmails(
      q,
      { account, category, folder },
      from,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result.emails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search emails'
    });
  }
};

exports.getEmail = async (req, res) => {
  try {
    const { messageId } = req.params;
    const email = await elasticsearchService.getEmail(messageId);

    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    res.json({
      success: true,
      data: email
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email'
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const result = await elasticsearchService.searchEmails('', {}, 0, 10000);
    const emails = result.emails;

    const stats = {
      total: emails.length,
      interested: emails.filter(e => e.category === 'Interested').length,
      meetings: emails.filter(e => e.category === 'Meeting Booked').length,
      notInterested: emails.filter(e => e.category === 'Not Interested').length,
      spam: emails.filter(e => e.category === 'Spam').length,
      outOfOffice: emails.filter(e => e.category === 'Out of Office').length,
      uncategorized: emails.filter(e => e.category === 'uncategorized').length,
      accounts: [...new Set(emails.map(e => e.account))].length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
};