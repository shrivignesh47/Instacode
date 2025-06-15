
import { useState, useEffect } from 'react';
import { supabase, ForumReplyWithUser } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useForumReplies = (topicId?: string) => {
  const [replies, setReplies] = useState<ForumReplyWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReplies = async () => {
    if (!topicId) return;
    
    try {
      setLoading(true);
      console.log('Fetching replies for topicId:', topicId);
      
      const { data, error: repliesError } = await supabase
        .from('forum_replies')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });

      if (repliesError) {
        console.error('Replies query error:', repliesError);
        throw repliesError;
      }

      console.log('Fetched replies:', data);
      setReplies(data || []);
    } catch (err) {
      console.error('Error fetching forum replies:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch replies');
    } finally {
      setLoading(false);
    }
  };

  const createReply = async (content: string) => {
    if (!user || !topicId) {
      throw new Error('User not authenticated or no topic ID');
    }

    console.log('Creating reply with content:', content);
    console.log('Current user:', user);

    try {
      const { data, error } = await supabase
        .from('forum_replies')
        .insert({
          topic_id: topicId,
          user_id: user.id,
          content: content.trim()
        })
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Reply creation error:', error);
        throw error;
      }

      console.log('Reply created successfully:', data);

      // Update topic reply count
      await supabase.rpc('increment_topic_replies', { topic_id: topicId });

      // Add to local state
      setReplies(prev => [...prev, data]);

      return data;
    } catch (err) {
      console.error('Error creating reply:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [topicId, user]);

  return {
    replies,
    loading,
    error,
    createReply,
    refetch: fetchReplies
  };
};