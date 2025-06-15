import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  MessageCircle, 
  Phone, 
  Video, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile,
  ArrowLeft,
  Check,
  CheckCheck
} from 'lucide-react';
import Layout from '../components/Layout';
import UserSearchModal from '../components/UserSearchModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { PostWithUser } from '../lib/supabaseClient';

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  other_user: {
    id: string;
    username: string;
    avatar_url: string;
    bio: string;
  };
  last_message?: {
    content: string;
    message_type: string;
    sender_id: string;
  };
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'post_share' | 'image' | 'file';
  shared_post_id?: string;
  shared_post?: PostWithUser;
  file_url?: string;
  is_read: boolean;
  created_at: string;
  sender: {
    username: string;
    avatar_url: string;
  };
}

const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatList, setShowChatList] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for user:', user.id);

    // Subscribe to new messages for all conversations
    const messagesChannel = supabase
      .channel('user_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(${conversations.map(c => c.id).join(',')})`
        },
        async (payload) => {
          console.log('Real-time: New message received', payload);
          await handleNewMessage(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(${conversations.map(c => c.id).join(',')})`
        },
        async (payload) => {
          console.log('Real-time: Message updated', payload);
          await handleMessageUpdate(payload.new as any);
        }
      )
      .subscribe((status) => {
        console.log('Messages channel subscription status:', status);
      });

    // Subscribe to conversation updates
    const conversationsChannel = supabase
      .channel('user_conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `or(participant_1.eq.${user.id},participant_2.eq.${user.id})`
        },
        (payload) => {
          console.log('Real-time: Conversation updated', payload);
          loadConversations();
        }
      )
      .subscribe((status) => {
        console.log('Conversations channel subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationsChannel);
    };
  }, [user, conversations.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_1,
          participant_2,
          last_message_at,
          last_message_id,
          profiles!conversations_participant_1_fkey(id, username, avatar_url, bio),
          profiles_participant_2:profiles!conversations_participant_2_fkey(id, username, avatar_url, bio)
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      const formattedConversations: Conversation[] = [];

      for (const conv of data) {
        const otherUser = conv.participant_1 === user.id 
          ? conv.profiles_participant_2 
          : conv.profiles;
        
        const otherUserObj = Array.isArray(otherUser) ? otherUser[0] : otherUser;
        if (!otherUserObj) continue;

        // Get last message if exists
        let lastMessage = undefined;
        if (conv.last_message_id) {
          const { data: messageData } = await supabase
            .from('messages')
            .select('content, message_type, sender_id')
            .eq('id', conv.last_message_id)
            .single();
          
          if (messageData) {
            lastMessage = messageData;
          }
        }

        formattedConversations.push({
          id: conv.id,
          participant_1: conv.participant_1,
          participant_2: conv.participant_2,
          last_message_at: conv.last_message_at || new Date().toISOString(),
          other_user: {
            id: otherUserObj.id,
            username: otherUserObj.username,
            avatar_url: otherUserObj.avatar_url || '',
            bio: otherUserObj.bio || ''
          },
          last_message: lastMessage,
          unread_count: 0
        });
      }

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
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
          profiles:profiles!messages_sender_id_fkey(username, avatar_url),
          posts:posts!messages_shared_post_id_fkey(
            id,
            type,
            content,
            project_title,
            media_url,
            profiles:profiles!posts_user_id_fkey(username, avatar_url)
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const formattedMessages: Message[] = data.map(msg => {
        const senderProfile = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles;
        const postData = Array.isArray(msg.posts) ? msg.posts[0] : msg.posts;

        const sharedPost = postData ? {
          ...postData,
          profiles: Array.isArray(postData.profiles) ? postData.profiles[0] : postData.profiles
        } : undefined;
        
        return {
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_id: msg.sender_id,
          content: msg.content,
          message_type: msg.message_type,
          shared_post_id: msg.shared_post_id,
          shared_post: sharedPost as PostWithUser | undefined,
          file_url: msg.file_url,
          is_read: msg.is_read,
          created_at: msg.created_at,
          sender: {
            username: senderProfile?.username || 'Unknown',
            avatar_url: senderProfile?.avatar_url || ''
          }
        };
      });

      setMessages(formattedMessages);
      await markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .rpc('mark_messages_as_read', {
          conv_id: conversationId,
          user_id: user.id
        });

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleNewMessage = async (newMessage: any) => {
    console.log('Processing new message:', newMessage);
    
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

        // Check if message already exists to prevent duplicates
        setMessages(prev => {
          const exists = prev.find(msg => msg.id === formattedMessage.id);
          if (exists) {
            console.log('Message already exists, not adding duplicate');
            return prev;
          }
          console.log('Adding new message to UI');
          return [...prev, formattedMessage];
        });

        // Mark as read if it's not from current user
        if (newMessage.sender_id !== user?.id) {
          await markMessagesAsRead(selectedConversation.id);
        }
      }
    }
    
    // Always reload conversations to update last message
    await loadConversations();
  };

  const handleMessageUpdate = async (updatedMessage: any) => {
    console.log('Processing message update:', updatedMessage);
    
    if (selectedConversation && updatedMessage.conversation_id === selectedConversation.id) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === updatedMessage.id 
            ? { ...msg, ...updatedMessage }
            : msg
        )
      );
    }
  };

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

      setMessages(prev => [...prev, newMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageInput(messageContent); // Restore input on error
    } finally {
      setSendingMessage(false);
    }
  };

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
        setConversations(prev => [conversation!, ...prev]);
      }

      handleConversationSelect(conversation);
      setShowUserSearch(false);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

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

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender_id === user?.id;
    
    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
          {/* Message Content */}
          <div className={`px-4 py-3 rounded-2xl ${
            isOwnMessage
              ? 'bg-purple-600 text-white rounded-br-md'
              : 'bg-gray-700 text-gray-100 rounded-bl-md'
          }`}>
            <p className="text-sm break-words">{message.content}</p>
          </div>
          
          {/* Message Info */}
          <div className={`flex items-center mt-1 space-x-1 ${
            isOwnMessage ? 'justify-end' : 'justify-start'
          }`}>
            <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
            {isOwnMessage && (
              <div className="text-gray-500">
                {message.is_read ? (
                  <CheckCheck className="w-3 h-3 text-blue-400" />
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

  const filteredConversations = conversations.filter(conv =>
    conv.other_user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {/* Chat List */}
        <div className={`${
          showChatList ? 'flex' : 'hidden'
        } lg:flex w-full lg:w-80 xl:w-96 bg-gray-800 border-r border-gray-700 flex-col flex-shrink-0`}>
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl lg:text-2xl font-bold text-white">Messages</h1>
              <button 
                onClick={() => setShowUserSearch(true)}
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
                  onClick={() => setShowUserSearch(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
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

        {/* Chat Area */}
        <div className={`${
          !showChatList ? 'flex' : 'hidden'
        } lg:flex flex-1 flex-col bg-gray-900 min-w-0`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 lg:p-6 bg-gray-800 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    onClick={handleBackToList}
                    className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="relative flex-shrink-0">
                    <img
                      src={selectedConversation.other_user.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50'}
                      alt={selectedConversation.other_user.username}
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg lg:text-xl font-semibold text-white truncate">
                      {selectedConversation.other_user.username}
                    </h2>
                    <p className="text-sm text-gray-400 truncate">Active now</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 lg:p-6"
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Start the conversation</h3>
                      <p className="text-gray-400">Send a message to get started</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 lg:p-6 bg-gray-800 border-t border-gray-700 flex-shrink-0">
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
            </>
          ) : (
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
                  onClick={() => setShowUserSearch(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Start a conversation
                </button>
              </div>
            </div>
          )}
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