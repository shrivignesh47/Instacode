
import { useState, useEffect } from 'react';
import { supabase, ForumTopicWithUser } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useForumTopics = (forumId?: string) => {
  const [topics, setTopics] = useState<ForumTopicWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTopics = async () => {
    try {
      setLoading(true);
      console.log('Fetching topics for forumId:', forumId);
      
      let query = supabase
        .from('forum_topics')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .order('is_pinned', { ascending: false })
        .order('last_activity', { ascending: false });

      if (forumId) {
        query = query.eq('forum_id', forumId);
      }

      const { data, error: topicsError } = await query;

      if (topicsError) {
        console.error('Topics query error:', topicsError);
        throw topicsError;
      }

      console.log('Fetched topics:', data);
      setTopics(data || []);
    } catch (err) {
      console.error('Error fetching forum topics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch topics');
    } finally {
      setLoading(false);
    }
  };

  const createTopic = async (topicData: {
    forum_id: string;
    title: string;
    content: string;
    tags?: string[];
  }) => {
    if (!user) {
      console.error('No user found for topic creation');
      throw new Error('User not authenticated');
    }

    console.log('Creating topic with data:', topicData);
    console.log('Current user:', user);

    try {
      const { data, error } = await supabase
        .from('forum_topics')
        .insert({
          ...topicData,
          user_id: user.id,
          last_activity: new Date().toISOString()
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
        console.error('Topic creation error:', error);
        throw error;
      }

      console.log('Topic created successfully:', data);

      // Update forum topic count
      await supabase.rpc('increment_forum_topics', { forum_id: topicData.forum_id });

      // Add to local state
      setTopics(prev => [data, ...prev]);

      return data;
    } catch (err) {
      console.error('Error creating topic:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [forumId, user]);

  return {
    topics,
    loading,
    error,
    createTopic,
    refetch: fetchTopics
  };
};