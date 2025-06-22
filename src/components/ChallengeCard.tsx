
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ChallengeWithUser } from '../lib/supabaseClient';

interface ChallengeCardProps {
  challenge: ChallengeWithUser;
  isSolved?: boolean;
  isCompact?: boolean;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ 
  challenge, 
  isSolved = false,
  isCompact = false 
}) => {
  const navigate = useNavigate();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
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

  const handleClick = () => {
    navigate(`/challenges/${challenge.id}`);
  };

  if (isCompact) {
    return (
      <div 
        onClick={handleClick}
        className="bg-gray-800 rounded-lg border border-gray-700 p-3 hover:border-gray-600 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-white line-clamp-1">{challenge.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
            {challenge.difficulty}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{challenge.category}</span>
          <span className="flex items-center">
            {isSolved ? (
              <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
            ) : (
              <XCircle className="w-3 h-3 text-gray-500 mr-1" />
            )}
            {challenge.points} pts
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
        <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
          {challenge.difficulty}
        </span>
      </div>
      
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{challenge.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {challenge.tags && challenge.tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-700 text-purple-400 text-xs rounded-md"
          >
            {tag}
          </span>
        ))}
        {challenge.tags && challenge.tags.length > 3 && (
          <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-md">
            +{challenge.tags.length - 3} more
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Award className="w-4 h-4" />
            <span>{challenge.points} points</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{challenge.time_limit_ms / 1000}s</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {isSolved ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-gray-500" />
          )}
          <span className="capitalize">{challenge.category}</span>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;