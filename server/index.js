

/*
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// WebSocket setup
wss.on('connection', (ws) => {
  console.log('✅ Client connected via WebSocket');
  ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
});

const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

app.set('broadcast', broadcast);
global.broadcastFunction = broadcast;

// Routes - Import routes safely
try {
  app.use('/api/debug', require('./routes/debug'));
  app.use('/api/accounts', require('./routes/accounts'));
  app.use('/api/emails', require('./routes/emails'));
  app.use('/api/ai', require('./routes/ai'));
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Route loading error:', error);
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Onebox Backend'
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - FIXED: Use proper Express 5 syntax
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001;

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
*/



const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

wss.on('connection', (ws) => {
  console.log('✅ Client connected via WebSocket');
  ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
});

const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

app.set('broadcast', broadcast);
global.broadcastFunction = broadcast;

app.use('/api/debug', require('./routes/debug'));

app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/ai', require('./routes/ai'));

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Onebox Backend - DEBUG MODE'
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔧 DEBUG MODE: Enabled`);
  console.log(`📊 Check: http://localhost:${PORT}/api/debug/services`);
});