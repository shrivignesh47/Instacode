import { useState, useEffect, useCallback } from 'react';
import { supabase, type CodingChallengeWithUser, type CodingChallengeWithProblems, type CodingChallengeLeaderboardWithUser } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useCodingChallenges = (category?: string, isActive?: boolean, searchQuery?: string) => {
  const [challenges, setChallenges] = useState<CodingChallengeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('coding_challenges')
        .select(`
          *,
          profiles:created_by (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters if provided
      if (category) {
        query = query.eq('category', category);
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Get problem counts for each challenge
      const challengesWithCounts = await Promise.all((data || []).map(async (challenge) => {
        // Get problem count
        const { count: problemsCount, error: problemsError } = await supabase
          .from('coding_challenge_problems')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id);

        // Get participants count
        const { count: participantsCount, error: participantsError } = await supabase
          .from('coding_challenge_leaderboards')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id);

        return {
          ...challenge,
          problems_count: problemsCount || 0,
          participants_count: participantsCount || 0
        };
      }));

      setChallenges(challengesWithCounts as CodingChallengeWithUser[]);
    } catch (err: any) {
      console.error('Error fetching coding challenges:', err);
      setError(err.message || 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, [category, isActive, searchQuery]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return { challenges, loading, error, refetch: fetchChallenges };
};

export const useCodingChallenge = (challengeId: string | undefined) => {
  const [challenge, setChallenge] = useState<CodingChallengeWithProblems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          .from('coding_challenges')
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
          .single();

        if (challengeError) {
          throw challengeError;
        }

        // Fetch problems in this challenge
        const { data: challengeProblemsData, error: problemsError } = await supabase
          .from('coding_challenge_problems')
          .select(`
            *,
            problems:problem_id (
              *,
              profiles:created_by (
                id,
                username,
                display_name,
                avatar_url
              )
            )
          `)
          .eq('challenge_id', challengeId)
          .order('order_index', { ascending: true });

        if (problemsError) {
          throw problemsError;
        }

        // Format problems with order_index and points_multiplier
        const problems = challengeProblemsData.map(item => ({
          ...item.problems,
          order_index: item.order_index,
          points_multiplier: item.points_multiplier
        }));

        // Combine all data
        const fullChallenge: CodingChallengeWithProblems = {
          ...challengeData,
          problems
        };

        setChallenge(fullChallenge);
      } catch (err: any) {
        console.error('Error fetching coding challenge:', err);
        setError(err.message || 'Failed to load challenge');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [challengeId]);

  return { challenge, loading, error };
};

export const useChallengeLeaderboard = (challengeId: string | undefined) => {
  const [leaderboard, setLeaderboard] = useState<CodingChallengeLeaderboardWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!challengeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: leaderboardError } = await supabase
          .from('coding_challenge_leaderboards')
          .select(`
            *,
            profiles:user_id (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('challenge_id', challengeId)
          .order('rank', { ascending: true });

        if (leaderboardError) {
          throw leaderboardError;
        }

        setLeaderboard(data as CodingChallengeLeaderboardWithUser[] || []);

        // Find user's rank if they're logged in
        if (user) {
          const userEntry = data?.find(entry => entry.user_id === user.id);
          if (userEntry) {
            setUserRank(userEntry.rank);
          }
        }
      } catch (err: any) {
        console.error('Error fetching challenge leaderboard:', err);
        setError(err.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [challengeId, user]);

  return { leaderboard, loading, error, userRank };
};

export const useGlobalLeaderboard = (timeFrame: 'all_time' | 'monthly' | 'weekly' = 'all_time', limit: number = 100) => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchGlobalLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get date range based on time frame
        let startDate: string | null = null;
        if (timeFrame === 'weekly') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          startDate = weekAgo.toISOString();
        } else if (timeFrame === 'monthly') {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          startDate = monthAgo.toISOString();
        }

        // Fetch user stats aggregated by user
        let query = supabase.rpc('get_global_leaderboard', {
          time_frame: timeFrame,
          limit_count: limit
        });

        const { data, error: leaderboardError } = await query;

        if (leaderboardError) {
          // If RPC function doesn't exist, use a fallback query
          // This is a simplified version - in a real app, you'd implement the RPC function
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('user_problem_stats')
            .select(`
              user_id,
              profiles:user_id (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('solved', true)
            .order('points_earned', { ascending: false })
            .limit(limit);

          if (fallbackError) {
            throw fallbackError;
          }

          // Process the data to aggregate by user
          const userMap = new Map();
          fallbackData?.forEach(stat => {
            if (!userMap.has(stat.user_id)) {
              userMap.set(stat.user_id, {
                user_id: stat.user_id,
                profiles: stat.profiles,
                total_points: 0,
                problems_solved: 0,
                rank: 0
              });
            }
            const user = userMap.get(stat.user_id);
            user.total_points += stat.points_earned || 0;
            user.problems_solved += 1;
          });

          // Convert map to array and sort
          const processedData = Array.from(userMap.values())
            .sort((a, b) => b.total_points - a.total_points)
            .map((user, index) => ({ ...user, rank: index + 1 }));

          setLeaderboard(processedData);

          // Find user's rank if they're logged in
          if (user) {
            const userEntry = processedData.find(entry => entry.user_id === user.id);
            if (userEntry) {
              setUserRank(userEntry.rank);
            }
          }
        } else {
          setLeaderboard(data || []);

          // Find user's rank if they're logged in
          if (user) {
            const userEntry = data?.find((entry: any) => entry.user_id === user.id);
            if (userEntry) {
              setUserRank(userEntry.rank);
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching global leaderboard:', err);
        setError(err.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalLeaderboard();
  }, [timeFrame, limit, user]);

  return { leaderboard, loading, error, userRank };
};

export const useProblemImports = () => {
  const [imports, setImports] = useState<ProblemImportWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchImports = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: importsError } = await supabase
        .from('problem_imports')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (importsError) {
        throw importsError;
      }

      setImports(data as ProblemImportWithUser[] || []);
    } catch (err: any) {
      console.error('Error fetching problem imports:', err);
      setError(err.message || 'Failed to load imports');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchImports();
  }, [fetchImports]);

  return { imports, loading, error, refetch: fetchImports };
};