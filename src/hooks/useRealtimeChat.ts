import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface UseRealtimeChatProps {
  conversationId: string;
}

export interface RealtimeChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'post_share' | 'image' | 'file';
  shared_post_id?: string;
  created_at: string;
  is_read?: boolean;
  sender: {
    username: string;
    avatar_url: string;
  };
}

const EVENT_MESSAGE_TYPE = 'new_message';

export function useRealtimeChat({ conversationId }: UseRealtimeChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<RealtimeChatMessage[]>([]);
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      console.warn('Cannot load messages - no conversation ID');
      return;
    }

    try {
      console.log('Loading messages for conversation:', conversationId);

      // Enhanced query with better error handling and ordering
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          shared_post_id,
          created_at,
          profiles:profiles!messages_sender_id_fkey(username, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      console.log('Raw messages data:', data);

      if (!data) {
        console.log('No messages found for conversation');
        setMessages([]);
        return;
      }

      const formattedMessages: RealtimeChatMessage[] = data.map(msg => {
        // Handle both array and object responses from Supabase
        const senderProfile = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles;
        
        return {
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_id: msg.sender_id,
          content: msg.content,
          message_type: msg.message_type,
          shared_post_id: msg.shared_post_id,
          created_at: msg.created_at,
          is_read: false,
          sender: {
            username: senderProfile?.username || 'Unknown User',
            avatar_url: senderProfile?.avatar_url || ''
          }
        };
      });

      console.log('Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Exception in loadMessages:', error);
    }
  }, [conversationId]);

  // Auto-load messages when conversationId changes
  useEffect(() => {
    if (conversationId && user) {
      console.log('Auto-loading messages for conversation:', conversationId);
      // Clear existing messages first
      setMessages([]);
      // Load messages for the new conversation
      loadMessages();
    } else {
      // Clear messages if no conversation is selected
      setMessages([]);
    }
  }, [conversationId, user, loadMessages]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const channelName = `chat_${conversationId}`;
    const newChannel = supabase.channel(channelName);

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        console.log('Received real-time message:', payload);
        const newMessage = payload.payload as RealtimeChatMessage;
        setMessages((current) => {
          // Check if message already exists to prevent duplicates
          const exists = current.find(msg => msg.id === newMessage.id);
          if (exists) {
            console.log('Message already exists, skipping duplicate');
            return current;
          }
          console.log('Adding new message to UI');
          return [...current, newMessage];
        });
      })
      .subscribe(async (status) => {
        console.log('Realtime channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(newChannel);

    return () => {
      console.log('Cleaning up realtime channel');
      supabase.removeChannel(newChannel);
      setIsConnected(false);
    };
  }, [conversationId, user]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected || !user || !conversationId) {
        console.warn('Cannot send message - missing requirements:', {
          hasChannel: !!channel,
          isConnected,
          hasUser: !!user,
          hasConversationId: !!conversationId
        });
        return;
      }

      try {
        console.log('Sending message:', { content, conversationId, userId: user.id });

        // Insert message into database
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: content.trim(),
            message_type: 'text'
          })
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            message_type,
            shared_post_id,
            created_at
          `)
          .single();

        if (error) {
          console.error('Error sending message to database:', error);
          return;
        }

        console.log('Message saved to database:', data);

        // Create realtime message object
        const realtimeMessage: RealtimeChatMessage = {
          id: data.id,
          conversation_id: data.conversation_id,
          sender_id: data.sender_id,
          content: data.content,
          message_type: data.message_type,
          shared_post_id: data.shared_post_id,
          created_at: data.created_at,
          is_read: false,
          sender: {
            username: user.username || 'You',
            avatar_url: user.avatar || ''
          }
        };

        // Add to local state immediately for the sender
        setMessages((current) => {
          const exists = current.find(msg => msg.id === realtimeMessage.id);
          if (exists) {
            console.log('Message already in local state');
            return current;
          }
          console.log('Adding message to local state');
          return [...current, realtimeMessage];
        });

        // Broadcast to other users
        const broadcastResult = await channel.send({
          type: 'broadcast',
          event: EVENT_MESSAGE_TYPE,
          payload: realtimeMessage,
        });

        console.log('Broadcast result:', broadcastResult);

      } catch (error) {
        console.error('Error in sendMessage:', error);
      }
    },
    [channel, isConnected, user, conversationId]
  );

  return { 
    messages, 
    sendMessage, 
    isConnected, 
    loadMessages,
    setMessages 
  };
}