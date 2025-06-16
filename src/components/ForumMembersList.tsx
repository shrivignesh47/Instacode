
import { useState, useEffect } from 'react';
import { Users, Crown, Shield, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ForumMember {
  id: string;
  user_id: string;
  forum_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  profiles: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface ForumMembersListProps {
  forumId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ForumMembersList = ({ forumId, isOpen, onClose }: ForumMembersListProps) => {
  const [members, setMembers] = useState<ForumMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && forumId) {
      fetchMembers();
    }
  }, [isOpen, forumId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('forum_members')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('forum_id', forumId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching forum members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-400';
      case 'moderator':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Forum Members</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-white">Loading members...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg"
                >
                  <img
                    src={member.profiles.avatar_url || 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50'}
                    alt={member.profiles.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">
                        {member.profiles.display_name || member.profiles.username}
                      </span>
                      {getRoleIcon(member.role)}
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className={`capitalize ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      <span className="text-gray-400">
                        • Joined {new Date(member.joined_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {members.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">No members found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumMembersList;