import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Award, Clock, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface DailyChallengeWidgetProps {
  onChallengeSelect?: (challengeId: string) => void;
}

const DailyChallengeWidget: React.FC<DailyChallengeWidgetProps> = ({ onChallengeSelect }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dailyChallenge, setDailyChallenge] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSolved, setIsSolved] = useState(false);

  useEffect(() => {
    const fetchDailyChallenge = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get today's date in ISO format (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];

        // Fetch daily challenge for today
        const { data: dailyData, error: dailyError } = await supabase
          .from('daily_challenges')
          .select(`
            id,
            date,
            challenges (
              id,
              title,
              description,
              difficulty,
              category,
              points,
              time_limit_ms
            )
          `)
          .eq('date', today)
          .single();

        if (dailyError) {
          // If no daily challenge for today, fetch the most recent one
          const { data: recentData, error: recentError } = await supabase
            .from('daily_challenges')
            .select(`
              id,
              date,
              challenges (
                id,
                title,
                description,
                difficulty,
                category,
                points,
                time_limit_ms
              )
            `)
            .order('date', { ascending: false })
            .limit(1)
            .single();

          if (recentError) {
            // If no daily challenges at all, fetch a random challenge
            const { data: randomData, error: randomError } = await supabase
              .from('challenges')
              .select(`
                id,
                title,
                description,
                difficulty,
                category,
                points,
                time_limit_ms
              `)
              .limit(1)
              .single();

            if (randomError) {
              throw new Error('No challenges available');
            }

            setDailyChallenge({
              ...randomData,
              is_random: true,
              date: today
            });
          } else {
            setDailyChallenge({
              ...recentData.challenges,
              date: recentData.date,
              is_recent: true
            });
          }
        } else {
          setDailyChallenge({
            ...dailyData.challenges,
            date: dailyData.date
          });
        }

        // Check if user has solved this challenge
        if (user && dailyChallenge?.id) {
          const { data: statData } = await supabase
            .from('user_challenge_stats')
            .select('solved')
            .eq('user_id', user.id)
            .eq('challenge_id', dailyChallenge.id)
            .single();

          setIsSolved(statData?.solved || false);
        }
      } catch (err: any) {
        console.error('Error fetching daily challenge:', err);
        setError(err.message || 'Failed to load daily challenge');
      } finally {
        setLoading(false);
      }
    };

    fetchDailyChallenge();
  }, [user]);

  const handleChallengeClick = () => {
    if (!dailyChallenge) return;
    
    if (onChallengeSelect) {
      onChallengeSelect(dailyChallenge.id);
    } else {
      navigate(`/challenges/${dailyChallenge.id}`);
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
          <span className="text-gray-300">Loading daily challenge...</span>
        </div>
      </div>
    );
  }

  if (error || !dailyChallenge) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div className="text-center py-6">
          <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-300 mb-2">No daily challenge available</p>
          <p className="text-gray-400 text-sm">Check back later for new challenges</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-medium text-white">Daily Challenge</h3>
        </div>
        <span className="text-xs text-gray-400">{formatDate(dailyChallenge.date)}</span>
      </div>
      
      <div className="p-4">
        <div 
          className="hover:bg-gray-700 p-3 rounded-lg transition-colors cursor-pointer"
          onClick={handleChallengeClick}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-semibold text-white">{dailyChallenge.title}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(dailyChallenge.difficulty)}`}>
              {dailyChallenge.difficulty}
            </span>
          </div>
          
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{dailyChallenge.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center space-x-1 text-yellow-500">
                <Award className="w-4 h-4" />
                <span>{dailyChallenge.points} points</span>
              </span>
              <span className="flex items-center space-x-1 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{dailyChallenge.time_limit_ms / 1000}s</span>
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
                    Not completed
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-end">
          <button
            onClick={handleChallengeClick}
            className="flex items-center text-purple-400 hover:text-purple-300 text-sm"
          >
            Solve Challenge
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyChallengeWidget;