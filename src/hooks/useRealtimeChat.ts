
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

  useEffect(() => {
    if (!conversationId || !user) return;

    const channelName = `chat_${conversationId}`;
    const newChannel = supabase.channel(channelName);

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        const newMessage = payload.payload as RealtimeChatMessage;
        setMessages((current) => {
          // Check if message already exists to prevent duplicates
          const exists = current.find(msg => msg.id === newMessage.id);
          if (exists) return current;
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
      if (!channel || !isConnected || !user || !conversationId) return;

      try {
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
          console.error('Error sending message:', error);
          return;
        }

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
          if (exists) return current;
          return [...current, realtimeMessage];
        });

        // Broadcast to other users
        await channel.send({
          type: 'broadcast',
          event: EVENT_MESSAGE_TYPE,
          payload: realtimeMessage,
        });

      } catch (error) {
        console.error('Error in sendMessage:', error);
      }
    },
    [channel, isConnected, user, conversationId]
  );

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

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
          created_at,
          profiles:profiles!messages_sender_id_fkey(username, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const formattedMessages: RealtimeChatMessage[] = data.map(msg => {
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
            username: senderProfile?.username || 'Unknown',
            avatar_url: senderProfile?.avatar_url || ''
          }
        };
      });

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [conversationId]);

  return { 
    messages, 
    sendMessage, 
    isConnected, 
    loadMessages,
    setMessages 
  };
}