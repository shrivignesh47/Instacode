import React, { useState, useEffect } from 'react';
import { X, Search, Send, User, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import type { PostWithUser } from '../lib/supabaseClient';

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostWithUser;
}

interface SearchUser {
  id: string;
  username: string;
  avatar_url: string;
  bio: string;
}

const SharePostModal: React.FC<SharePostModalProps> = ({
  isOpen,
  onClose,
  post
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [recentUsers, setRecentUsers] = useState<SearchUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const [message, setMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRecentUsers();
    }
  }, [isOpen]);

  const loadRecentUsers = async () => {
    try {
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
        .limit(8);

      if (!error && conversations) {
        const users: SearchUser[] = [];
        conversations.forEach(conv => {
          const participantProfile = conv.participant_1 === user?.id 
            ? conv.profiles_participant_2 
            : conv.profiles;
          
          let otherUser: SearchUser | null = null;

          if (Array.isArray(participantProfile) && participantProfile.length > 0) {
            otherUser = participantProfile[0];
          } else if (participantProfile && !Array.isArray(participantProfile)) {
            otherUser = participantProfile as SearchUser;
          }
          
          if (otherUser && !users.find(u => u.id === otherUser.id)) {
            users.push(otherUser);
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
        .select('id, username, avatar_url, bio')
        .or(`username.ilike.%${query}%`)
        .neq('id', user?.id)
        .limit(10);

      if (!error && users) {
        setSearchResults(users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const toggleUserSelection = (selectedUser: SearchUser) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === selectedUser.id);
      if (isSelected) {
        return prev.filter(u => u.id !== selectedUser.id);
      } else {
        return [...prev, selectedUser];
      }
    });
  };

  // Helper for share message based on post type
  const getDefaultShareMessage = () => {
    switch (post.type) {
      case "code":
        return "Shared a code with compiler";
      case "project":
        return "Shared a project";
      case "image":
        return "Shared an image";
      case "video":
        return "Shared a video";
      default:
        return "Shared a post";
    }
  };

  const handleSendPost = async () => {
    if (selectedUsers.length === 0) return;

    setIsSending(true);
    try {
      // Send post to each selected user
      for (const selectedUser of selectedUsers) {
        // Get or create conversation
        const { data: conversationData, error: convError } = await supabase
          .rpc('get_or_create_conversation', {
            user1_id: user?.id,
            user2_id: selectedUser.id
          });

        if (convError) {
          console.error('Error getting conversation:', convError);
          continue;
        }

        // Send message with shared post & context-aware text
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationData,
            sender_id: user?.id,
            content: message || getDefaultShareMessage(),
            message_type: 'post_share',
            shared_post_id: post.id
          });

        if (messageError) {
          console.error('Error sending message:', messageError);
        }
      }

      // Reset form and close modal
      setSelectedUsers([]);
      setMessage('');
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Error sharing post:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const displayUsers = searchQuery.trim() ? searchResults : recentUsers;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Share Post</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post Preview */}
        <div className="p-4 border-b border-gray-700">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <img
                src={post.profiles.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50'}
                alt={post.profiles.username}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-white text-sm font-medium">{post.profiles.username}</span>
              <span className="text-gray-400 text-xs capitalize">{post.type}</span>
            </div>
            <p className="text-gray-300 text-sm line-clamp-2">{post.content}</p>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((selectedUser) => (
                <div
                  key={selectedUser.id}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm"
                >
                  <img
                    src={selectedUser.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50'}
                    alt={selectedUser.username}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span>{selectedUser.username}</span>
                  <button
                    onClick={() => toggleUserSelection(selectedUser)}
                    className="text-white hover:text-gray-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-5 h-5 text-purple-500 animate-spin mr-2" />
                <span className="text-gray-400">Searching...</span>
              </div>
            ) : displayUsers.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400 mb-3">
                  {searchQuery.trim() ? 'Search Results' : 'Recent Conversations'}
                </h3>
                {displayUsers.map((displayUser) => {
                  const isSelected = selectedUsers.find(u => u.id === displayUser.id);
                  return (
                    <div
                      key={displayUser.id}
                      onClick={() => toggleUserSelection(displayUser)}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-purple-600 text-white' 
                          : 'hover:bg-gray-700 text-white'
                      }`}
                    >
                      <img
                        src={displayUser.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50'}
                        alt={displayUser.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{displayUser.username}</span>
                        {displayUser.bio && (
                          <p className={`text-sm truncate ${isSelected ? 'text-purple-100' : 'text-gray-400'}`}>
                            {displayUser.bio}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                          <span className="text-purple-600 text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <User className="w-12 h-12 text-gray-500 mb-3" />
                <span className="text-gray-400 text-center">
                  {searchQuery.trim() ? 'No users found' : 'No recent conversations'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-700">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message (optional)..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={2}
          />
        </div>

        {/* Send Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleSendPost}
            disabled={selectedUsers.length === 0 || isSending}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {isSending ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send to {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;