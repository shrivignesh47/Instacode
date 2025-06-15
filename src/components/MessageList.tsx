
import { useEffect, useRef } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Message } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';

interface MessageListProps {
  messages: Message[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender_id === user?.id;
    
    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
          {/* Message Content */}
          <div className={`px-4 py-3 rounded-2xl ${
            isOwnMessage
              ? 'bg-purple-600 text-white rounded-br-md'
              : 'bg-gray-700 text-gray-100 rounded-bl-md'
          }`}>
            <p className="text-sm break-words">{message.content}</p>
          </div>
          
          {/* Message Info */}
          <div className={`flex items-center mt-1 space-x-1 ${
            isOwnMessage ? 'justify-end' : 'justify-start'
          }`}>
            <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
            {isOwnMessage && (
              <div className="text-gray-500">
                {message.is_read ? (
                  <CheckCheck className="w-3 h-3 text-blue-400" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6" style={{
      scrollbarWidth: 'thin',
      scrollbarColor: '#374151 #1f2937'
    }}>
      <style>
        {`
          .flex-1::-webkit-scrollbar {
            width: 6px;
          }
          .flex-1::-webkit-scrollbar-track {
            background: #1f2937;
          }
          .flex-1::-webkit-scrollbar-thumb {
            background: #374151;
            border-radius: 3px;
          }
          .flex-1::-webkit-scrollbar-thumb:hover {
            background: #4b5563;
          }
        `}
      </style>
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 text-gray-600 mx-auto mb-4">💬</div>
            <h3 className="text-xl font-semibold text-white mb-2">Start the conversation</h3>
            <p className="text-gray-400">Send a message to get started</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default MessageList;