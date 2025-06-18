import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ConversationList from '../components/ConversationList';
import ChatArea from '../components/ChatArea';
import UserSearchModal from '../components/UserSearchModal';
import ForumQuickAccess from '../components/ForumQuickAccess';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useConversations, type Conversation } from '../hooks/useConversations';
import { useMessages, type Message } from '../hooks/useMessages';
import { useRealTimeMessages } from '../hooks/useRealTimeMessages';

const MessagesPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialUserParam, setInitialUserParam] = useState<string | null>(null);

  const { conversations, loading, loadConversations } = useConversations();
  const { messages, loadMessages, addMessage, updateMessage, setMessages } = useMessages();

  // Parse URL query parameters for direct navigation to a specific user's chat
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const userParam = queryParams.get('user');
    
    if (userParam) {
      setInitialUserParam(userParam);
    }
  }, [location]);

  // Handle direct navigation to a specific user's chat
  useEffect(() => {
    const initializeDirectChat = async () => {
      if (!initialUserParam || !user || loading || conversations.length === 0) return;
      
      try {
        // Find the user profile by username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, bio')
          .eq('username', initialUserParam)
          .single();
          
        if (profileError || !profileData) {
          console.error('Error finding user profile:', profileError);
          return;
        }
        
        // Check if conversation already exists
        const existingConversation = conversations.find(conv => 
          conv.other_user.id === profileData.id
        );
        
        if (existingConversation) {
          // Use existing conversation
          handleConversationSelect(existingConversation);
        } else {
          // Create new conversation
          const { data: conversationId, error } = await supabase
            .rpc('get_or_create_conversation', {
              user1_id: user.id,
              user2_id: profileData.id
            });
            
          if (error) {
            console.error('Error creating conversation:', error);
            return;
          }
          
          // Reload conversations to get the new one
          await loadConversations();
          
          // Find and select the new conversation
          const newConversation = conversations.find(conv => conv.id === conversationId);
          if (newConversation) {
            handleConversationSelect(newConversation);
          }
        }
        
        // Clear the initial user param to prevent reprocessing
        setInitialUserParam(null);
        
        // Update URL to remove the query parameter
        navigate('/messages', { replace: true });
      } catch (error) {
        console.error('Error initializing direct chat:', error);
      }
    };
    
    initializeDirectChat();
  }, [initialUserParam, user, loading, conversations, navigate]);

  // Handle manual refresh of messages (but don't show UI indicator)
  const handleRefreshMessages = useCallback(async () => {
    if (!selectedConversation) return;
    
    setIsRefreshing(true);
    try {
      await loadMessages(selectedConversation.id);
      await loadConversations();
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedConversation, loadMessages, loadConversations]);

  // Background auto-refresh
  useEffect(() => {
    if (!selectedConversation) return;

    const autoRefreshInterval = setInterval(() => {
      if (!isRefreshing) {
        handleRefreshMessages();
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(autoRefreshInterval);
  }, [selectedConversation, handleRefreshMessages, isRefreshing]);

  // Handle real-time message updates
  const handleNewMessage = useCallback(async (newMessage: any) => {
    console.log('Processing new message:', newMessage);
    
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
    
    if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
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
    
    await loadConversations();
  }, [conversations, selectedConversation, user, addMessage, loadConversations]);

  const handleMessageUpdate = useCallback((updatedMessage: any) => {
    console.log('Processing message update:', updatedMessage);
    
    if (selectedConversation && updatedMessage.conversation_id === selectedConversation.id) {
      updateMessage(updatedMessage);
    }
  }, [selectedConversation, updateMessage]);

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
      const { data: conversationId, error } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: user.id,
          user2_id: userToStart.id
        });

      if (error) {
        console.error('Error creating conversation:', error);
        return;
      }

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
      <div className="h-full bg-gray-900 flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className={`${showChatList ? 'flex w-full' : 'hidden'} lg:flex lg:w-80 xl:w-96 flex-shrink-0`}>
          <div className="flex flex-col w-full flex-1">
            <ForumQuickAccess />
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onConversationSelect={handleConversationSelect}
              onStartNewConversation={() => setShowUserSearch(true)}
              loading={loading}
            />
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${!showChatList ? 'flex w-full' : 'hidden'} lg:flex lg:flex-1 min-w-0`}>
          <ChatArea
            selectedConversation={selectedConversation}
            messages={messages}
            onBackToList={handleBackToList}
            onStartNewConversation={() => setShowUserSearch(true)}
            onMessageSent={handleMessageSent}
            onRefreshMessages={handleRefreshMessages}
            isRefreshing={false} // Always pass false to hide the refreshing indicator
          />
        </div>
      </div>

      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onStartConversation={handleStartConversation}
      />
    </Layout>
  );
};

export default MessagesPage;