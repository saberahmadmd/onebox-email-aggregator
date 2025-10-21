import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mail, Users, Calendar, BarChart3 } from 'lucide-react';
import EmailList from './components/EmailList';
import SearchBar from './components/SearchBar';
import AccountManager from './components/AccountManager';
import EmailDetail from './components/EmailDetail';
import { emailsAPI, websocketService } from './services/api';

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
  const wsRef = useRef(null);
  const updateIdCounter = useRef(0);

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
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  const loadStats = useCallback(async () => {
    try {
      const response = await emailsAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Stats load error:', error);
    }
  }, []);

  const setupWebSocket = useCallback(() => {
    try {
      // Close existing connection if any
      if (wsRef.current) {
        websocketService.disconnect(wsRef.current);
      }

      wsRef.current = websocketService.connect(
        (data) => {
          if (data.type === 'new_email') {
            // Generate unique ID for each update
            const updateId = `update_${updateIdCounter.current++}_${Date.now()}`;

            setRealTimeUpdates(prev => [...prev, {
              id: updateId,
              message: `New email from ${data.email.from.name || data.email.from.address}`,
              email: data.email,
              timestamp: new Date()
            }]);

            // Refresh data
            searchEmails(pagination.page);
            loadStats();
          }
        },
        (error) => {
          console.error('WebSocket error:', error);
        },
        () => {
          console.log('WebSocket closed, attempting reconnect...');
          setTimeout(setupWebSocket, 5000);
        }
      );
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
      setTimeout(setupWebSocket, 5000);
    }
  }, [searchEmails, loadStats, pagination.page]);

  // Load initial data - only on mount
  useEffect(() => {
    const loadInitialData = async () => {
      await searchEmails(1);
      await loadStats();
    };

    loadInitialData();
  }, [loadStats, searchEmails]); // Empty dependency array since we only want this to run once on mount

  // Setup WebSocket after initial render
  useEffect(() => {
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        websocketService.disconnect(wsRef.current);
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

  const StatCard = ({ icon: Icon, value, label, color = 'blue' }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
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

            <button
              className="lg:hidden p-2 rounded-md text-white hover:bg-primary-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
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
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
        {realTimeUpdates.map(update => (
          <div key={update.id} className="bg-green-500 text-white p-4 rounded-lg shadow-lg animate-slide-in-right">
            <div className="flex justify-between items-center">
              <span className="text-sm">📬 {update.message}</span>
              <button
                className="text-white hover:text-green-100 ml-2"
                onClick={() => dismissUpdate(update.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Account Manager */}
          <div className={`lg:w-80 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="card p-6 sticky top-6">
              <AccountManager onAccountChange={searchEmails} />
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 min-w-0">
            <div className="card p-6 mb-6">
              <SearchBar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onSearch={handleSearch}
              />
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