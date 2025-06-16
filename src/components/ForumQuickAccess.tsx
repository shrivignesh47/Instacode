
import { useState } from 'react';
import { Users, MessageSquare, ChevronRight, Plus } from 'lucide-react';
import { useForums } from '../hooks/useForums';
import { useNavigate } from 'react-router-dom';

const ForumQuickAccess = () => {
  const { forums, loading } = useForums();
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const joinedForums = forums.filter(forum => forum.is_member);

  if (loading || joinedForums.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-700 p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">My Forums</span>
          <span className="text-xs bg-gray-600 px-2 py-1 rounded-full text-gray-300">
            {joinedForums.length}
          </span>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {joinedForums.slice(0, 5).map((forum) => (
            <button
              key={forum.id}
              onClick={() => navigate(`/forum/${forum.id}`)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: forum.color }}
                />
                <div className="text-left">
                  <div className="text-sm text-white font-medium truncate">{forum.name}</div>
                  <div className="text-xs text-gray-400">
                    {forum.members_count} members • {forum.topics_count} topics
                  </div>
                </div>
              </div>
              <MessageSquare className="w-4 h-4 text-gray-400" />
            </button>
          ))}
          
          {joinedForums.length === 0 && (
            <div className="text-center py-4">
              <button
                onClick={() => navigate('/forums')}
                className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Join Forums</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ForumQuickAccess;