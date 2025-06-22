import { useState, useEffect } from 'react';
import { supabase, ChallengeWithUser } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useChallenges = (category?: string, difficulty?: string, searchQuery?: string) => {
  const [challenges, setChallenges] = useState<ChallengeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('challenges')
          .select(`
            *,
            profiles:created_by (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        // Apply filters if provided
        if (category) {
          query = query.eq('category', category);
        }

        if (difficulty) {
          query = query.eq('difficulty', difficulty);
        }

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        // If user is logged in, fetch their stats for these challenges
        if (user && data) {
          const challengeIds = data.map(challenge => challenge.id);
          
          const { data: statsData } = await supabase
            .from('user_challenge_stats')
            .select('*')
            .eq('user_id', user.id)
            .in('challenge_id', challengeIds);

          // Merge stats with challenges
          const challengesWithStats = data.map(challenge => {
            const stats = statsData?.find(stat => stat.challenge_id === challenge.id);
            return {
              ...challenge,
              user_stats: stats || null
            };
          });

          setChallenges(challengesWithStats as ChallengeWithUser[]);
        } else {
          setChallenges(data as ChallengeWithUser[] || []);
        }
      } catch (err: any) {
        console.error('Error fetching challenges:', err);
        setError(err.message || 'Failed to load challenges');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [user, category, difficulty, searchQuery]);

  return { challenges, loading, error };
};

export const useChallenge = (challengeId: string) => {
  const [challenge, setChallenge] = useState<ChallengeWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!challengeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch challenge with creator profile
        const { data: challengeData, error: challengeError } = await supabase
          .from('challenges')
          .select(`
            *,
            profiles:created_by (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('id', challengeId)
          .maybeSingle(); // Changed from .single() to .maybeSingle()

        if (challengeError) {
          // This error would now only be for actual database errors (e.g., network, permissions, multiple rows returned unexpectedly)
          throw challengeError;
        }

        if (!challengeData) {
          // If no challenge is found, set challenge to null and stop loading.
          setChallenge(null);
          setError('Challenge not found'); // Set a specific error message
          setLoading(false);
          return; // Exit the function early
        }

        // Fetch test cases
        const { data: testCasesData, error: testCasesError } = await supabase
          .from('test_cases')
          .select('*')
          .eq('challenge_id', challengeId)
          .eq('is_sample', true)
          .order('order_index', { ascending: true });

        if (testCasesError) {
          throw testCasesError;
        }

        // Fetch user stats if logged in
        let userStats = null;
        if (user) {
          const { data: statsData, error: statsError } = await supabase
            .from('user_challenge_stats')
            .select('*')
            .eq('challenge_id', challengeId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!statsError && statsData) {
            userStats = statsData;
          }
        }

        // Combine all data
        const fullChallenge: ChallengeWithUser = {
          ...challengeData,
          test_cases: testCasesData || [],
          user_stats: userStats
        };

        setChallenge(fullChallenge);
      } catch (err: any) {
        console.error('Error fetching challenge:', err);
        setError(err.message || 'Failed to load challenge');
        setChallenge(null); // Ensure challenge is null on error
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [challengeId, user]);

  return { challenge, loading, error };
};

export const useSubmissions = (challengeId?: string, userId?: string) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('submissions')
          .select(`
            *,
            profiles:user_id (
              id,
              username,
              display_name,
              avatar_url
            ),
            challenges:challenge_id (
              id,
              title,
              difficulty
            )
          `)
          .order('created_at', { ascending: false });

        if (challengeId && challengeId !== 'create') {
          query = query.eq('challenge_id', challengeId);
        }

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        setSubmissions(data || []);
      } catch (err: any) {
        console.error('Error fetching submissions:', err);
        setError(err.message || 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [challengeId, userId]);

  return { submissions, loading, error };
};