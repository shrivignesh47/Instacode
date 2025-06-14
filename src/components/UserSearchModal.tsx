import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MessageCircle, User, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect?: (user: any) => void;
  onStartConversation?: (user: any) => void;
}

interface SearchUser {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  bio: string;
  verified: boolean;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onUserSelect,
  onStartConversation
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentUsers, setRecentUsers] = useState<SearchUser[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load recent users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRecentUsers();
    }
  }, [isOpen]);

  const loadRecentUsers = async () => {
    try {
      // Get users from recent conversations
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          participant_1,
          participant_2,
          profiles!conversations_participant_1_fkey(id, username, avatar_url, bio),
          profiles_participant_2:profiles!conversations_participant_2_fkey(id, username, avatar_url, bio)
        `)
        .or(`participant_1.eq.${user?.id},participant_2.eq.${user?.id}`)
        .order('last_message_at', { ascending: false })
        .limit(5);

      if (!error && conversations) {
        const users: SearchUser[] = [];
        conversations.forEach(conv => {
          const otherUser = conv.participant_1 === user?.id 
            ? conv.profiles_participant_2 
            : conv.profiles;
          
          if (otherUser && !users.find(u => u.id === otherUser.id)) {
            users.push({
              id: otherUser.id,
              username: otherUser.username,
              email: '',
              avatar_url: otherUser.avatar_url || '',
              bio: otherUser.bio || '',
              verified: false
            });
          }
        });
        setRecentUsers(users);
      }
    } catch (error) {
      console.error('Error loading recent users:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url, bio')
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('id', user?.id) // Exclude current user
        .limit(10);

      if (!error && users) {
        setSearchResults(users.map(u => ({
          ...u,
          verified: false // Add verified status if needed
        })));
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(query);
    }, 300);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleUserClick = (selectedUser: SearchUser) => {
    if (onUserSelect) {
      onUserSelect(selectedUser);
    }
    onClose();
  };

  const handleStartConversation = (selectedUser: SearchUser) => {
    if (onStartConversation) {
      onStartConversation(selectedUser);
    }
    onClose();
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Search Users</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search by username or email..."
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {searchQuery.trim() ? (
            // Search Results
            <div className="p-4">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-3">
                    <Loader className="w-5 h-5 text-purple-500 animate-spin" />
                    <span className="text-gray-400">Searching...</span>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Search Results</h3>
                  {searchResults.map((searchUser) => (
                    <div
                      key={searchUser.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleUserClick(searchUser)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <img
                          src={searchUser.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50'}
                          alt={searchUser.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium truncate">{searchUser.username}</span>
                            {searchUser.verified && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          {searchUser.bio && (
                            <p className="text-gray-400 text-sm truncate">{searchUser.bio}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartConversation(searchUser);
                        }}
                        className="ml-2 p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-600 rounded-full transition-colors"
                        title="Send message"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <User className="w-12 h-12 text-gray-500 mb-3" />
                  <span className="text-gray-400 text-center">No users found</span>
                  <span className="text-gray-500 text-sm text-center mt-1">
                    Try searching with a different username or email
                  </span>
                </div>
              )}
            </div>
          ) : (
            // Recent Users
            <div className="p-4">
              {recentUsers.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Conversations</h3>
                  {recentUsers.map((recentUser) => (
                    <div
                      key={recentUser.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleUserClick(recentUser)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <img
                          src={recentUser.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50'}
                          alt={recentUser.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium truncate">{recentUser.username}</span>
                            {recentUser.verified && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          {recentUser.bio && (
                            <p className="text-gray-400 text-sm truncate">{recentUser.bio}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartConversation(recentUser);
                        }}
                        className="ml-2 p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-600 rounded-full transition-colors"
                        title="Send message"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-500 mb-3" />
                  <span className="text-gray-400 text-center">No recent conversations</span>
                  <span className="text-gray-500 text-sm text-center mt-1">
                    Start typing to search for users
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;