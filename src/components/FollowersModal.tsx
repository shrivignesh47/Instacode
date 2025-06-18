import React, { useState, useEffect } from 'react';
import { X, Search, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

interface Follower {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const FollowersModal: React.FC<FollowersModalProps> = ({ isOpen, onClose, userId, username }) => {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchFollowers();
    }
  }, [isOpen, userId]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('followers')
        .select(`
          follower_id,
          profiles:profiles!followers_follower_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq('followed_id', userId);

      if (error) {
        throw error;
      }

      const formattedFollowers = data
        .map(item => {
          const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          return profile;
        })
        .filter(Boolean);

      setFollowers(formattedFollowers);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (follower: Follower) => {
    navigate(`/profile/${follower.username}`);
    onClose();
  };

  const handleStartConversation = (follower: Follower, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/messages?user=${follower.username}`);
    onClose();
  };

  const filteredFollowers = followers.filter(follower => 
    follower.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (follower.display_name && follower.display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (follower.bio && follower.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Followers of {username}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search followers..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Followers List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500 mr-2" />
              <span className="text-gray-400">Loading followers...</span>
            </div>
          ) : filteredFollowers.length > 0 ? (
            <div className="p-4 space-y-3">
              {filteredFollowers.map((follower) => (
                <div
                  key={follower.id}
                  onClick={() => handleUserClick(follower)}
                  className="flex items-center justify-between p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <img
                      src={follower.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50'}
                      alt={follower.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {follower.display_name || follower.username}
                      </div>
                      <div className="text-gray-400 text-sm truncate">@{follower.username}</div>
                    </div>
                  </div>
                  
                  {user && user.id !== follower.id && (
                    <button
                      onClick={(e) => handleStartConversation(follower, e)}
                      className="ml-2 p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-600 rounded-full transition-colors"
                      title="Send message"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-500" />
              </div>
              {searchQuery ? (
                <>
                  <h3 className="text-lg font-medium text-white mb-2">No followers found</h3>
                  <p className="text-gray-400 text-sm">
                    No followers match your search criteria
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-white mb-2">No followers yet</h3>
                  <p className="text-gray-400 text-sm">
                    {username} doesn't have any followers yet
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;