import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Award, Clock, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useDailyProblem } from '../hooks/useProblems';
import { useAuth } from '../contexts/AuthContext';
import { getDifficultyColor } from '../utils/problemUtils';

interface DailyProblemWidgetProps {
  onProblemSelect?: (problemId: string) => void;
}

const DailyProblemWidget: React.FC<DailyProblemWidgetProps> = ({ onProblemSelect }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dailyProblem, loading, error } = useDailyProblem();

  const handleProblemClick = () => {
    if (!dailyProblem?.problems) return;
    
    if (onProblemSelect) {
      onProblemSelect(dailyProblem.problems.id);
    } else {
      navigate(`/problems/${dailyProblem.problems.slug}`);
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
  const isSolved = problem.user_stats?.solved || false;

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
                <span>{problem.points} points</span>
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
                    Not completed
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