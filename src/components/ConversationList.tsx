
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
      <div className="w-full lg:w-80 xl:w-96 bg-gray-800 border-r border-gray-700 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 xl:w-96 bg-gray-800 border-r border-gray-700 flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl lg:text-2xl font-bold text-white">Messages</h1>
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
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <MessageCircle className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No conversations yet</h3>
            <p className="text-gray-400 text-center mb-6">
              Start a conversation with other developers
            </p>
            <button 
              onClick={onStartNewConversation}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Start a conversation
            </button>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onConversationSelect(conversation)}
              className={`p-4 lg:p-6 cursor-pointer transition-all duration-200 border-b border-gray-700/50 hover:bg-gray-700/50 ${
                selectedConversation?.id === conversation.id ? 'bg-gray-700 border-l-4 border-l-purple-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={conversation.other_user.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50'}
                    alt={conversation.other_user.username}
                    className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm lg:text-base font-semibold text-white truncate">
                      {conversation.other_user.username}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">{formatTime(conversation.last_message_at)}</span>
                      {conversation.unread_count > 0 && (
                        <div className="bg-purple-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                          {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{getLastMessagePreview(conversation)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;