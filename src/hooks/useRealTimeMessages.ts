
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface UseRealTimeMessagesProps {
  onNewMessage: (message: any) => void;
  onMessageUpdate: (message: any) => void;
  onConversationUpdate: () => void;
}

export const useRealTimeMessages = ({
  onNewMessage,
  onMessageUpdate,
  onConversationUpdate
}: UseRealTimeMessagesProps) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for user:', user.id);

    // Subscribe to all messages for this user
    const messagesChannel = supabase
      .channel(`user_messages_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('Real-time: New message received', payload);
          onNewMessage(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('Real-time: Message updated', payload);
          onMessageUpdate(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('Messages channel subscription status:', status);
      });

    // Subscribe to conversation updates
    const conversationsChannel = supabase
      .channel(`user_conversations_${user.id}`)
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
          onConversationUpdate();
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
  }, [user, onNewMessage, onMessageUpdate, onConversationUpdate]);
};