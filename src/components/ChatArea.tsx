
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
  isConnected?: boolean;
}

const ChatArea = ({
  selectedConversation,
  messages,
  onBackToList,
  onStartNewConversation,
  onMessageSent,
  isConnected = false
}: ChatAreaProps) => {
  const getLastActiveStatus = () => {
    if (isConnected) return 'Active now';
    const statuses = ['5 minutes ago', '1 hour ago', '2 hours ago', 'Yesterday'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gray-900">
        <div className="text-center max-w-md">
          <div className="w-16 lg:w-20 h-16 lg:h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
            <MessageCircle className="w-8 lg:w-10 h-8 lg:h-10 text-gray-400" />
          </div>
          <h3 className="text-xl lg:text-2xl font-semibold text-white mb-2 lg:mb-3">Your messages</h3>
          <p className="text-gray-400 mb-4 lg:mb-6 text-sm lg:text-base px-4">
            Send a message to start a conversation with other developers.
          </p>
          <button 
            onClick={onStartNewConversation}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium transition-colors text-sm lg:text-base"
          >
            Start a conversation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 h-full">
      {/* Fixed Chat Header */}
      <div className="flex-shrink-0 px-3 lg:px-4 py-3 lg:py-4 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
            <button
              onClick={onBackToList}
              className="lg:hidden p-1.5 text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="relative flex-shrink-0">
              <img
                src={selectedConversation.other_user.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${selectedConversation.other_user.username}`}
                alt={selectedConversation.other_user.username}
                className="w-8 lg:w-10 h-8 lg:h-10 rounded-full object-cover"
              />
              <div className={`absolute bottom-0 right-0 w-2.5 lg:w-3 h-2.5 lg:h-3 border border-gray-900 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
            </div>
            
            <div className="min-w-0 flex-1">
              <h2 className="text-sm lg:text-lg font-semibold text-white truncate">
                {selectedConversation.other_user.username}
              </h2>
              <p className="text-xs lg:text-sm text-gray-400 truncate">
                {getLastActiveStatus()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0 ml-2">
            <button className="p-1.5 lg:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors">
              <Phone className="w-4 lg:w-5 h-4 lg:h-5" />
            </button>
            <button className="p-1.5 lg:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors">
              <Video className="w-4 lg:w-5 h-4 lg:h-5" />
            </button>
            <button className="p-1.5 lg:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors">
              <MoreVertical className="w-4 lg:w-5 h-4 lg:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Messages Area - Takes remaining space */}
      <div className="flex-1 min-h-0">
        <MessageList messages={messages} />
      </div>
      
      {/* Fixed Message Input */}
      <div className="flex-shrink-0">
        <MessageInput 
          selectedConversation={selectedConversation}
          onMessageSent={onMessageSent}
        />
      </div>
    </div>
  );
};

export default ChatArea;