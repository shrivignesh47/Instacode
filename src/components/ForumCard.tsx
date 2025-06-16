
import { Users, MessageCircle, UserCheck, UserPlus } from 'lucide-react';
import { ForumWithMembership } from '../lib/supabaseClient';

interface ForumCardProps {
  forum: ForumWithMembership;
  onJoin: (forumId: string, event: React.MouseEvent) => void;
  onLeave: (forumId: string, event: React.MouseEvent) => void;
  onClick: (forumId: string) => void;
}

const ForumCard = ({ forum, onJoin, onLeave, onClick }: ForumCardProps) => {
  return (
    <div
      onClick={() => onClick(forum.id)}
      className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: forum.color }}
          >
            {forum.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
              {forum.name}
            </h3>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span className="px-2 py-1 bg-gray-700 rounded-md">{forum.category}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={(e) => forum.is_member ? onLeave(forum.id, e) : onJoin(forum.id, e)}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
            forum.is_member
              ? 'bg-green-600 text-white hover:bg-red-600'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {forum.is_member ? (
            <>
              <UserCheck className="w-3 h-3" />
              <span>Joined</span>
            </>
          ) : (
            <>
              <UserPlus className="w-3 h-3" />
              <span>Join</span>
            </>
          )}
        </button>
      </div>
      
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{forum.description}</p>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{forum.members_count}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>{forum.topics_count}</span>
          </div>
        </div>
        <span className="text-xs">
          {forum.is_member && (
            <span className="text-green-400">Member</span>
          )}
        </span>
      </div>
    </div>
  );
};

export default ForumCard;