const accountManager = require('../services/accountManager');

exports.addAccount = async (req, res) => {
  try {
    const { email, password, host, port, tls } = req.body;

    if (!email || !password || !host) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and host are required'
      });
    }

    const account = await accountManager.addAccount({
      email,
      password,
      host,
      port: port || 993,
      tls: tls !== false
    });

    res.json({
      success: true,
      data: account,
      message: 'Account added successfully'
    });
  } catch (error) {
    console.error('Add account error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAccounts = (req, res) => {
  const accounts = accountManager.getAccounts();
  res.json({
    success: true,
    data: accounts
  });
};

exports.removeAccount = (req, res) => {
  try {
    const { email } = req.params;
    accountManager.removeAccount(email);

    res.json({
      success: true,
      message: 'Account removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};