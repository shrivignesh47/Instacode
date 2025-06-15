
import { useState } from 'react';
import { Send, Paperclip, Smile, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Conversation } from '../hooks/useConversations';
import { Message } from '../hooks/useMessages';

interface MessageInputProps {
  selectedConversation: Conversation;
  onMessageSent: (message: Message) => void;
  onRefreshMessages?: () => void;
  isRefreshing?: boolean;
}

const MessageInput = ({ 
  selectedConversation, 
  onMessageSent, 
  onRefreshMessages,
  isRefreshing = false 
}: MessageInputProps) => {
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !user) return;

    const messageContent = messageInput.trim();
    setSendingMessage(true);
    setMessageInput(''); // Clear input immediately for better UX

    try {
      console.log('Sending message:', messageContent);
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: messageContent,
          message_type: 'text'
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          shared_post_id,
          file_url,
          is_read,
          created_at
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        setMessageInput(messageContent); // Restore input on error
        return;
      }

      console.log('Message sent successfully:', data);
      
      // Add the message immediately to the UI for instant feedback
      const newMessage: Message = {
        id: data.id,
        conversation_id: data.conversation_id,
        sender_id: data.sender_id,
        content: data.content,
        message_type: data.message_type,
        shared_post_id: data.shared_post_id,
        file_url: data.file_url,
        is_read: data.is_read,
        created_at: data.created_at,
        sender: {
          username: user.username || 'You',
          avatar_url: user.avatar || ''
        }
      };

      onMessageSent(newMessage);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageInput(messageContent); // Restore input on error
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-800 border-t border-gray-700 flex-shrink-0 pb-6 lg:pb-6">
      <div className="flex items-center space-x-3">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors flex-shrink-0">
          <Paperclip className="w-5 h-5" />
        </button>
        
        <div className="flex-1 relative">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            disabled={sendingMessage}
          />
        </div>
        
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors flex-shrink-0">
          <Smile className="w-5 h-5" />
        </button>

        {onRefreshMessages && (
          <button 
            onClick={onRefreshMessages}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors flex-shrink-0 disabled:opacity-50"
            title="Refresh messages"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
        
        <button
          onClick={sendMessage}
          disabled={!messageInput.trim() || sendingMessage}
          className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full transition-colors flex-shrink-0"
        >
          {sendingMessage ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;