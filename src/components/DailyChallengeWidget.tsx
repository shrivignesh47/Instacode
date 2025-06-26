import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Award, Clock, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface DailyProblemWidgetProps {
  onProblemSelect?: (problemId: string) => void;
}

const DailyProblemWidget: React.FC<DailyProblemWidgetProps> = ({ onProblemSelect }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dailyProblem, setDailyProblem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSolved, setIsSolved] = useState(false);

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
            problems (
              id,
              title,
              slug,
              description,
              difficulty,
              category,
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
          // If no daily problem for today, fetch a random problem
          const { data: problemsData, error: problemsError } = await supabase
            .from('problems')
            .select(`
              id,
              title,
              slug,
              description,
              difficulty,
              category,
              time_limit_ms,
              created_by,
              profiles:created_by (
                username,
                display_name,
                avatar_url
              )
            `)
            .order('created_at', { ascending: false })
            .limit(20);

          if (problemsError) {
            throw new Error('Failed to fetch problems');
          }

          if (problemsData && problemsData.length > 0) {
            // Select a random problem from the results
            const randomIndex = Math.floor(Math.random() * problemsData.length);
            const randomProblem = problemsData[randomIndex];

            // Create a new daily problem entry
            const { data: newDailyProblem, error: createError } = await supabase
              .from('daily_problems')
              .insert({
                problem_id: randomProblem.id,
                date: today
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating daily problem:', createError);
              // Still use the random problem even if we couldn't save it
              setDailyProblem({
                problems: randomProblem,
                date: today
              });
            } else {
              // Set the daily problem with the newly created entry
              setDailyProblem({
                ...newDailyProblem,
                problems: randomProblem
              });
            }
          } else {
            throw new Error('No problems available');
          }
        } else {
          setDailyProblem(dailyData);
        }

        // Check if user has solved this problem
        if (user && dailyProblem?.problems?.id) {
          const { data: statData } = await supabase
            .from('user_problem_stats')
            .select('solved')
            .eq('user_id', user.id)
            .eq('problem_id', dailyProblem.problems.id)
            .single();

          setIsSolved(statData?.solved || false);
        }
      } catch (err: any) {
        console.error('Error fetching daily problem:', err);
        setError(err.message || 'Failed to load daily problem');
      } finally {
        setLoading(false);
      }
    };

    fetchDailyProblem();
  }, [user]);

  const handleProblemClick = () => {
    if (!dailyProblem?.problems) return;
    
    if (onProblemSelect) {
      onProblemSelect(dailyProblem.problems.id);
    } else {
      navigate(`/problems/${dailyProblem.problems.slug}`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'text-green-500 bg-green-900 bg-opacity-30';
      case 'medium':
        return 'text-yellow-500 bg-yellow-900 bg-opacity-30';
      case 'hard':
        return 'text-red-500 bg-red-900 bg-opacity-30';
      default:
        return 'text-gray-500 bg-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin mr-2" />
          <span className="text-gray-300">Loading daily problem...</span>
        </div>
      </div>
    );
  }

  if (error || !dailyProblem) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="text-center py-6">
          <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-300 mb-2">No daily problem available</p>
          <p className="text-gray-400 text-sm">Check back later for new problems</p>
        </div>
      </div>
    );
  }

  const problem = dailyProblem.problems;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-medium text-white">Daily Problem</h3>
        </div>
        <span className="text-xs text-gray-400">{formatDate(dailyProblem.date)}</span>
      </div>
      
      <div className="p-4">
        <div 
          className="hover:bg-gray-700 p-3 rounded-lg transition-colors cursor-pointer"
          onClick={handleProblemClick}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-semibold text-white">{problem.title}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
          </div>
          
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{problem.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center space-x-1 text-yellow-500">
                <Award className="w-4 h-4" />
                <span>120 points</span>
              </span>
              <span className="flex items-center space-x-1 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{problem.time_limit_ms / 1000}s</span>
              </span>
            </div>
            
            {user && (
              <div>
                {isSolved ? (
                  <span className="flex items-center text-green-500 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completed
                  </span>
                ) : (
                  <span className="flex items-center text-gray-400 text-sm">
                    <XCircle className="w-4 h-4 mr-1" />
                 
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-end">
          <button
            onClick={handleProblemClick}
            className="flex items-center text-purple-400 hover:text-purple-300 text-sm"
          >
            Solve Problem
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyProblemWidget;
