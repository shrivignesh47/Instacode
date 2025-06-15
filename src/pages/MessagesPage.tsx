import { useState, useCallback, useEffect } from 'react';
import Layout from '../components/Layout';
import ConversationList from '../components/ConversationList';
import ChatArea from '../components/ChatArea';
import UserSearchModal from '../components/UserSearchModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useConversations, type Conversation } from '../hooks/useConversations';
import { useMessages, type Message } from '../hooks/useMessages';
import { useRealTimeMessages } from '../hooks/useRealTimeMessages';

const MessagesPage = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { conversations, loading, loadConversations } = useConversations();
  const { messages, loadMessages, addMessage, updateMessage, setMessages } = useMessages();

  // Auto refresh every 10 seconds when a conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const interval = setInterval(() => {
      console.log('Auto-refreshing messages...');
      handleRefreshMessages();
    }, 2000); // 10 seconds

    return () => clearInterval(interval);
  }, [selectedConversation]);

  // Handle manual refresh of messages
  const handleRefreshMessages = useCallback(async () => {
    if (!selectedConversation || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      console.log('Manually refreshing messages for conversation:', selectedConversation.id);
      await loadMessages(selectedConversation.id);
      await loadConversations(); // Also refresh conversations to update last message
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedConversation, loadMessages, loadConversations, isRefreshing]);

  // Handle real-time message updates
  const handleNewMessage = useCallback(async (newMessage: any) => {
    console.log('Processing new message:', newMessage);
    
    // Check if this message belongs to any of the user's conversations
    const userConversations = conversations.filter(conv => 
      conv.participant_1 === user?.id || conv.participant_2 === user?.id
    );
    
    const relevantConversation = userConversations.find(conv => 
      conv.id === newMessage.conversation_id
    );
    
    if (!relevantConversation) {
      console.log('Message not for user conversations, ignoring');
      return;
    }
    
    // If the message is for the current conversation, add it to messages
    if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
      // Fetch the complete message with sender info
      const { data: messageData, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          shared_post_id,
          file_url,
          is_read,
          created_at,
          profiles:profiles!messages_sender_id_fkey(username, avatar_url)
        `)
        .eq('id', newMessage.id)
        .single();

      if (!error && messageData) {
        const senderProfile = Array.isArray(messageData.profiles) ? messageData.profiles[0] : messageData.profiles;
        const formattedMessage: Message = {
          id: messageData.id,
          conversation_id: messageData.conversation_id,
          sender_id: messageData.sender_id,
          content: messageData.content,
          message_type: messageData.message_type,
          shared_post_id: messageData.shared_post_id,
          file_url: messageData.file_url,
          is_read: messageData.is_read,
          created_at: messageData.created_at,
          sender: {
            username: senderProfile?.username || 'Unknown',
            avatar_url: senderProfile?.avatar_url || ''
          }
        };

        addMessage(formattedMessage);
      }
    }
    
    // Always reload conversations to update last message
    await loadConversations();
  }, [conversations, selectedConversation, user, addMessage, loadConversations]);

  const handleMessageUpdate = useCallback((updatedMessage: any) => {
    console.log('Processing message update:', updatedMessage);
    
    if (selectedConversation && updatedMessage.conversation_id === selectedConversation.id) {
      updateMessage(updatedMessage);
    }
  }, [selectedConversation, updateMessage]);

  // Set up real-time subscriptions
  useRealTimeMessages({
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleMessageUpdate,
    onConversationUpdate: loadConversations
  });

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowChatList(false);
    loadMessages(conversation.id);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setShowChatList(true);
    setMessages([]);
  };

  const handleStartConversation = async (selectedUser: any) => {
    if (!user) return;

    const userToStart = Array.isArray(selectedUser) ? selectedUser[0] : selectedUser;
    if (!userToStart) return;

    try {
      // Get or create conversation
      const { data: conversationId, error } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: user.id,
          user2_id: userToStart.id
        });

      if (error) {
        console.error('Error creating conversation:', error);
        return;
      }

      // Find the conversation in our list or create a new one
      let conversation = conversations.find(c => c.id === conversationId);
      
      if (!conversation) {
        conversation = {
          id: conversationId,
          participant_1: user.id,
          participant_2: userToStart.id,
          last_message_at: new Date().toISOString(),
          other_user: {
            id: userToStart.id,
            username: userToStart.username,
            avatar_url: userToStart.avatar_url || '',
            bio: userToStart.bio || ''
          },
          unread_count: 0
        };
        await loadConversations();
      }

      handleConversationSelect(conversation);
      setShowUserSearch(false);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleMessageSent = (message: Message) => {
    addMessage(message);
  };

  if (loading) {
    return (
      <Layout>
        <div className="h-full bg-gray-900 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white text-lg">Loading messages...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full bg-gray-900 flex overflow-hidden">
        {/* Conversation List */}
        <div className={`${showChatList ? 'flex' : 'hidden'} lg:flex`}>
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onConversationSelect={handleConversationSelect}
            onStartNewConversation={() => setShowUserSearch(true)}
            loading={loading}
          />
        </div>

        {/* Chat Area */}
        <div className={`${!showChatList ? 'flex' : 'hidden'} lg:flex flex-1`}>
          <ChatArea
            selectedConversation={selectedConversation}
            messages={messages}
            onBackToList={handleBackToList}
            onStartNewConversation={() => setShowUserSearch(true)}
            onMessageSent={handleMessageSent}
            onRefreshMessages={handleRefreshMessages}
            isRefreshing={isRefreshing}
          />
        </div>
      </div>

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onStartConversation={handleStartConversation}
      />
    </Layout>
  );
};

export default MessagesPage;