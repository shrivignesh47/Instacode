
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useProfile = (username: string | undefined) => {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  useEffect(() => {
    if (user && profile) {
      setIsCurrentUser(user.id === profile.id);
    }
  }, [user, profile]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!username) {
          throw new Error('Username is required');
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (!profileData) {
          throw new Error('Profile not found');
        }

        setProfile(profileData);

        const { data: postsData, error: postsError, count } = await supabase
          .from('posts')
          .select('*, likes(count)', { count: 'exact' })
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: sortOrder === 'oldest' })
          .range((currentPage - 1) * postsPerPage, currentPage * postsPerPage - 1);

        if (postsError) {
          throw postsError;
        }

        setPosts(postsData || []);
        setTotalPosts(count || 0);

        if (user) {
          const { data: followingData, error: followingError } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', user.id)
            .eq('followed_id', profileData.id)
            .single();

          if (followingError) {
            console.error('Error fetching follow status:', followingError);
          } else {
            setIsFollowing(!!followingData);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, user, isFollowing, sortOrder, currentPage]);

  return {
    profile,
    posts,
    loading,
    error,
    isCurrentUser,
    isFollowing,
    totalPosts,
    sortOrder,
    currentPage,
    postsPerPage,
    setProfile,
    setPosts,
    setIsFollowing,
    setSortOrder,
    setCurrentPage,
    setError
  };
};