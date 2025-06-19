
import { useState } from 'react';
import { Search, Plus, MessageCircle } from 'lucide-react';
import { Conversation } from '../hooks/useConversations';
import { useAuth } from '../contexts/AuthContext';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onConversationSelect: (conversation: Conversation) => void;
  onStartNewConversation: () => void;
  loading: boolean;
}

const ConversationList = ({
  conversations,
  selectedConversation,
  onConversationSelect,
  onStartNewConversation,
  loading
}: ConversationListProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

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

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.last_message) return 'No messages yet';
    
    const { content, message_type, sender_id } = conversation.last_message;
    const isOwnMessage = sender_id === user?.id;
    const prefix = isOwnMessage ? 'You: ' : '';
    
    switch (message_type) {
      case 'post_share':
        return `${prefix}Shared a post`;
      case 'image':
        return `${prefix}Sent an image`;
      case 'file':
        return `${prefix}Sent a file`;
      default:
        return `${prefix}${content}`;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <button 
            onClick={onStartNewConversation}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
          />
        </div>
      </div>

      {/* Scrollable Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <style>
          {`
            .conversations-scroll::-webkit-scrollbar {
              width: 4px;
            }
            .conversations-scroll::-webkit-scrollbar-track {
              background: #1f2937;
            }
            .conversations-scroll::-webkit-scrollbar-thumb {
              background: #374151;
              border-radius: 2px;
            }
            .conversations-scroll::-webkit-scrollbar-thumb:hover {
              background: #4b5563;
            }
          `}
        </style>
        
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2 text-center">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p className="text-gray-400 text-center mb-4 text-sm px-2">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Send a message to start a conversation'
              }
            </p>
            {!searchQuery && (
              <button 
                onClick={onStartNewConversation}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          <div className="conversations-scroll">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onConversationSelect(conversation)}
                className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-800 ${
                  selectedConversation?.id === conversation.id ? 'bg-gray-800 border-r-2 border-r-purple-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={conversation.other_user.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50'}
                      alt={conversation.other_user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {conversation.other_user.username}
                      </h3>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400 truncate flex-1">
                        {getLastMessagePreview(conversation)}
                      </p>
                      {conversation.unread_count > 0 && (
                        <div className="bg-purple-600 text-white text-xs rounded-full min-w-[18px] h-4 flex items-center justify-center px-1.5 ml-2 flex-shrink-0">
                          {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;