const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://onebox-email-aggregator-mauve.vercel.app/', // Added YOUR VERCEL URL
    /\.vercel\.app$/ // Allow all Vercel preview deployments
  ],
  credentials: true
}));
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
app.use('/api/debug-accounts', require('./routes/debug-accounts'));//added this extra line
app.use('/api/ai-debug', require('./routes/ai-debug'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/ai', require('./routes/ai'));
// Added this with your other routes
//app.use('/api/ai-status', require('./routes/ai-status'));
app.use('/api/reply', require('./routes/reply')); //added
app.use('/api/sync', require('./routes/sync'));   // Add this line for sync

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
