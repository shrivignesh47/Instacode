import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ProblemWithUser } from '../lib/supabaseClient';
import { getDifficultyColor } from '../utils/problemUtils';

interface ProblemCardProps {
  problem: ProblemWithUser;
  isSolved?: boolean;
  isCompact?: boolean;
}

const ProblemCard: React.FC<ProblemCardProps> = ({ 
  problem, 
  isSolved = false,
  isCompact = false 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/problems/${problem.slug}`);
  };

  if (isCompact) {
    return (
      <div 
        onClick={handleClick}
        className="bg-gray-800 rounded-lg border border-gray-700 p-3 hover:border-gray-600 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-white line-clamp-1">{problem.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{problem.category}</span>
          <span className="flex items-center">
            {isSolved ? (
              <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
            ) : (
              <XCircle className="w-3 h-3 text-gray-500 mr-1" />
            )}
            {problem.points} pts
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick}
      className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">{problem.title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
          {problem.difficulty}
        </span>
      </div>
      
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{problem.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {problem.tags && problem.tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-700 text-purple-400 text-xs rounded-md"
          >
            {tag}
          </span>
        ))}
        {problem.tags && problem.tags.length > 3 && (
          <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-md">
            +{problem.tags.length - 3} more
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Award className="w-4 h-4" />
            <span>{problem.points} points</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{problem.time_limit_ms / 1000}s</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {problem.user_stats?.solved ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-gray-500" />
          )}
          <span className="capitalize">{problem.category}</span>
        </div>
      </div>
    </div>
  );
};

export default ProblemCard;