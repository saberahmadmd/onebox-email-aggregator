# 📧 Email Aggregator – AI-Powered Email Management System

A **modern, full-stack email aggregation and management application** featuring **AI-powered categorization**, **real-time synchronization**, and **smart notifications** — built to replicate tools like *Reachinbox*.

## ✨ Features

### 🔐 Multi-Account Management  
- **IMAP Support:** Connect multiple email accounts (Gmail, Outlook, etc.)  
- **Secure Authentication:** Uses app passwords for security  
- **Real-time Sync:** Automatic, persistent IMAP connections  
- **Account Status:** Live connection monitoring  

### 🤖 AI-Powered Intelligence  
- **Smart Categorization:** Classifies emails using **Google Gemini AI**  
- **Categories:** Interested, Meeting Booked, Not Interested, Spam, Out of Office  
- **Suggested Replies:** AI-generated contextual email responses  
- **Email Analysis:** Intelligent prioritization & summary  

### 🔍 Advanced Search & Filtering  
- **Full-Text Search:** Across subjects, content, and senders  
- **Multi-Filters:** Filter by account, category, and date  
- **Pagination:** Efficient handling of large datasets  
- **Real-Time Updates:** WebSocket-powered live results  

### 📊 Comprehensive Dashboard  
- **Visual Analytics:** Interactive charts & metrics  
- **Category Breakdown:** See AI classification visually  
- **Account Overview:** Track multi-account performance  
- **Real-Time Notifications:** Get alerts for important messages  

### 🔔 Smart Notifications  
- **WebSocket Integration:** Real-time updates  
- **Slack Integration:** Push “Interested” leads directly to Slack  
- **Webhook Support:** Trigger automations externally  
- **Priority Alerts:** Instant detection of key communications  


## 🚀 Quick Start  

### 🧩 Prerequisites  
- Node.js **v16+**  
- MongoDB *(optional, supports in-memory)*  
- Google Gemini API Key  
- IMAP-enabled email account  

### 🧱 Installation  

# Clone repository
git clone https://github.com/your-username/email-aggregator.git
cd email-aggregator
Backend Setup
cd backend
npm install
cp .env.example .env

# Edit .env with your configuration
npm start
Frontend Setup
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
⚙️ Environment Configuration

Backend (.env)
PORT=3001
ELASTICSEARCH_URL=http://localhost:9200
GEMINI_API_KEY=your_gemini_api_key_here
SLACK_BOT_TOKEN=your_slack_token_here
SLACK_CHANNEL=#email-notifications
WEBHOOK_URL=https://your-webhook-url.com
MONGODB_URI=mongodb://localhost:27017/email-aggregator
NODE_ENV=development

Frontend (.env)
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
GENERATE_SOURCEMAP=false

🛠️ Technology Stack
Frontend
⚛️ React 18 – Modern UI framework
🎨 Tailwind CSS – Responsive, utility-first styling
🧩 Lucide React – Icon library
🌐 Axios – API communication
🔄 WebSocket – Real-time updates

Backend
🚀 Node.js + Express.js – Backend framework
📬 IMAP – Email fetching & sync
🧠 Google Gemini AI – Categorization engine
💾 MongoDB – Data persistence (optional)
🔍 Elasticsearch – Full-text search
🔔 WebSocket, Slack & Webhooks – Real-time notifications

📋 API Documentation
Accounts
Method	Endpoint	Description
GET	/api/accounts	Get all connected accounts
POST	/api/accounts	Add new email account
DELETE	/api/accounts/:email	Remove email account

Emails
Method	Endpoint	Description
GET	/api/emails/search	Search & filter emails
GET	/api/emails/stats/overview	Get email statistics
GET	/api/emails/:messageId	Get specific email details

AI Services
Method	Endpoint	Description
POST	/api/ai/categorize	Categorize an email
POST	/api/ai/suggest-reply	Get AI-suggested reply

System
Method	Endpoint	Description
GET	/health	Health check
GET	/api/test	Test endpoint

🧭 Usage Guide

📨 Adding Email Accounts
Click "Add Account"
Enter: Email Address, App Password, IMAP Host & Port
Connect → Starts Real-time Sync

💡 Tip: For Gmail, enable 2FA & use App Passwords.

📬 Email Management
View, search, and filter emails
AI categorization badges
Smart reply suggestions

🔔 Notifications
Real-time UI alerts
Slack notifications for “Interested” emails
Webhook triggers for external systems

🧩 Development
📁 Project Structure
email-aggregator/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── models/
│   └── config/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── styles/
│   └── public/
🧪 Run in Development

# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start

🏗️ Build for Production

cd server && node index.js
cd client && npm start

🐛 Troubleshooting
Issue	Possible Fix
IMAP not connecting	Check credentials, enable IMAP & app passwords
AI categorization fails	Verify Gemini API key & quota
No real-time updates	Ensure WebSocket server is active
Slack not receiving alerts	Check Slack token & channel permissions


🙏 Acknowledgments
Google Gemini AI – Intelligent categorization
Lucide React – Iconography
Tailwind CSS – Modern styling
React Community – Inspiration & support

🧠 Project Explanation
🎯 Overview
A full-stack Email Aggregator that manages multiple IMAP accounts, synchronizes emails in real-time, categorizes them using Google Gemini AI, and provides smart features like AI-suggested replies and Slack notifications.

🏗️ Architecture
Frontend: React + Tailwind → UI with real-time WebSocket updates
Backend: Node.js + Express → IMAP, AI, WebSocket, Slack integrations
AI: Google Gemini → Email classification & smart replies
Storage: In-memory / MongoDB + optional Elasticsearch

🔄 Flow
User connects email → IMAP establishes persistent connection
Fetches last 30 days of emails
AI categorizes incoming emails
Sends notifications via Slack & Webhooks
UI displays categorized, searchable emails in real-time

⚡ Features Implemented
✅ Multi-account real-time IMAP sync
✅ AI categorization with Gemini
✅ Slack + Webhook integration
✅ Search, filter, and pagination
✅ Responsive React dashboard
✅ AI-suggested replies

💡 Business Value
Automates email organization
Boosts productivity with AI
Real-time team notifications
Centralized multi-account view

🧱 Scalability
WebSocket-based updates
Modular service architecture
Ready for Docker & cloud deployment

🏁 Assignment Context
This project was built as part of the Email Aggregator Assignment (Onebox).
It demonstrates full-stack skills, AI integration, and real-time system design using Node.js, React, and Google Gemini.

“This project showcases strong problem-solving, scalable architecture design, and production-ready implementation.” 🚀

