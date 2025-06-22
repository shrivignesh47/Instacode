import { useState, useEffect, useCallback } from 'react';
import { supabase, type ProblemWithUser, type ProblemImportWithUser, type ProblemSubmissionWithUser, type DailyProblemWithProblem } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useProblems = (category?: string, difficulty?: string, searchQuery?: string) => {
  const [problems, setProblems] = useState<ProblemWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('problems')
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

      // If user is logged in, fetch their stats for these problems
      if (user && data) {
        const problemIds = data.map(problem => problem.id);
        
        const { data: statsData } = await supabase
          .from('user_problem_stats')
          .select('*')
          .eq('user_id', user.id)
          .in('problem_id', problemIds);

        // Merge stats with problems
        const problemsWithStats = data.map(problem => {
          const stats = statsData?.find(stat => stat.problem_id === problem.id);
          return {
            ...problem,
            user_stats: stats || null
          };
        });

        setProblems(problemsWithStats as ProblemWithUser[]);
      } else {
        setProblems(data as ProblemWithUser[] || []);
      }
    } catch (err: any) {
      console.error('Error fetching problems:', err);
      setError(err.message || 'Failed to load problems');
    } finally {
      setLoading(false);
    }
  }, [user, category, difficulty, searchQuery]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  return { problems, loading, error, refetch: fetchProblems };
};

export const useProblem = (problemId: string | undefined) => {
  const [problem, setProblem] = useState<ProblemWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch problem with creator profile
        const { data: problemData, error: problemError } = await supabase
          .from('problems')
          .select(`
            *,
            profiles:created_by (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('id', problemId)
          .maybeSingle();

        if (problemError) {
          throw problemError;
        }

        if (!problemData) {
          setError('Problem not found');
          setProblem(null);
          setLoading(false);
          return;
        }

        // Fetch test cases
        const { data: testCasesData, error: testCasesError } = await supabase
          .from('problem_test_cases')
          .select('*')
          .eq('problem_id', problemId)
          .eq('is_sample', true)
          .order('order_index', { ascending: true });

        if (testCasesError) {
          throw testCasesError;
        }

        // Fetch user stats if logged in
        let userStats = null;
        if (user) {
          const { data: statsData, error: statsError } = await supabase
            .from('user_problem_stats')
            .select('*')
            .eq('problem_id', problemId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!statsError && statsData) {
            userStats = statsData;
          }
        }

        // Combine all data
        const fullProblem: ProblemWithUser = {
          ...problemData,
          test_cases: testCasesData || [],
          user_stats: userStats
        };

        setProblem(fullProblem);
      } catch (err: any) {
        console.error('Error fetching problem:', err);
        setError(err.message || 'Failed to load problem');
        setProblem(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId, user]);

  return { problem, loading, error };
};

export const useProblemBySlug = (slug: string | undefined) => {
  const [problem, setProblem] = useState<ProblemWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProblem = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch problem with creator profile
        const { data: problemData, error: problemError } = await supabase
          .from('problems')
          .select(`
            *,
            profiles:created_by (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('slug', slug)
          .maybeSingle();

        if (problemError) {
          throw problemError;
        }

        if (!problemData) {
          setError('Problem not found');
          setProblem(null);
          setLoading(false);
          return;
        }

        // Fetch test cases
        const { data: testCasesData, error: testCasesError } = await supabase
          .from('problem_test_cases')
          .select('*')
          .eq('problem_id', problemData.id)
          .eq('is_sample', true)
          .order('order_index', { ascending: true });

        if (testCasesError) {
          throw testCasesError;
        }

        // Fetch user stats if logged in
        let userStats = null;
        if (user) {
          const { data: statsData, error: statsError } = await supabase
            .from('user_problem_stats')
            .select('*')
            .eq('problem_id', problemData.id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!statsError && statsData) {
            userStats = statsData;
          }
        }

        // Combine all data
        const fullProblem: ProblemWithUser = {
          ...problemData,
          test_cases: testCasesData || [],
          user_stats: userStats
        };

        setProblem(fullProblem);
      } catch (err: any) {
        console.error('Error fetching problem by slug:', err);
        setError(err.message || 'Failed to load problem');
        setProblem(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [slug, user]);

  return { problem, loading, error };
};

export const useProblemSubmissions = (
  problemId?: string, 
  userId?: string,
  limit: number = 10
) => {
  const [submissions, setSubmissions] = useState<ProblemSubmissionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('problem_submissions')
          .select(`
            *,
            profiles:user_id (
              id,
              username,
              display_name,
              avatar_url
            ),
            problems:problem_id (
              id,
              title,
              difficulty,
              slug
            )
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(limit);

        if (problemId) {
          query = query.eq('problem_id', problemId);
        }

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error: fetchError, count: totalCount } = await query;

        if (fetchError) {
          throw fetchError;
        }

        setSubmissions(data as ProblemSubmissionWithUser[] || []);
        setCount(totalCount || 0);
      } catch (err: any) {
        console.error('Error fetching submissions:', err);
        setError(err.message || 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [problemId, userId, limit]);

  return { submissions, loading, error, count };
};

export const useDailyProblem = () => {
  const [dailyProblem, setDailyProblem] = useState<DailyProblemWithProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDailyProblem = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get today's date in ISO format (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];

        // Fetch daily problem for today
        const { data: dailyData, error: dailyError } = await supabase
          .from('daily_problems')
          .select(`
            id,
            date,
            problems:problem_id (
              id,
              title,
              slug,
              description,
              difficulty,
              category,
              points,
              time_limit_ms,
              created_by,
              profiles:created_by (
                username,
                display_name,
                avatar_url
              )
            )
          `)
          .eq('date', today)
          .single();

        if (dailyError) {
          // If no daily problem for today, fetch the most recent one
          const { data: recentData, error: recentError } = await supabase
            .from('daily_problems')
            .select(`
              id,
              date,
              problems:problem_id (
                id,
                title,
                slug,
                description,
                difficulty,
                category,
                points,
                time_limit_ms,
                created_by,
                profiles:created_by (
                  username,
                  display_name,
                  avatar_url
                )
              )
            `)
            .order('date', { ascending: false })
            .limit(1)
            .single();

          if (recentError) {
            throw new Error('No daily problems available');
          }

          setDailyProblem(recentData as DailyProblemWithProblem);
        } else {
          setDailyProblem(dailyData as DailyProblemWithProblem);
        }
      } catch (err: any) {
        console.error('Error fetching daily problem:', err);
        setError(err.message || 'Failed to load daily problem');
      } finally {
        setLoading(false);
      }
    };

    fetchDailyProblem();
  }, []);

  return { dailyProblem, loading, error };
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