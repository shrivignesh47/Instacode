
import { useState, useEffect } from 'react';
import { supabase, ForumWithMembership } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useForums = () => {
  const [forums, setForums] = useState<ForumWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchForums = async () => {
    try {
      setLoading(true);
      
      // Fetch forums with membership status
      const { data: forumsData, error: forumsError } = await supabase
        .from('forums')
        .select('*')
        .order('members_count', { ascending: false });

      if (forumsError) throw forumsError;

      if (user) {
        // Get user's forum memberships
        const { data: memberships } = await supabase
          .from('forum_members')
          .select('forum_id')
          .eq('user_id', user.id);

        const memberForumIds = new Set(memberships?.map(m => m.forum_id) || []);

        const forumsWithMembership = forumsData?.map(forum => ({
          ...forum,
          is_member: memberForumIds.has(forum.id)
        })) || [];

        setForums(forumsWithMembership);
      } else {
        setForums(forumsData || []);
      }
    } catch (err) {
      console.error('Error fetching forums:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch forums');
    } finally {
      setLoading(false);
    }
  };

  const joinForum = async (forumId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('forum_members')
        .insert({
          forum_id: forumId,
          user_id: user.id
        });

      if (error) throw error;

      // Update local state
      setForums(prev => prev.map(forum => 
        forum.id === forumId 
          ? { ...forum, is_member: true, members_count: forum.members_count + 1 }
          : forum
      ));

      // Update forum member count
      const currentForum = forums.find(f => f.id === forumId);
      if (currentForum) {
        await supabase
          .from('forums')
          .update({ members_count: currentForum.members_count + 1 })
          .eq('id', forumId);
      }

    } catch (err) {
      console.error('Error joining forum:', err);
      throw err;
    }
  };

  const leaveForum = async (forumId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('forum_members')
        .delete()
        .eq('forum_id', forumId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setForums(prev => prev.map(forum => 
        forum.id === forumId 
          ? { ...forum, is_member: false, members_count: Math.max(0, forum.members_count - 1) }
          : forum
      ));

      // Update forum member count
      const currentForum = forums.find(f => f.id === forumId);
      if (currentForum) {
        await supabase
          .from('forums')
          .update({ members_count: Math.max(0, currentForum.members_count - 1) })
          .eq('id', forumId);
      }

    } catch (err) {
      console.error('Error leaving forum:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchForums();
  }, [user]);

  return {
    forums,
    loading,
    error,
    joinForum,
    leaveForum,
    refetch: fetchForums
  };
};