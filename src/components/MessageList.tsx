import { useEffect } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChatScroll } from '../hooks/useChatScroll';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'post_share' | 'image' | 'file';
  shared_post_id?: string;
  created_at: string;
  is_read?: boolean;
  sender: {
    username: string;
    avatar_url: string;
  };
}

interface MessageListProps {
  messages: Message[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const { user, loading: authLoading } = useAuth();
  const { containerRef, scrollToBottom } = useChatScroll();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
    // Enhanced check for message ownership - ensure user.id exists before comparison
    const isOwnMessage = !authLoading && user?.id && user.id === message.sender_id;
    
    // Debug logging to help identify attribution issues
    if (process.env.NODE_ENV === 'development') {
      console.log('Message attribution debug:', {
        messageId: message.id,
        senderId: message.sender_id,
        currentUserId: user?.id,
        isOwnMessage,
        authLoading,
        userExists: !!user
      });
    }
    
    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 lg:mb-4 px-3 lg:px-4`}
      >
        <div className={`max-w-[85%] lg:max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
          <div className={`px-3 lg:px-4 py-2 lg:py-3 rounded-2xl ${
            isOwnMessage
              ? 'bg-purple-600 text-white rounded-br-sm'
              : 'bg-gray-800 text-gray-100 rounded-bl-sm'
          }`}>
            <p className="text-sm lg:text-base break-words leading-relaxed">{message.content}</p>
          </div>
          
          <div className={`flex items-center mt-1 lg:mt-2 space-x-1 px-2 ${
            isOwnMessage ? 'justify-end' : 'justify-start'
          }`}>
            <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
            {isOwnMessage && (
              <div className="text-gray-500 ml-1">
                {message.is_read ? (
                  <CheckCheck className="w-3 h-3 text-purple-400" />
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

  // Show loading state while authentication is being determined
  if (authLoading) {
    return (
      <div className="h-full flex flex-col">
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto py-2 lg:py-4"
        >
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading messages...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if user is not available after loading
  if (!authLoading && !user) {
    return (
      <div className="h-full flex flex-col">
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto py-2 lg:py-4"
        >
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center">
              <p className="text-red-400 text-sm">Authentication error. Please refresh the page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto py-2 lg:py-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#374151 transparent'
        }}
      >
        <style>
          {`
            .flex-1::-webkit-scrollbar {
              width: 3px;
            }
            .flex-1::-webkit-scrollbar-track {
              background: transparent;
            }
            .flex-1::-webkit-scrollbar-thumb {
              background: #374151;
              border-radius: 2px;
            }
            .flex-1::-webkit-scrollbar-thumb:hover {
              background: #4b5563;
            }
          `}
        </style>
        
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center">
              <div className="w-12 lg:w-16 h-12 lg:h-16 text-gray-600 mx-auto mb-3 lg:mb-4 text-3xl lg:text-4xl">💬</div>
              <h3 className="text-lg lg:text-xl font-semibold text-white mb-1 lg:mb-2">Start the conversation</h3>
              <p className="text-gray-400 text-sm lg:text-base">Send a message to get started</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map(renderMessage)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;