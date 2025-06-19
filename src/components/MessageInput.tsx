
import { useState, useMemo, useEffect } from 'react';
import { Send, Paperclip, Smile, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Conversation } from '../hooks/useConversations';
import { Message } from '../hooks/useMessages';
import { useForums } from '../hooks/useForums';

interface MessageInputProps {
  selectedConversation: Conversation;
  onMessageSent: (message: Message) => void;
}

const MessageInput = ({ 
  selectedConversation, 
  onMessageSent
}: MessageInputProps) => {
  const { user } = useAuth();
  const { forums, joinForum } = useForums();
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showForumSuggestions, setShowForumSuggestions] = useState(false);

  // Memoize the mentioned forums calculation
  const mentionedForums = useMemo(() => {
    if (!messageInput) return [];
    return forums.filter(forum => 
      messageInput.toLowerCase().includes(forum.name.toLowerCase()) && !forum.is_member
    );
  }, [messageInput, forums]);

  // Update showForumSuggestions based on mentionedForums
  useEffect(() => {
    setShowForumSuggestions(mentionedForums.length > 0);
  }, [mentionedForums]);

  const handleInputChange = (value: string) => {
    setMessageInput(value);
  };

  const handleJoinForum = async (forumId: string) => {
    try {
      await joinForum(forumId);
      setShowForumSuggestions(false);
    } catch (error) {
      console.error('Failed to join forum:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !user) return;

    const messageContent = messageInput.trim();
    setSendingMessage(true);
    setMessageInput('');
    setShowForumSuggestions(false);

    // This will be handled by the parent component with realtime functionality
    // For now, we'll create a temporary message object
    const tempMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      content: messageContent,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        username: user.username || 'You',
        avatar_url: user.avatar || ''
      }
    };

    try {
      onMessageSent(tempMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageInput(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="p-3 lg:p-4 bg-gray-800 border-t border-gray-700 flex-shrink-0">
      {/* Forum Join Suggestions */}
      {showForumSuggestions && mentionedForums.length > 0 && (
        <div className="mb-3 p-3 bg-purple-900/20 border border-purple-700 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-200 font-medium">Join related forums</span>
          </div>
          <div className="space-y-2">
            {mentionedForums.slice(0, 2).map((forum) => (
              <div key={forum.id} className="flex items-center justify-between bg-gray-700 rounded-md p-2">
                <div>
                  <div className="text-sm text-white font-medium">{forum.name}</div>
                  <div className="text-xs text-gray-400">{forum.members_count} members</div>
                </div>
                <button
                  onClick={() => handleJoinForum(forum.id)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 lg:space-x-3">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors flex-shrink-0">
          <Paperclip className="w-4 h-4 lg:w-5 lg:h-5" />
        </button>
        
        <div className="flex-1 relative">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-gray-700 border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm lg:text-base"
            disabled={sendingMessage}
          />
        </div>
        
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors flex-shrink-0">
          <Smile className="w-4 h-4 lg:w-5 lg:h-5" />
        </button>
        
        <button
          onClick={sendMessage}
          disabled={!messageInput.trim() || sendingMessage}
          className="p-2 lg:p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full transition-colors flex-shrink-0"
        >
          {sendingMessage ? (
            <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Send className="w-4 h-4 lg:w-5 lg:h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;