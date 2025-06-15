
import { Phone, Video, MoreVertical, ArrowLeft, MessageCircle } from 'lucide-react';
import { Conversation } from '../hooks/useConversations';
import { Message } from '../hooks/useMessages';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatAreaProps {
  selectedConversation: Conversation | null;
  messages: Message[];
  onBackToList: () => void;
  onStartNewConversation: () => void;
  onMessageSent: (message: Message) => void;
  onRefreshMessages?: () => void;
  isRefreshing?: boolean;
}

const ChatArea = ({
  selectedConversation,
  messages,
  onBackToList,
  onStartNewConversation,
  onMessageSent,
  onRefreshMessages,
  isRefreshing = false
}: ChatAreaProps) => {
  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">Your messages</h3>
          <p className="text-gray-400 mb-6">
            Send a message to start a conversation with other developers.
          </p>
          <button 
            onClick={onStartNewConversation}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Start a conversation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 min-w-0 h-full">
      {/* Chat Header */}
      <div className="p-3 sm:p-4 lg:p-6 bg-gray-800 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <button
            onClick={onBackToList}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="relative flex-shrink-0">
            <img
              src={selectedConversation.other_user.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50'}
              alt={selectedConversation.other_user.username}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-gray-800 rounded-full"></div>
          </div>
          
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-white truncate">
              {selectedConversation.other_user.username}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 truncate">Active now</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
          <button className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Message Input */}
      <MessageInput 
        selectedConversation={selectedConversation}
        onMessageSent={onMessageSent}
        onRefreshMessages={onRefreshMessages}
        isRefreshing={isRefreshing}
      />
    </div>
  );
};

export default ChatArea;