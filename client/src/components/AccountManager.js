import { useState, useEffect } from 'react';
import { Plus, Trash2, HelpCircle, X, Mail, Eye, EyeOff } from 'lucide-react';
import { accountsAPI } from '../services/api';

const AccountManager = ({ onAccountChange }) => {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
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
        setShowPassword(false); // Reset password visibility when form closes
        await loadAccounts();
        onAccountChange();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccount = async (email) => {
    if (window.confirm(`Remove ${email}?`)) {
      try {
        await accountsAPI.removeAccount(email);
        await loadAccounts();
        onAccountChange();
      } catch (error) {
        alert('Failed to remove account');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
                  setShowPassword(false); // Reset password visibility when modal closes
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
                    <li>Generate an App Password</li>
                    <li>Use that password here</li>
                  </ol>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IMAP Host
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="imap.gmail.com"
                  value={formData.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                />
              </div>

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
                    setShowPassword(false); // Reset password visibility when canceling
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
            <div key={account.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{account.email}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${account.status === 'connected'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {account.status}
                </span>
              </div>
              <button
                onClick={() => handleRemoveAccount(account.email)}
                className="btn-danger p-2 ml-2"
                title="Remove account"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AccountManager;