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
  shared_post?: any;
  file_url?: string;
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
          file_url,
          created_at,
          profiles:profiles!messages_sender_id_fkey(username, avatar_url),
          posts:posts!messages_shared_post_id_fkey(
            id,
            type,
            content,
            code_language,
            code_content,
            project_title,
            project_description,
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

      console.log('Raw messages data:', data);

      if (!data) {
        console.log('No messages found for conversation');
        setMessages([]);
        return;
      }

      const formattedMessages: RealtimeChatMessage[] = data.map(msg => {
        // Handle both array and object responses from Supabase
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
          shared_post: sharedPost,
          file_url: msg.file_url,
          is_read: false,
          created_at: msg.created_at,
          sender: {
            username: senderProfile?.username || 'Unknown',
            avatar_url: senderProfile?.avatar_url || ''
          }
        };
      });

      console.log('Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
      await markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [conversationId]);

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

  const addMessage = useCallback((message: RealtimeChatMessage) => {
    setMessages(prev => {
      const exists = prev.find(msg => msg.id === message.id);
      if (exists) {
        console.log('Message already exists, not adding duplicate');
        return prev;
      }
      console.log('Adding new message to UI');
      return [...prev, message];
    });
  }, []);

  const updateMessage = useCallback((updatedMessage: any) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === updatedMessage.id 
          ? { ...msg, ...updatedMessage }
          : msg
      )
    );
  }, []);

  return { 
    messages, 
    sendMessage: async (content: string) => {
      if (!channel || !isConnected || !user || !conversationId) {
        console.warn('Cannot send message - missing requirements');
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
    isConnected, 
    loadMessages,
    setMessages 
  };
}