import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Bot, Calendar, User, Mail, Settings, Send, Edit3 } from 'lucide-react';
import { emailsAPI, aiAPI } from '../services/api';

const EmailDetail = ({ emailId, onClose }) => {
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestedReplies, setSuggestedReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyContext, setReplyContext] = useState('job_application');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const loadEmail = useCallback(async () => {
    if (!emailId) return;
    setLoading(true);

    try {
      const response = await emailsAPI.getEmail(emailId);
      if (response.data.success) {
        setEmail(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load email:', error);
    } finally {
      setLoading(false);
    }
  }, [emailId]);

  useEffect(() => {
    loadEmail();
  }, [loadEmail]);

  const getSuggestedReplies = async () => {
    if (!email) return;
    setLoadingReplies(true);

    try {
      const response = await aiAPI.getSuggestedReply(emailId, replyContext);

      if (response.data.success) {
        setSuggestedReplies(response.data.data.suggestedReplies);
        // Auto-select the first suggestion
        if (response.data.data.suggestedReplies.length > 0) {
          setReplyText(response.data.data.suggestedReplies[0]);
        }
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      setSuggestedReplies([
        "Thank you for your email. I'll get back to you soon with more information.",
        "I appreciate you reaching out. Let me review this and I'll respond shortly.",
        "Thanks for the information. I'll look into this and follow up with you."
      ]);
    } finally {
      setLoadingReplies(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Reply copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Renamed from useSuggestion to applySuggestion to avoid React Hook confusion
  const applySuggestion = (suggestion) => {
    setReplyText(suggestion);
    setEditMode(true);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !email) {
      alert('Please enter a reply message');
      return;
    }

    setSendingReply(true);
    try {
      // Send the reply to the backend
      const response = await fetch('http://localhost:3001/api/reply/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountEmail: email.account, // Use the same account that received the email
          emailId: emailId,
          replyContent: replyText,
          subjectPrefix: 'Re: '
        })
      });

      const result = await response.json();

      if (result.success) {
        setReplySent(true);
        alert('✅ Reply sent successfully!');
        setReplyText(''); // Clear the reply
        setEditMode(false);

        // Close the modal after a delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        alert(`❌ Failed to send reply: ${result.error}`);
      }
    } catch (error) {
      console.error('Send reply error:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  const getCategoryClass = (category) => {
    const classes = {
      'Interested': 'bg-green-100 text-green-800 border-green-200',
      'Meeting Booked': 'bg-purple-100 text-purple-800 border-purple-200',
      'Spam': 'bg-red-100 text-red-800 border-red-200',
      'Out of Office': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Not Interested': 'bg-red-100 text-red-800 border-red-200',
      'default': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return classes[category] || classes.default;
  };

  const contextOptions = {
    'job_application': 'Job Application',
    'sales_outreach': 'Sales Outreach',
    'partnership': 'Partnership',
    'customer_support': 'Customer Support'
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-center text-gray-600">Loading email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Email Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!email ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Email not found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              {replySent && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Send className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Reply sent successfully!
                      </h3>
                      <p className="text-sm text-green-700 mt-1">
                        Your response has been delivered to {email.from.name || email.from.address}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Meta Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">From</p>
                      <p className="text-sm text-gray-600">
                        {email.from.name} &lt;{email.from.address}&gt;
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Date</p>
                      <p className="text-sm text-gray-600">
                        {new Date(email.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Account</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {email.account}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Category</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getCategoryClass(email.category)}`}>
                      {email.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Subject</h3>
                <p className="text-gray-700">{email.subject}</p>
              </div>

              {/* Email Body */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Content</h3>
                {email.html ? (
                  <div
                    className="prose max-w-none border border-gray-200 rounded-lg p-4 bg-white max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: email.html }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap border border-gray-200 rounded-lg p-4 bg-white max-h-96 overflow-y-auto font-sans">
                    {email.text}
                  </pre>
                )}
              </div>

              {/* Reply Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Send className="h-5 w-5" />
                    <span>Send Reply</span>
                  </h3>

                  <div className="flex items-center space-x-3">
                    {/* Context Selector */}
                    <div className="relative">
                      <button
                        onClick={() => setShowContextMenu(!showContextMenu)}
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        <span>{contextOptions[replyContext]}</span>
                      </button>

                      {showContextMenu && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          {Object.entries(contextOptions).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => {
                                setReplyContext(key);
                                setShowContextMenu(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${replyContext === key ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={getSuggestedReplies}
                      disabled={loadingReplies}
                      className="btn-primary flex items-center space-x-2 disabled:bg-gray-400"
                    >
                      <Bot className="h-4 w-4" />
                      <span>{loadingReplies ? 'Generating...' : 'AI Suggestions'}</span>
                    </button>
                  </div>
                </div>

                {/* Reply Text Area */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Your Reply to {email.from.name || email.from.address}
                    </label>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>{editMode ? 'Preview' : 'Edit'}</span>
                    </button>
                  </div>

                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here or use AI suggestions..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
                    disabled={sendingReply}
                  />
                </div>

                {/* Send Reply Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setReplyText('')}
                    disabled={sendingReply || !replyText.trim()}
                    className="btn-secondary disabled:bg-gray-400"
                  >
                    Clear
                  </button>
                  <button
                    onClick={sendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="btn-primary flex items-center space-x-2 disabled:bg-gray-400"
                  >
                    {sendingReply ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Reply</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Suggestions */}
                {suggestedReplies.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Bot className="h-5 w-5" />
                      <span>AI Suggested Replies</span>
                    </h4>

                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Context: <strong>{contextOptions[replyContext]}</strong>
                      </p>
                      {suggestedReplies.map((reply, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-gray-700 mb-3 whitespace-pre-wrap">{reply}</p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => applySuggestion(reply)}
                              className="btn-primary flex items-center space-x-2 text-sm"
                            >
                              <Edit3 className="h-4 w-4" />
                              <span>Use This Reply</span>
                            </button>
                            <button
                              onClick={() => copyToClipboard(reply)}
                              className="btn-secondary flex items-center space-x-2 text-sm"
                            >
                              <Copy className="h-4 w-4" />
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailDetail;