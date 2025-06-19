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
import { useRealtimeChat } from '../hooks/useRealtimeChat';

const MessagesPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [initialUserParam, setInitialUserParam] = useState<string | null>(null);

  const { conversations, loading, loadConversations } = useConversations();
  
  // Use realtime chat for the selected conversation
  const { 
    messages: realtimeMessages, 
    sendMessage, 
    isConnected, 
    loadMessages,
    setMessages
  } = useRealtimeChat({
    conversationId: selectedConversation?.id || ''
  });

  // Convert RealtimeChatMessage[] to Message[] with proper is_read handling
  const convertedMessages = realtimeMessages.map(msg => ({
    ...msg,
    is_read: msg.is_read ?? false // Ensure is_read is always boolean
  }));

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
      if (!initialUserParam || !user || loading) return;
      
      console.log('Initializing direct chat with user:', initialUserParam);
      
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
        
        console.log('Found user profile:', profileData);
        
        // Check if conversation already exists
        const existingConversation = conversations.find(conv => 
          conv.other_user.id === profileData.id
        );
        
        if (existingConversation) {
          console.log('Using existing conversation:', existingConversation.id);
          handleConversationSelect(existingConversation);
        } else {
          console.log('Creating new conversation');
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
          
          console.log('Created conversation with ID:', conversationId);
          
          // Reload conversations to get the new one
          await loadConversations();
          
          // Find and select the new conversation after reload
          setTimeout(() => {
            const newConversation = conversations.find(conv => conv.id === conversationId);
            if (newConversation) {
              console.log('Selecting new conversation');
              handleConversationSelect(newConversation);
            }
          }, 500);
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
  }, [initialUserParam, user, loading, conversations, navigate, loadConversations]);

  const handleConversationSelect = (conversation: Conversation) => {
    console.log('Selecting conversation:', conversation.id);
    setSelectedConversation(conversation);
    setShowChatList(false);
    // Clear previous messages and load new ones
    setMessages([]);
    loadMessages();
  };

  const handleBackToList = () => {
    console.log('Going back to conversation list');
    setSelectedConversation(null);
    setShowChatList(true);
    setMessages([]);
  };

  const handleStartConversation = async (selectedUser: any) => {
    if (!user) return;

    const userToStart = Array.isArray(selectedUser) ? selectedUser[0] : selectedUser;
    if (!userToStart) return;

    console.log('Starting conversation with user:', userToStart.username);

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

      console.log('Got conversation ID:', conversationId);

      let conversation = conversations.find(c => c.id === conversationId);
      
      if (!conversation) {
        console.log('Creating new conversation object');
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

  const handleMessageSent = useCallback(async (message: any) => {
    if (!selectedConversation) return;
    
    try {
      console.log('Handling message sent:', message.content);
      await sendMessage(message.content);
      await loadConversations(); // Refresh conversation list
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [selectedConversation, sendMessage, loadConversations]);

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
      <div className="h-screen bg-gray-900 flex overflow-hidden">
        {/* Conversation List - Fixed width with its own scroll */}
        <div className={`${showChatList ? 'flex w-full' : 'hidden'} lg:flex lg:w-80 xl:w-96 flex-shrink-0 bg-gray-900 border-r border-gray-700`}>
          <div className="flex flex-col w-full h-full">
            {/* Forum Quick Access - Fixed at top */}
            <div className="flex-shrink-0">
              <ForumQuickAccess />
            </div>
            
            {/* Conversation List - Scrollable */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ConversationList
                conversations={conversations}
                selectedConversation={selectedConversation}
                onConversationSelect={handleConversationSelect}
                onStartNewConversation={() => setShowUserSearch(true)}
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* Chat Area - Takes remaining space */}
        <div className={`${!showChatList ? 'flex w-full' : 'hidden'} lg:flex lg:flex-1 min-w-0`}>
          <ChatArea
            selectedConversation={selectedConversation}
            messages={convertedMessages}
            onBackToList={handleBackToList}
            onStartNewConversation={() => setShowUserSearch(true)}
            onMessageSent={handleMessageSent}
            isConnected={isConnected}
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