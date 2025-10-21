import { Mail, Calendar, User, Tag } from 'lucide-react';

const EmailList = ({ emails, loading, pagination, onPageChange, onEmailClick }) => {
  const getCategoryClass = (category) => {
    const classes = {
      'Interested': 'bg-green-100 text-green-800',
      'Meeting Booked': 'bg-purple-100 text-purple-800',
      'Spam': 'bg-red-100 text-red-800',
      'Out of Office': 'bg-yellow-100 text-yellow-800',
      'Not Interested': 'bg-red-100 text-red-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return classes[category] || classes.default;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Interested': User,
      'Meeting Booked': Calendar,
      'default': Mail
    };
    return icons[category] || icons.default;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading emails...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Emails ({pagination.total})
        </h2>
      </div>

      {emails.length === 0 ? (
        <div className="p-8 text-center">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No emails found</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-200">
            {emails.map((email, index) => {
              const CategoryIcon = getCategoryIcon(email.category);
              // Use messageId + index as key to ensure uniqueness
              const uniqueKey = email.messageId ? `${email.messageId}_${index}` : `email_${index}_${Date.now()}`;

              return (
                <div
                  key={uniqueKey}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  onClick={() => onEmailClick(email)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <CategoryIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {email.from?.name || email.from?.address || 'Unknown Sender'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {email.subject || '(No Subject)'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {email.date ? new Date(email.date).toLocaleDateString() : 'Unknown Date'}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {email.text?.substring(0, 150) || 'No content available'}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {email.account || 'Unknown Account'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getCategoryClass(email.category)}`}>
                        <Tag className="h-3 w-3 mr-1" />
                        {email.category || 'uncategorized'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>

              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmailList;