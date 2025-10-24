import { useState, useEffect } from 'react';
import { Plus, Trash2, HelpCircle, X, Mail, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { accountsAPI } from '../services/api';

const AccountManager = ({ onAccountChange }) => {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    host: 'imap.gmail.com',
    port: 993,
    tls: true
  });

  const loadAccounts = async () => {
    try {
      const response = await accountsAPI.getAccounts();
      if (response.data.success) {
        setAccounts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
      setAccounts([]);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await accountsAPI.testConnection(formData);
      if (response.data.success) {
        alert('✅ Connection test successful! You can now add this account.');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await accountsAPI.addAccount(formData);
      if (response.data.success) {
        setFormData({
          email: '', password: '', host: 'imap.gmail.com', port: 993, tls: true
        });
        setShowForm(false);
        setShowPassword(false);
        alert('⏳ Account setup started. This may take 1-2 minutes...');
      
      // Poll for account status
      const checkInterval = setInterval(async () => {
        await loadAccounts();
        const newAccount = accounts.find(a => a.email === formData.email);
        if (newAccount && newAccount.status === 'connected') {
          clearInterval(checkInterval);
          alert(`✅ Account ${formData.email} connected successfully!`);
          if (onAccountChange) onAccountChange();
        }
      }, 3000); // Check every 3 seconds
      
      // Stop checking after 2 minutes
      setTimeout(() => clearInterval(checkInterval), 120000);
        if (onAccountChange) onAccountChange();

        // Show success message with email count
        if (response.data.data.historicalCount > 0) {
          alert(`✅ Account added successfully! Synced ${response.data.data.historicalCount} emails.`);
        } else {
          alert('✅ Account added successfully! No recent emails found to sync.');
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to add account';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccount = async (email) => {
    if (window.confirm(`Remove ${email}? This will also remove all associated emails from the system.`)) {
      try {
        await accountsAPI.removeAccount(email);
        await loadAccounts();
        if (onAccountChange) onAccountChange();
        alert(`✅ Account ${email} removed successfully`);
      } catch (error) {
        alert('Failed to remove account');
      }
    }
  };

  const syncAccountEmails = async (email) => {
    setSyncing(prev => ({ ...prev, [email]: true }));
    try {
      const response = await fetch(`http://localhost:3001/api/sync/${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days: 7 })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}`);
        // Refresh the email list
        if (onAccountChange) onAccountChange();
      } else {
        alert(`❌ Sync failed: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to sync emails: ' + error.message);
    } finally {
      setSyncing(prev => ({ ...prev, [email]: false }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getSyncStatus = (email) => {
    return syncing[email] || false;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Email Accounts</h3>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Account Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">Add Email Account</h4>
              <button
                onClick={() => {
                  setShowForm(false);
                  setShowPassword(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="your.email@gmail.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Password / App Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelp(!showHelp)}
                    className="text-primary-500 hover:text-primary-600"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="input-field pr-10"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {showHelp && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <strong className="text-blue-800 block mb-2">For Gmail:</strong>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>Enable 2-factor authentication</li>
                    <li>Go to Google Account → Security → 2-Step Verification</li>
                    <li>Under "App passwords", generate a new app password</li>
                    <li>Use the 16-character app password here (not your regular password)</li>
                  </ol>
                  <strong className="text-blue-800 block mt-3 mb-1">For Outlook:</strong>
                  <p className="text-blue-700">Use your regular password</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IMAP Host
                </label>
                <select
                  className="input-field"
                  value={formData.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                >
                  <option value="imap.gmail.com">Gmail (imap.gmail.com)</option>
                  <option value="outlook.office365.com">Outlook (outlook.office365.com)</option>
                  <option value="imap.mail.yahoo.com">Yahoo (imap.mail.yahoo.com)</option>
                  <option value="custom">Custom IMAP Server</option>
                </select>
              </div>

              {formData.host === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom IMAP Host
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="imap.yourprovider.com"
                    value={formData.customHost}
                    onChange={(e) => handleInputChange('host', e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="993"
                  value={formData.port}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 993)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="tls"
                  checked={formData.tls}
                  onChange={(e) => handleInputChange('tls', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="tls" className="text-sm font-medium text-gray-700">
                  Use TLS/SSL (recommended)
                </label>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testing || !formData.email || !formData.password}
                  className="btn-secondary flex items-center space-x-2 flex-1 disabled:bg-gray-400"
                >
                  <Mail className="h-4 w-4" />
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setShowPassword(false);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accounts List */}
      <div className="space-y-3">
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No accounts added yet</p>
            <p className="text-gray-400 text-xs mt-1">Add your first email account to get started</p>
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.email} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <p className="font-medium text-gray-900 truncate">{account.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${account.status === 'connected'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                    {account.status === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
                  </span>
                  {account.synced && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      📧 Synced
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => syncAccountEmails(account.email)}
                  disabled={getSyncStatus(account.email)}
                  className="btn-secondary p-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  title="Sync emails"
                >
                  {getSyncStatus(account.email) ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleRemoveAccount(account.email)}
                  className="btn-danger p-2"
                  title="Remove account"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Help Text */}
      {accounts.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> Use the sync button (🔄) to manually fetch emails from your accounts.
            New emails are automatically synced in real-time.
          </p>
        </div>
      )}
    </div>
  );
};

export default AccountManager;
