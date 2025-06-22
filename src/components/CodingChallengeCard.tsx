import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Clock, Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import { CodingChallengeWithUser } from '../lib/supabaseClient';
import { getDifficultyColor } from '../utils/problemUtils';

interface CodingChallengeCardProps {
  challenge: CodingChallengeWithUser;
  isParticipating?: boolean;
  isCompact?: boolean;
}

const CodingChallengeCard: React.FC<CodingChallengeCardProps> = ({ 
  challenge, 
  isParticipating = false,
  isCompact = false 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/challenges/${challenge.id}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isActive = challenge.is_active;
  const hasStarted = challenge.start_date ? new Date(challenge.start_date) <= new Date() : true;
  const hasEnded = challenge.end_date ? new Date(challenge.end_date) < new Date() : false;
  
  const getStatusBadge = () => {
    if (!isActive) return { text: 'Inactive', color: 'bg-gray-600 text-gray-300' };
    if (!hasStarted) return { text: 'Upcoming', color: 'bg-blue-600 text-blue-100' };
    if (hasEnded) return { text: 'Ended', color: 'bg-red-600 text-red-100' };
    return { text: 'Active', color: 'bg-green-600 text-green-100' };
  };

  const statusBadge = getStatusBadge();

  if (isCompact) {
    return (
      <div 
        onClick={handleClick}
        className="bg-gray-800 rounded-lg border border-gray-700 p-3 hover:border-gray-600 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-white line-clamp-1">{challenge.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color}`}>
            {statusBadge.text}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{challenge.problems_count || 0} problems</span>
          <span className="flex items-center">
            {isParticipating ? (
              <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
            ) : (
              <XCircle className="w-3 h-3 text-gray-500 mr-1" />
            )}
            {challenge.participants_count || 0} participants
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
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
            {statusBadge.text}
          </span>
          {challenge.difficulty && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
              {challenge.difficulty}
            </span>
          )}
        </div>
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
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center space-x-1 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Start: {formatDate(challenge.start_date)}</span>
        </div>
        <div className="flex items-center space-x-1 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>End: {formatDate(challenge.end_date)}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Award className="w-4 h-4" />
            <span>{challenge.problems_count || 0} problems</span>
          </span>
          <span className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{challenge.participants_count || 0} participants</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {isParticipating ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-gray-500" />
          )}
          <span className="capitalize">{challenge.category || 'General'}</span>
        </div>
      </div>
    </div>
  );
};

export default CodingChallengeCard;