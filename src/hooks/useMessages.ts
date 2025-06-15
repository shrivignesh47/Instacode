
import { useState, useCallback } from 'react';
import { supabase, type PostWithUser } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface Message {
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

export const useMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

  const loadMessages = useCallback(async (conversationId: string) => {
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
  }, []);

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

  const addMessage = useCallback((message: Message) => {
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
    setMessages,
    loadMessages,
    addMessage,
    updateMessage,
    markMessagesAsRead
  };
};