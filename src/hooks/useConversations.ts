import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface Conversation {
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

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Loading conversations for user:', user.id);
      
      // Enhanced query to get all conversations with better error handling
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_1,
          participant_2,
          last_message_at,
          last_message_id,
          created_at,
          updated_at,
          profiles!conversations_participant_1_fkey(id, username, avatar_url, bio),
          profiles_participant_2:profiles!conversations_participant_2_fkey(id, username, avatar_url, bio)
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error loading conversations:', error);
        setLoading(false);
        return;
      }

      console.log('Raw conversations data:', data);

      if (!data || data.length === 0) {
        console.log('No conversations found');
        setConversations([]);
        setLoading(false);
        return;
      }

      const formattedConversations: Conversation[] = [];

      for (const conv of data) {
        // Determine which profile is the other user
        const otherUser = conv.participant_1 === user.id 
          ? conv.profiles_participant_2 
          : conv.profiles;
        
        // Handle both array and object responses from Supabase
        const otherUserObj = Array.isArray(otherUser) ? otherUser[0] : otherUser;
        
        if (!otherUserObj) {
          console.warn('Missing other user profile for conversation:', conv.id);
          continue;
        }

        // Get last message if exists
        let lastMessage = undefined;
        if (conv.last_message_id) {
          try {
            const { data: messageData, error: messageError } = await supabase
              .from('messages')
              .select('content, message_type, sender_id')
              .eq('id', conv.last_message_id)
              .single();
            
            if (messageError) {
              console.warn('Error fetching last message:', messageError);
            } else if (messageData) {
              lastMessage = messageData;
            }
          } catch (msgError) {
            console.warn('Exception fetching last message:', msgError);
          }
        }

        // Use last_message_at if available, otherwise fall back to created_at or current time
        const messageTime = conv.last_message_at || conv.created_at || new Date().toISOString();

        const formattedConversation: Conversation = {
          id: conv.id,
          participant_1: conv.participant_1,
          participant_2: conv.participant_2,
          last_message_at: messageTime,
          other_user: {
            id: otherUserObj.id,
            username: otherUserObj.username,
            avatar_url: otherUserObj.avatar_url || '',
            bio: otherUserObj.bio || ''
          },
          last_message: lastMessage,
          unread_count: 0 // TODO: Implement unread count logic
        };

        formattedConversations.push(formattedConversation);
      }

      console.log('Formatted conversations:', formattedConversations);
      
      // Sort conversations by last_message_at in descending order (most recent first)
      formattedConversations.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Exception in loadConversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Set up real-time subscription for conversation updates
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for conversations');

    const channel = supabase
      .channel('conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_1=eq.${user.id}`
        },
        (payload) => {
          console.log('Conversation change (participant_1):', payload);
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_2=eq.${user.id}`
        },
        (payload) => {
          console.log('Conversation change (participant_2):', payload);
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up conversations subscription');
      supabase.removeChannel(channel);
    };
  }, [user, loadConversations]);

  return { conversations, loading, loadConversations };
};