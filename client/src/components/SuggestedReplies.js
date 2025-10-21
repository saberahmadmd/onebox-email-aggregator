import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

const SuggestedReplies = ({ replies, onUseReply }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!replies || replies.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">🤖</span>
        AI Suggested Replies
      </h4>
      <div className="space-y-3">
        {replies.map((reply, index) => (
          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-gray-700 mb-3 whitespace-pre-wrap">{reply}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => onUseReply && onUseReply(reply)}
                className="btn-primary text-sm py-1 px-3"
              >
                Use This Reply
              </button>
              <button
                onClick={() => copyToClipboard(reply, index)}
                className="btn-secondary text-sm py-1 px-3 flex items-center space-x-1"
              >
                {copiedIndex === index ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span>{copiedIndex === index ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedReplies;