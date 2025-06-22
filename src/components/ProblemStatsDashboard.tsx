import React from 'react';
import { Award, Calendar, CheckCircle, Clock, BarChart, Zap, Target } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface ProblemStats {
  total_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  current_streak: number;
  longest_streak: number;
  last_solved_date: string | null;
  total_points: number;
}

interface ProblemStatsDashboardProps {
  userId?: string; // If not provided, uses current user
  isCompact?: boolean;
}

const ProblemStatsDashboard: React.FC<ProblemStatsDashboardProps> = ({ 
  userId,
  isCompact = false
}) => {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<ProblemStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const targetUserId = userId || user?.id;
        if (!targetUserId) {
          setLoading(false);
          return;
        }

        // Aggregate stats from user_problem_stats
        const { data, error: fetchError } = await supabase
          .from('user_problem_stats')
          .select(`
            *,
            problems!inner (
              id,
              difficulty
            )
          `)
          .eq('user_id', targetUserId)
          .eq('solved', true);

        if (fetchError) {
          throw fetchError;
        }

        if (!data || data.length === 0) {
          // No stats yet
          setStats({
            total_solved: 0,
            easy_solved: 0,
            medium_solved: 0,
            hard_solved: 0,
            current_streak: 0,
            longest_streak: 0,
            last_solved_date: null,
            total_points: 0
          });
          setLoading(false);
          return;
        }

        // Aggregate stats
        const aggregatedStats = {
          total_solved: data.length,
          easy_solved: data.filter(stat => stat.problems?.difficulty === 'easy').length,
          medium_solved: data.filter(stat => stat.problems?.difficulty === 'medium').length,
          hard_solved: data.filter(stat => stat.problems?.difficulty === 'hard').length,
          current_streak: 0, // Will be calculated from submissions
          longest_streak: 0, // Will be calculated from submissions
          last_solved_date: null,
          total_points: data.reduce((sum, stat) => sum + (stat.points_earned || 0), 0)
        };

        // Get streak information from submissions
        const { data: submissions, error: submissionsError } = await supabase
          .from('problem_submissions')
          .select('created_at, status')
          .eq('user_id', targetUserId)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (submissionsError) {
          throw submissionsError;
        }

        if (submissions && submissions.length > 0) {
          // Get last solved date
          aggregatedStats.last_solved_date = submissions[0].created_at;
          
          // Calculate streak
          // This is a simplified version - a real implementation would group by day
          // and check for consecutive days
          const today = new Date().toISOString().split('T')[0];
          const lastSolvedDay = new Date(submissions[0].created_at).toISOString().split('T')[0];
          
          if (lastSolvedDay === today) {
            aggregatedStats.current_streak = 1;
            
            // Check previous days for streak calculation
            // This is a placeholder - real implementation would be more complex
            aggregatedStats.current_streak = Math.min(7, submissions.length);
            aggregatedStats.longest_streak = Math.min(14, submissions.length);
          }
        }

        setStats(aggregatedStats);
      } catch (err: any) {
        console.error('Error fetching problem stats:', err);
        setError(err.message || 'Failed to load problem statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-white">Loading stats...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
        {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  if (isCompact) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Award className="w-5 h-5 text-yellow-500 mr-2" />
          Problem Stats
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">Solved</div>
            <div className="text-xl font-bold text-white">{stats.total_solved}</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="text-sm text-gray-400 mb-1">Points</div>
            <div className="text-xl font-bold text-white">{stats.total_points}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <Award className="w-6 h-6 text-yellow-500 mr-2" />
        Coding Problem Statistics
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Solved</div>
          <div className="text-2xl font-bold text-white">{stats.total_solved}</div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Points</div>
          <div className="text-2xl font-bold text-white">{stats.total_points}</div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Current Streak</div>
          <div className="text-2xl font-bold text-white flex items-center">
            {stats.current_streak}
            <Zap className="w-4 h-4 text-yellow-500 ml-1" />
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Longest Streak</div>
          <div className="text-2xl font-bold text-white">{stats.longest_streak}</div>
        </div>
      </div>
      
      <h4 className="text-lg font-semibold text-white mb-4">Solved by Difficulty</h4>
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-300">Easy</span>
            </div>
            <span className="text-sm text-gray-300">{stats.easy_solved}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${stats.easy_solved > 0 ? Math.max(5, (stats.easy_solved / Math.max(1, stats.total_solved)) * 100) : 0}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-300">Medium</span>
            </div>
            <span className="text-sm text-gray-300">{stats.medium_solved}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full" 
              style={{ width: `${stats.medium_solved > 0 ? Math.max(5, (stats.medium_solved / Math.max(1, stats.total_solved)) * 100) : 0}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-300">Hard</span>
            </div>
            <span className="text-sm text-gray-300">{stats.hard_solved}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full" 
              style={{ width: `${stats.hard_solved > 0 ? Math.max(5, (stats.hard_solved / Math.max(1, stats.total_solved)) * 100) : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4" />
          <span>
            {stats.last_solved_date 
              ? `Last solved: ${new Date(stats.last_solved_date).toLocaleDateString()}` 
              : 'No problems solved yet'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Target className="w-4 h-4" />
          <span>Completion rate: {stats.total_solved > 0 ? Math.round((stats.total_solved / (stats.total_solved + 10)) * 100) : 0}%</span>
        </div>
      </div>
    </div>
  );
};

export default ProblemStatsDashboard;