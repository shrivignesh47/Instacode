import { Check, Edit, MapPin, Globe, Github, Linkedin, Twitter, Calendar, Loader2, MessageCircle, Code } from 'lucide-react';

interface ProfileHeaderProps {
  profile: any;
  isCurrentUser: boolean;
  isFollowing: boolean;
  followLoading: boolean;
  totalPosts: number;
  onEditProfile: () => void;
  onFollow: () => void;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
  onMessageClick: () => void;
}

const ProfileHeader = ({
  profile,
  isCurrentUser,
  isFollowing,
  followLoading,
  totalPosts,
  onEditProfile,
  onFollow,
  onFollowersClick,
  onFollowingClick,
  onMessageClick
}: ProfileHeaderProps) => {
  return (
    <div className="bg-gray-800 rounded-xl p-8 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          <img
            src={profile.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${profile.username}`}
            alt={profile.username}
            className="w-32 h-32 rounded-full border-4 border-purple-500"
          />
          {profile.verified && (
            <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-gray-400 text-lg">@{profile.username}</p>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              {isCurrentUser ? (
                <button
                  onClick={onEditProfile}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={onFollow}
                    disabled={followLoading}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      isFollowing
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {followLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      isFollowing ? 'Following' : 'Follow'
                    )}
                  </button>
                  
                  <button
                    onClick={onMessageClick}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-300 mb-4 text-lg leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Profile Details */}
          <div className="flex flex-wrap gap-4 mb-6 text-gray-400">
            {profile.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <a 
                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-purple-400 transition-colors"
              >
                <Globe className="w-4 h-4 mr-2" />
                <span>{profile.website}</span>
              </a>
            )}
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              })}</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-4 mb-6">
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center"
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </a>
            )}
            {profile.twitter_url && (
              <a
                href={profile.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </a>
            )}
            {profile.leetcode_username && (
              <a
                href={`https://leetcode.com/${profile.leetcode_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center"
              >
                <Code className="w-4 h-4 mr-2" />
                LeetCode
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalPosts}</div>
              <div className="text-gray-400">Posts</div>
            </div>
            <div 
              className="text-center cursor-pointer hover:bg-gray-700 rounded-lg py-2 transition-colors"
              onClick={onFollowersClick}
            >
              <div className="text-2xl font-bold text-white">{profile.followers_count || 0}</div>
              <div className="text-gray-400">Followers</div>
            </div>
            <div 
              className="text-center cursor-pointer hover:bg-gray-700 rounded-lg py-2 transition-colors"
              onClick={onFollowingClick}
            >
              <div className="text-2xl font-bold text-white">{profile.following_count || 0}</div>
              <div className="text-gray-400">Following</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;