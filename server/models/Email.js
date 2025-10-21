const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  account: {
    type: String,
    required: true
  },
  from: {
    name: String,
    address: {
      type: String,
      required: true
    }
  },
  to: [{
    name: String,
    address: String
  }],
  subject: {
    type: String,
    default: '(No Subject)'
  },
  text: String,
  html: String,
  date: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    default: 'uncategorized'
  },
  labels: [String],
  folder: {
    type: String,
    default: 'INBOX'
  },
  threadId: String,
  hasAttachments: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    contentType: String,
    size: Number
  }]
}, {
  timestamps: true
});

emailSchema.index({ account: 1, date: -1 });
emailSchema.index({ category: 1 });
emailSchema.index({ 'from.address': 1 });

module.exports = mongoose.model('Email', emailSchema);