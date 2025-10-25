import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mail, Users, Calendar, BarChart3, RefreshCw, Bug, X } from 'lucide-react';
import EmailList from './components/EmailList';
import SearchBar from './components/SearchBar';
import AccountManager from './components/AccountManager';
import EmailDetail from './components/EmailDetail';
import { emailsAPI, websocketService } from './services/api';

const NOTIFICATION_CONFIG = {
  maxNotifications: 3,
  notificationDuration: 5000,
  cooldownPeriod: 30000,
  importantCategories: ['Interested', 'Meeting Booked']
};

function App() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    query: '',
    account: '',
    category: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showEmailDetail, setShowEmailDetail] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    memoryStats: {},
    websocketStatus: 'disconnected',
    lastUpdate: null
  });
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const wsRef = useRef(null);
  const updateIdCounter = useRef(0);
  const lastNotificationTime = useRef(0);
  const isInitialMount = useRef(true);

  const searchEmails = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await emailsAPI.search({
        ...filters,
        page,
        limit: pagination.limit
      });

      if (response.data.success) {
        setEmails(response.data.data);
        setPagination(response.data.pagination);

        setDebugInfo(prev => ({
          ...prev,
          lastUpdate: new Date().toLocaleTimeString()
        }));
      }
    } catch (error) {
      console.error('Search error:', error);
      setEmails([]);
      setPagination(prev => ({ ...prev, total: 0, pages: 0 }));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  const loadStats = useCallback(async () => {
    try {
      const response = await emailsAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
        setDebugInfo(prev => ({
          ...prev,
          memoryStats: response.data.data
        }));
      }
    } catch (error) {
      console.error('Stats load error:', error);
      setStats({
        total: 0, interested: 0, meetings: 0, notInterested: 0,
        spam: 0, outOfOffice: 0, uncategorized: 0, accounts: 0
      });
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const { accountsAPI } = require('./services/api');
      const response = await accountsAPI.getAccounts();
      if (response.data.success) {
        setAccounts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
      setAccounts([]);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      searchEmails(pagination.page),
      loadStats(),
      loadAccounts()
    ]);
  }, [searchEmails, loadStats, loadAccounts, pagination.page]);

  const addNotification = useCallback((email) => {
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime.current;

    // Check cooldown period (don't show too many notifications too quickly)
    if (timeSinceLastNotification < NOTIFICATION_CONFIG.cooldownPeriod) {
      console.log('📨 Notification skipped: Too soon since last notification');
      return;
    }

    // Check if this is an important category that should always show
    const isImportant = NOTIFICATION_CONFIG.importantCategories.includes(email.category);

    // For non-important emails, only show 1 in 3 to reduce spam
    if (!isImportant && Math.random() > 0.3) {
      console.log('📨 Notification skipped: Random filter for non-important email');
      return;
    }

    // Limit total number of notifications shown at once
    setRealTimeUpdates(prev => {
      const newUpdates = [...prev];
      if (newUpdates.length >= NOTIFICATION_CONFIG.maxNotifications) {
        newUpdates.shift(); // Remove oldest notification
      }

      const updateId = `update_${updateIdCounter.current++}_${now}`;

      newUpdates.push({
        id: updateId,
        message: `New ${email.category.toLowerCase()} email from ${email.from.name || email.from.address}`,
        email: email,
        timestamp: new Date(),
        category: email.category,
        isImportant: isImportant
      });

      lastNotificationTime.current = now;
      return newUpdates;
    });
  }, []);

  const setupWebSocket = useCallback(() => {
    try {
      // Only setup if we don't have an active connection
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('🔌 WebSocket already connected, skipping setup');
        return;
      }

      console.log('🔄 Setting up WebSocket connection...');

      wsRef.current = websocketService.connect(
        (data) => {
          console.log('📨 WebSocket message received:', data.type);
          
          if (data.type === 'new_email') {
            console.log('📨 WebSocket: New email received', data.email.category);

            // Use controlled notification system
            addNotification(data.email);

            // Always refresh data in background
            refreshAllData();

            setDebugInfo(prev => ({
              ...prev,
              websocketStatus: 'connected',
              lastUpdate: new Date().toLocaleTimeString()
            }));
          } 
          else if (data.type === 'account_added') {
            console.log('✅ WebSocket: Account added successfully', data.account);
            
            // Refresh accounts list
            loadAccounts();
            
            // Show success notification
            setRealTimeUpdates(prev => {
              const newUpdates = [...prev];
              if (newUpdates.length >= NOTIFICATION_CONFIG.maxNotifications) {
                newUpdates.shift();
              }
              
              newUpdates.push({
                id: `account_${Date.now()}`,
                message: `Account ${data.account.email} added successfully!`,
                timestamp: new Date(),
                category: 'success',
                isImportant: true
              });
              
              return newUpdates;
            });
            
            setDebugInfo(prev => ({
              ...prev,
              lastUpdate: new Date().toLocaleTimeString()
            }));
          }
          else if (data.type === 'account_error') {
            console.error('❌ WebSocket: Account error', data.error);
            
            // Show error notification
            setRealTimeUpdates(prev => {
              const newUpdates = [...prev];
              if (newUpdates.length >= NOTIFICATION_CONFIG.maxNotifications) {
                newUpdates.shift();
              }
              
              newUpdates.push({
                id: `error_${Date.now()}`,
                message: `Failed to add account ${data.email}: ${data.error}`,
                timestamp: new Date(),
                category: 'error',
                isImportant: true
              });
              
              return newUpdates;
            });
          }
          else if (data.type === 'connected') {
            console.log('✅ WebSocket connected to server');
            setDebugInfo(prev => ({
              ...prev,
              websocketStatus: 'connected'
            }));
          }
        },
        (error) => {
          console.error('WebSocket error:', error);
          setDebugInfo(prev => ({
            ...prev,
            websocketStatus: 'error'
          }));
        },
        () => {
          console.log('🔌 WebSocket closed, attempting reconnect...');
          setDebugInfo(prev => ({
            ...prev,
            websocketStatus: 'reconnecting'
          }));
          // Auto-reconnect handled by websocketService
        }
      );
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
      setDebugInfo(prev => ({
        ...prev,
        websocketStatus: 'failed'
      }));
      // Retry after delay
      setTimeout(setupWebSocket, 5000);
    }
  }, [addNotification, refreshAllData, loadAccounts]);

  // Auto-remove notifications after duration
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeUpdates(prev => {
        if (prev.length === 0) return prev;

        const now = Date.now();
        return prev.filter(update => {
          const age = now - update.timestamp.getTime();
          return age < NOTIFICATION_CONFIG.notificationDuration;
        });
      });
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      await refreshAllData();
    };

    loadInitialData();
  }, [refreshAllData]);

  // Setup WebSocket after initial render - only once
  useEffect(() => {
    if (isInitialMount.current) {
      setupWebSocket();
      isInitialMount.current = false;
    }

    return () => {
      // Only cleanup on actual component unmount
      if (wsRef.current) {
        console.log('🧹 Cleaning up WebSocket connection');
        websocketService.disconnect(wsRef.current);
        wsRef.current = null;
      }
    };
  }, [setupWebSocket]);

  // Effect to search when filters change
  useEffect(() => {
    searchEmails(1);
  }, [filters, searchEmails]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSearch = useCallback(() => {
    searchEmails(1);
  }, [searchEmails]);

  const handlePageChange = useCallback((newPage) => {
    searchEmails(newPage);
  }, [searchEmails]);

  const handleEmailClick = useCallback((email) => {
    setSelectedEmail(email.messageId);
    setShowEmailDetail(true);
  }, []);

  const handleCloseEmailDetail = useCallback(() => {
    setShowEmailDetail(false);
    setSelectedEmail(null);
  }, []);

  const dismissUpdate = useCallback((id) => {
    setRealTimeUpdates(prev => prev.filter(update => update.id !== id));
  }, []);

  const dismissAllNotifications = useCallback(() => {
    setRealTimeUpdates([]);
  }, []);

  const StatCard = ({ icon: Icon, value, label, color = 'blue' }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{value || 0}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
        <div className={`p-2 rounded-lg bg-${color}-50`}>
          <Icon className={`h-6 w-6 text-${color}-500`} />
        </div>
      </div>
    </div>
  );

  const getNotificationColor = (category, isImportant) => {
    if (category === 'success') {
      return 'bg-green-500 border-green-600';
    }
    if (category === 'error') {
      return 'bg-red-500 border-red-600';
    }
    if (isImportant) {
      return 'bg-green-500 border-green-600';
    }

    switch (category) {
      case 'Interested':
        return 'bg-green-500 border-green-600';
      case 'Meeting Booked':
        return 'bg-purple-500 border-purple-600';
      case 'Spam':
        return 'bg-red-500 border-red-600';
      case 'Out of Office':
        return 'bg-yellow-500 border-yellow-600';
      case 'Not Interested':
        return 'bg-red-500 border-red-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-500 to-primary-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Email Aggregator</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={refreshAllData}
                disabled={loading}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
                title="Debug info"
              >
                <Bug className="h-4 w-4" />
                <span className="hidden sm:inline">Debug</span>
              </button>

              <button
                className="lg:hidden p-2 rounded-md text-white hover:bg-primary-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
            <StatCard icon={Mail} value={stats.total} label="Total Emails" color="blue" />
            <StatCard icon={Users} value={stats.interested} label="Interested" color="green" />
            <StatCard icon={Calendar} value={stats.meetings} label="Meetings" color="purple" />
            <StatCard icon={BarChart3} value={stats.accounts} label="Accounts" color="orange" />
          </div>
        </div>
      </header>

      {/* Real-time notifications */}
      {realTimeUpdates.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
          {/* Notification header */}
          <div className="flex justify-between items-center bg-gray-800 text-white px-3 py-2 rounded-t-lg">
            <span className="text-sm font-medium">
              Notifications ({realTimeUpdates.length})
            </span>
            <button
              onClick={dismissAllNotifications}
              className="text-gray-300 hover:text-white p-1"
              title="Dismiss all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Notifications */}
          {realTimeUpdates.map(update => (
            <div
              key={update.id}
              className={`text-white p-4 rounded-lg shadow-lg animate-slide-in-right border-l-4 ${getNotificationColor(update.category, update.isImportant)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {update.isImportant && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">Important</span>
                    )}
                    <span className="text-xs opacity-80 capitalize">{update.category}</span>
                  </div>
                  <span className="text-sm font-medium block">
                    {update.message}
                  </span>
                  <p className="text-xs opacity-80 mt-2">
                    {update.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  className="text-white hover:opacity-70 ml-2 p-1 flex-shrink-0"
                  onClick={() => dismissUpdate(update.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="fixed top-20 left-4 z-50 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Debug Information</h3>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div><strong>WebSocket:</strong> {debugInfo.websocketStatus}</div>
            <div><strong>Total Emails:</strong> {debugInfo.memoryStats?.total || 0}</div>
            <div><strong>Accounts:</strong> {debugInfo.memoryStats?.accounts || 0}</div>
            <div><strong>Active Notifications:</strong> {realTimeUpdates.length}</div>
            <div><strong>Last Update:</strong> {debugInfo.lastUpdate || 'Never'}</div>
            <div><strong>Current Search:</strong> {filters.query || 'None'}</div>
            <div><strong>Results:</strong> {emails.length} emails</div>
            <div><strong>Loaded Accounts:</strong> {accounts.length}</div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
            <button
              onClick={refreshAllData}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
            >
              Force Refresh
            </button>
            <button
              onClick={dismissAllNotifications}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
            >
              Clear All Notifications
            </button>
            <button
              onClick={() => {
                if (wsRef.current) {
                  websocketService.disconnect(wsRef.current);
                  wsRef.current = null;
                  setTimeout(setupWebSocket, 1000);
                }
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded text-sm"
            >
              Reconnect WebSocket
            </button>
            <button
              onClick={loadAccounts}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm"
            >
              Reload Accounts
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Account Manager */}
          <div className={`lg:w-80 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="card p-6 sticky top-6">
              <AccountManager onAccountChange={refreshAllData} />
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="card p-6 mb-6">
              <SearchBar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onSearch={handleSearch}
              />
            </div>

            {/* Email List Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Emails {pagination.total > 0 && `(${pagination.total})`}
              </h2>
              {loading && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              )}
            </div>

            {/* Email List */}
            <div className="card">
              <EmailList
                emails={emails}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onEmailClick={handleEmailClick}
              />
            </div>

            {/* Empty State Help */}
            {emails.length === 0 && !loading && (
              <div className="text-center py-12">
                <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {filters.query || filters.account || filters.category
                    ? 'Try adjusting your search filters or sync your accounts to load emails.'
                    : 'Add email accounts and sync them to start viewing emails.'
                  }
                </p>
                <div className="mt-4 space-x-3">
                  <button
                    onClick={() => setFilters({ query: '', account: '', category: '' })}
                    className="btn-primary"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={refreshAllData}
                    className="btn-secondary"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Detail Modal */}
      {showEmailDetail && (
        <EmailDetail
          emailId={selectedEmail}
          onClose={handleCloseEmailDetail}
        />
      )}
    </div>
  );
}

export default App;








/*
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mail, Users, Calendar, BarChart3, RefreshCw, Bug, X } from 'lucide-react';
import EmailList from './components/EmailList';
import SearchBar from './components/SearchBar';
import AccountManager from './components/AccountManager';
import EmailDetail from './components/EmailDetail';
import { emailsAPI, websocketService } from './services/api';

const NOTIFICATION_CONFIG = {
  maxNotifications: 3,
  notificationDuration: 5000,
  cooldownPeriod: 30000,
  importantCategories: ['Interested', 'Meeting Booked']
};

function App() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    query: '',
    account: '',
    category: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showEmailDetail, setShowEmailDetail] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    memoryStats: {},
    websocketStatus: 'disconnected',
    lastUpdate: null
  });
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const wsRef = useRef(null);
  const updateIdCounter = useRef(0);
  const lastNotificationTime = useRef(0);
  const isInitialMount = useRef(true);

  const searchEmails = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await emailsAPI.search({
        ...filters,
        page,
        limit: pagination.limit
      });

      if (response.data.success) {
        setEmails(response.data.data);
        setPagination(response.data.pagination);

        setDebugInfo(prev => ({
          ...prev,
          lastUpdate: new Date().toLocaleTimeString()
        }));
      }
    } catch (error) {
      console.error('Search error:', error);
      setEmails([]);
      setPagination(prev => ({ ...prev, total: 0, pages: 0 }));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  const loadStats = useCallback(async () => {
    try {
      const response = await emailsAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
        setDebugInfo(prev => ({
          ...prev,
          memoryStats: response.data.data
        }));
      }
    } catch (error) {
      console.error('Stats load error:', error);
      setStats({
        total: 0, interested: 0, meetings: 0, notInterested: 0,
        spam: 0, outOfOffice: 0, uncategorized: 0, accounts: 0
      });
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      searchEmails(pagination.page),
      loadStats()
    ]);
  }, [searchEmails, loadStats, pagination.page]);

  const addNotification = useCallback((email) => {
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime.current;

    // Check cooldown period (don't show too many notifications too quickly)
    if (timeSinceLastNotification < NOTIFICATION_CONFIG.cooldownPeriod) {
      console.log('📨 Notification skipped: Too soon since last notification');
      return;
    }

    // Check if this is an important category that should always show
    const isImportant = NOTIFICATION_CONFIG.importantCategories.includes(email.category);

    // For non-important emails, only show 1 in 3 to reduce spam
    if (!isImportant && Math.random() > 0.3) {
      console.log('📨 Notification skipped: Random filter for non-important email');
      return;
    }

    // Limit total number of notifications shown at once
    setRealTimeUpdates(prev => {
      const newUpdates = [...prev];
      if (newUpdates.length >= NOTIFICATION_CONFIG.maxNotifications) {
        newUpdates.shift(); // Remove oldest notification
      }

      const updateId = `update_${updateIdCounter.current++}_${now}`;

      newUpdates.push({
        id: updateId,
        message: `New ${email.category.toLowerCase()} email from ${email.from.name || email.from.address}`,
        email: email,
        timestamp: new Date(),
        category: email.category,
        isImportant: isImportant
      });

      lastNotificationTime.current = now;
      return newUpdates;
    });
  }, []); // Empty dependency array since NOTIFICATION_CONFIG is outside component

  const setupWebSocket = useCallback(() => {
    try {
      // Only setup if we don't have an active connection
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('🔌 WebSocket already connected, skipping setup');
        return;
      }

      console.log('🔄 Setting up WebSocket connection...');

      wsRef.current = websocketService.connect(
        (data) => {
          if (data.type === 'new_email') {
            console.log('📨 WebSocket: New email received', data.email.category);

            // Use controlled notification system
            addNotification(data.email);

            // Always refresh data in background
            refreshAllData();

            setDebugInfo(prev => ({
              ...prev,
              websocketStatus: 'connected',
              lastUpdate: new Date().toLocaleTimeString()
            }));
          } else if (data.type === 'connected') {
            setDebugInfo(prev => ({
              ...prev,
              websocketStatus: 'connected'
            }));
          }
        },
        (error) => {
          console.error('WebSocket error:', error);
          setDebugInfo(prev => ({
            ...prev,
            websocketStatus: 'error'
          }));
        },
        () => {
          console.log('🔌 WebSocket closed, attempting reconnect...');
          setDebugInfo(prev => ({
            ...prev,
            websocketStatus: 'reconnecting'
          }));
          // Auto-reconnect handled by websocketService
        }
      );
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
      setDebugInfo(prev => ({
        ...prev,
        websocketStatus: 'failed'
      }));
      // Retry after delay
      setTimeout(setupWebSocket, 5000);
    }
  }, [addNotification, refreshAllData]);

  // Auto-remove notifications after duration
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeUpdates(prev => {
        if (prev.length === 0) return prev;

        const now = Date.now();
        return prev.filter(update => {
          const age = now - update.timestamp.getTime();
          return age < NOTIFICATION_CONFIG.notificationDuration;
        });
      });
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []); // Empty dependency array since NOTIFICATION_CONFIG is outside component

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      await refreshAllData();
    };

    loadInitialData();
  }, [refreshAllData]);

  // Setup WebSocket after initial render - only once
  useEffect(() => {
    if (isInitialMount.current) {
      setupWebSocket();
      isInitialMount.current = false;
    }

    return () => {
      // Only cleanup on actual component unmount
      if (wsRef.current) {
        console.log('🧹 Cleaning up WebSocket connection');
        websocketService.disconnect(wsRef.current);
        wsRef.current = null;
      }
    };
  }, [setupWebSocket]);

  // Effect to search when filters change
  useEffect(() => {
    searchEmails(1);
  }, [filters, searchEmails]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSearch = useCallback(() => {
    searchEmails(1);
  }, [searchEmails]);

  const handlePageChange = useCallback((newPage) => {
    searchEmails(newPage);
  }, [searchEmails]);

  const handleEmailClick = useCallback((email) => {
    setSelectedEmail(email.messageId);
    setShowEmailDetail(true);
  }, []);

  const handleCloseEmailDetail = useCallback(() => {
    setShowEmailDetail(false);
    setSelectedEmail(null);
  }, []);

  const dismissUpdate = useCallback((id) => {
    setRealTimeUpdates(prev => prev.filter(update => update.id !== id));
  }, []);

  const dismissAllNotifications = useCallback(() => {
    setRealTimeUpdates([]);
  }, []);

  const StatCard = ({ icon: Icon, value, label, color = 'blue' }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{value || 0}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
        <div className={`p-2 rounded-lg bg-${color}-50`}>
          <Icon className={`h-6 w-6 text-${color}-500`} />
        </div>
      </div>
    </div>
  );

  const getNotificationColor = (category, isImportant) => {
    if (isImportant) {
      return 'bg-green-500 border-green-600';
    }

    switch (category) {
      case 'Interested':
        return 'bg-green-500 border-green-600';
      case 'Meeting Booked':
        return 'bg-purple-500 border-purple-600';
      case 'Spam':
        return 'bg-red-500 border-red-600';
      case 'Out of Office':
        return 'bg-yellow-500 border-yellow-600';
      case 'Not Interested':
        return 'bg-red-500 border-red-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-primary-500 to-primary-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Email Aggregator</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={refreshAllData}
                disabled={loading}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
                title="Debug info"
              >
                <Bug className="h-4 w-4" />
                <span className="hidden sm:inline">Debug</span>
              </button>

              <button
                className="lg:hidden p-2 rounded-md text-white hover:bg-primary-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
            <StatCard icon={Mail} value={stats.total} label="Total Emails" color="blue" />
            <StatCard icon={Users} value={stats.interested} label="Interested" color="green" />
            <StatCard icon={Calendar} value={stats.meetings} label="Meetings" color="purple" />
            <StatCard icon={BarChart3} value={stats.accounts} label="Accounts" color="orange" />
          </div>
        </div>
      </header>

  
      {realTimeUpdates.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
          
          <div className="flex justify-between items-center bg-gray-800 text-white px-3 py-2 rounded-t-lg">
            <span className="text-sm font-medium">
              Notifications ({realTimeUpdates.length})
            </span>
            <button
              onClick={dismissAllNotifications}
              className="text-gray-300 hover:text-white p-1"
              title="Dismiss all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

      
          {realTimeUpdates.map(update => (
            <div
              key={update.id}
              className={`text-white p-4 rounded-lg shadow-lg animate-slide-in-right border-l-4 ${getNotificationColor(update.category, update.isImportant)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {update.isImportant && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">Important</span>
                    )}
                    <span className="text-xs opacity-80 capitalize">{update.category}</span>
                  </div>
                  <span className="text-sm font-medium block">
                    {update.message}
                  </span>
                  <p className="text-xs opacity-80 mt-2">
                    {update.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  className="text-white hover:opacity-70 ml-2 p-1 flex-shrink-0"
                  onClick={() => dismissUpdate(update.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

 
      {showDebugPanel && (
        <div className="fixed top-20 left-4 z-50 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Debug Information</h3>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div><strong>WebSocket:</strong> {debugInfo.websocketStatus}</div>
            <div><strong>Total Emails:</strong> {debugInfo.memoryStats?.total || 0}</div>
            <div><strong>Accounts:</strong> {debugInfo.memoryStats?.accounts || 0}</div>
            <div><strong>Active Notifications:</strong> {realTimeUpdates.length}</div>
            <div><strong>Last Update:</strong> {debugInfo.lastUpdate || 'Never'}</div>
            <div><strong>Current Search:</strong> {filters.query || 'None'}</div>
            <div><strong>Results:</strong> {emails.length} emails</div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
            <button
              onClick={refreshAllData}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
            >
              Force Refresh
            </button>
            <button
              onClick={dismissAllNotifications}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
            >
              Clear All Notifications
            </button>
            <button
              onClick={() => {
                if (wsRef.current) {
                  websocketService.disconnect(wsRef.current);
                  wsRef.current = null;
                  setTimeout(setupWebSocket, 1000);
                }
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded text-sm"
            >
              Reconnect WebSocket
            </button>
          </div>
        </div>
      )}


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
         
          <div className={`lg:w-80 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="card p-6 sticky top-6">
              <AccountManager onAccountChange={refreshAllData} />
            </div>
          </div>

          
          <div className="flex-1 min-w-0">
         
            <div className="card p-6 mb-6">
              <SearchBar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onSearch={handleSearch}
              />
            </div>

           
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Emails {pagination.total > 0 && `(${pagination.total})`}
              </h2>
              {loading && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              )}
            </div>

           
            <div className="card">
              <EmailList
                emails={emails}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onEmailClick={handleEmailClick}
              />
            </div>


            {emails.length === 0 && !loading && (
              <div className="text-center py-12">
                <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {filters.query || filters.account || filters.category
                    ? 'Try adjusting your search filters or sync your accounts to load emails.'
                    : 'Add email accounts and sync them to start viewing emails.'
                  }
                </p>
                <div className="mt-4 space-x-3">
                  <button
                    onClick={() => setFilters({ query: '', account: '', category: '' })}
                    className="btn-primary"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={refreshAllData}
                    className="btn-secondary"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

     
      {showEmailDetail && (
        <EmailDetail
          emailId={selectedEmail}
          onClose={handleCloseEmailDetail}
        />
      )}
    </div>
  );
}

export default App;
*/
