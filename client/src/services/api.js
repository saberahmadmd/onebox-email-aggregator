import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Only log non-search requests to reduce noise
    if (!config.url?.includes('/emails/search') && !config.url?.includes('/emails/stats/overview')) {
      console.log(`🔄 API Call: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log 404 errors for search/stats as they're handled gracefully
    if (error.response?.status === 404 &&
      (error.config?.url?.includes('/emails/search') || error.config?.url?.includes('/emails/stats/overview'))) {
      return Promise.reject(error);
    }

    console.error('❌ API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });

    if (error.response?.status >= 500) {
      console.error('🚨 Server error occurred');
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout');
    } else if (!navigator.onLine) {
      console.error('🌐 Network error - check connection');
    }

    return Promise.reject(error);
  }
);

// WebSocket service with connection management
export const websocketService = {
  connect: (onMessage, onError, onClose) => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';

    // Close existing connection if any
    if (window.__currentWebSocket) {
      window.__currentWebSocket.close();
    }

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      window.__currentWebSocket = ws; // Store reference
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('❌ WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      if (window.__currentWebSocket === ws) {
        window.__currentWebSocket = null;
      }
      if (onClose) onClose(event);

      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        console.log('🔄 Attempting WebSocket reconnection...');
        websocketService.connect(onMessage, onError, onClose);
      }, 5000);
    };

    return ws;
  },

  disconnect: (ws) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close(1000, 'Client disconnected');
    }
    if (window.__currentWebSocket === ws) {
      window.__currentWebSocket = null;
    }
  },

  // Get current connection status
  getStatus: () => {
    if (!window.__currentWebSocket) return 'disconnected';
    return window.__currentWebSocket.readyState === WebSocket.OPEN ? 'connected' : 'connecting';
  }
};

// Accounts API
export const accountsAPI = {
  addAccount: async (accountData) => {
    try {
      const response = await api.post('/accounts', accountData);
      return response;
    } catch (error) {
      console.error('Add account API error:', error.response?.data || error.message);
      throw error;
    }
  },

  getAccounts: async () => {
    try {
      const response = await api.get('/accounts');
      return response;
    } catch (error) {
      console.error('Get accounts API error:', error);
      // Return empty array instead of failing
      return { data: { success: true, data: [] } };
    }
  },

  removeAccount: async (email) => {
    try {
      const response = await api.delete(`/accounts/${encodeURIComponent(email)}`);
      return response;
    } catch (error) {
      console.error('Remove account API error:', error);
      throw error;
    }
  },

  // Test connection without adding
  testConnection: async (accountData) => {
    try {
      const response = await api.post('/debug-accounts/test-connection', accountData);
      return response;
    } catch (error) {
      console.error('Test connection API error:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Emails API
export const emailsAPI = {
  search: (params) => {
    const searchParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        searchParams.append(key, params[key]);
      }
    });

    return api.get(`/emails/search?${searchParams.toString()}`);
  },

  getEmail: (messageId) => {
    if (!messageId) {
      return Promise.reject(new Error('Message ID is required'));
    }
    return api.get(`/emails/${encodeURIComponent(messageId)}`);
  },

  getStats: () => api.get('/emails/stats/overview'),
};

// AI API
export const aiAPI = {
  getSuggestedReply: (emailId, context) =>
    api.post('/ai/suggest-reply', { emailId, context }),

  categorizeEmail: (emailId) =>
    api.post('/ai/categorize', { emailId }),
};

// Test API connection
export const testAPI = {
  health: () => api.get('/health'),
  test: () => api.get('/api/test')
};

export default api;