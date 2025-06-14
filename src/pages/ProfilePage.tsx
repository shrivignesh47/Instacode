import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Edit,
  Save,
  X,
  Github,
  Code,
  Award,
  Users,
  Grid,
  Bookmark,
  UserPlus,
  UserCheck,
  CheckCircle,
  Play,
  FolderOpen,
  Image as ImageIcon,
  Video,
  MapPin,
  Calendar,
  ExternalLink,
  Linkedin,
  Twitter,
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'projects' | 'code' | 'media'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const isOwnProfile = user?.username === username;

  // Mock profile data
  const [profileData, setProfileData] = useState({
    username: username || 'johndoe',
    displayName: 'johndoe',
    bio: 'Full-stack developer passionate about React and Node.js',
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=300',
    verified: true,
    posts: 2,
    followers: 1234,
    following: 567,
    location: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    joinDate: 'March 2022',
    githubUrl: 'https://github.com/johndoe',
    leetcodeUrl: 'https://leetcode.com/johndoe',
    hackerrankUrl: 'https://hackerrank.com/johndoe',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    twitterUrl: 'https://twitter.com/johndoe',
    codeforceUrl: 'https://codeforces.com/profile/johndoe',
  });

  const [editProfileData, setEditProfileData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    githubUrl: '',
    leetcodeUrl: '',
    hackerrankUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    codeforceUrl: '',
  });

  const handleEditProfile = () => {
    setEditProfileData({
      displayName: profileData.displayName,
      bio: profileData.bio,
      location: profileData.location,
      website: profileData.website,
      githubUrl: profileData.githubUrl,
      leetcodeUrl: profileData.leetcodeUrl,
      hackerrankUrl: profileData.hackerrankUrl,
      linkedinUrl: profileData.linkedinUrl,
      twitterUrl: profileData.twitterUrl,
      codeforceUrl: profileData.codeforceUrl,
    });
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    console.log('Saving profile data:', editProfileData);
    setProfileData({
      ...profileData,
      ...editProfileData,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditProfileData({
      displayName: '',
      bio: '',
      location: '',
      website: '',
      githubUrl: '',
      leetcodeUrl: '',
      hackerrankUrl: '',
      linkedinUrl: '',
      twitterUrl: '',
      codeforceUrl: '',
    });
  };

  const mockPosts = [
    {
      id: 1,
      type: 'code',
      title: 'Building a beautiful React component with TypeScript! 🚀',
      content: 'interface ButtonProps {\n  children: React.ReactNode;\n  variant?: "primary" | "secondary";\n  onClick?: () => void;\n}',
      language: 'typescript',
      tags: ['#react', '#typescript', '#frontend'],
      timeAgo: '1h ago',
      likes: 45,
      comments: 12,
      shares: 8,
    },
  ];

  const tabs = [
    { id: 'posts', label: 'All Posts', icon: Users, count: profileData.posts },
    { id: 'projects', label: 'Projects', icon: FolderOpen, count: 0 },
    { id: 'code', label: 'Code', icon: Code, count: 1 },
    { id: 'media', label: 'Media', icon: ImageIcon, count: 0 },
  ];

  const codingPlatforms = [
    { 
      name: 'GitHub', 
      icon: Github, 
      key: 'githubUrl',
      color: 'hover:bg-gray-700'
    },
    { 
      name: 'LeetCode', 
      icon: Code, 
      key: 'leetcodeUrl',
      color: 'hover:bg-yellow-600'
    },
    { 
      name: 'HackerRank', 
      icon: Award, 
      key: 'hackerrankUrl',
      color: 'hover:bg-green-600'
    },
    { 
      name: 'Codeforces', 
      icon: Code, 
      key: 'codeforceUrl',
      color: 'hover:bg-blue-600'
    },
    { 
      name: 'LinkedIn', 
      icon: Linkedin, 
      key: 'linkedinUrl',
      color: 'hover:bg-blue-600'
    },
    { 
      name: 'Twitter', 
      icon: Twitter, 
      key: 'twitterUrl',
      color: 'hover:bg-blue-600'
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-0">
      {/* Header with Back Button */}
      <div className="flex items-center space-x-4 mb-6">
        <Link 
          to="/home" 
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back to Feed</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 border-purple-500 p-1">
              <img
                src={profileData.avatar}
                alt={profileData.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            {profileData.verified && (
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editProfileData.displayName}
                    onChange={(e) => setEditProfileData({ ...editProfileData, displayName: e.target.value })}
                    className="text-2xl lg:text-3xl font-bold text-white bg-gray-700 border border-gray-600 rounded px-3 py-1 mb-2"
                    placeholder="Display Name"
                  />
                ) : (
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                    {profileData.displayName}
                  </h1>
                )}
                
                {isEditing ? (
                  <textarea
                    value={editProfileData.bio}
                    onChange={(e) => setEditProfileData({ ...editProfileData, bio: e.target.value })}
                    className="text-lg text-gray-400 bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full resize-none"
                    rows={2}
                    placeholder="Bio"
                  />
                ) : (
                  <p className="text-gray-400 text-lg">{profileData.bio}</p>
                )}
              </div>
              
              {/* Action Button */}
              <div className="mt-4 sm:mt-0">
                {isOwnProfile ? (
                  <>
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveProfile}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleEditProfile}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isFollowing
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-8 mb-6">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{profileData.posts}</div>
                <div className="text-sm text-gray-400">Posts</div>
              </div>
              <div className="text-center cursor-pointer hover:text-purple-400 transition-colors">
                <div className="text-xl font-bold text-white">{profileData.followers.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Followers</div>
              </div>
              <div className="text-center cursor-pointer hover:text-purple-400 transition-colors">
                <div className="text-xl font-bold text-white">{profileData.following}</div>
                <div className="text-sm text-gray-400">Following</div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
              {profileData.location && (
                <>
                  {isEditing ? (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <input
                        type="text"
                        value={editProfileData.location}
                        onChange={(e) => setEditProfileData({ ...editProfileData, location: e.target.value })}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                        placeholder="Location"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profileData.location}</span>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {profileData.joinDate}</span>
              </div>
              
              {profileData.website && (
                <>
                  {isEditing ? (
                    <div className="flex items-center space-x-1">
                      <Globe className="w-4 h-4" />
                      <input
                        type="url"
                        value={editProfileData.website}
                        onChange={(e) => setEditProfileData({ ...editProfileData, website: e.target.value })}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                        placeholder="Website URL"
                      />
                    </div>
                  ) : (
                    <a
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 hover:text-purple-400 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Website</span>
                    </a>
                  )}
                </>
              )}
            </div>

            {/* Coding Platform Links */}
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {codingPlatforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <div key={platform.key} className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={editProfileData[platform.key as keyof typeof editProfileData]}
                        onChange={(e) => setEditProfileData({ 
                          ...editProfileData, 
                          [platform.key]: e.target.value 
                        })}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                        placeholder={`${platform.name} URL`}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {codingPlatforms.map((platform) => {
                  const Icon = platform.icon;
                  const url = profileData[platform.key as keyof typeof profileData] as string;
                  
                  if (!url) return null;
                  
                  return (
                    <a
                      key={platform.name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center space-x-2 px-4 py-2 bg-gray-800 ${platform.color} text-white rounded-lg transition-colors border border-gray-700`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{platform.name}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-8">
        <div className="flex space-x-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {mockPosts.map((post) => (
              <div key={post.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                {/* Post Header */}
                <div className="p-4 flex items-center space-x-3">
                  <img
                    src={profileData.avatar}
                    alt={profileData.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{profileData.displayName}</span>
                      {profileData.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <span className="text-sm text-gray-400">{post.timeAgo}</span>
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-4">
                  <p className="text-white mb-3">{post.title}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-purple-400 text-sm hover:text-purple-300 cursor-pointer">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Code Block */}
                  {post.type === 'code' && (
                    <div className="bg-gray-900 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-700">
                        <span className="text-sm text-gray-300 capitalize">{post.language}</span>
                        <button className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors">
                          <Play className="w-3 h-3" />
                          <span>Run</span>
                        </button>
                      </div>
                      <div className="p-4">
                        <pre className="text-sm text-gray-300 overflow-x-auto">
                          <code>{post.content}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {(activeTab === 'projects' || activeTab === 'media') && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'projects' ? (
                <FolderOpen className="w-8 h-8 text-gray-400" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-medium text-gray-400 mb-2">
              No {activeTab} yet
            </h3>
            <p className="text-gray-500">
              {activeTab === 'projects' 
                ? 'Projects will appear here when shared' 
                : 'Media posts will appear here when shared'
              }
            </p>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-6">
            {mockPosts.filter(post => post.type === 'code').map((post) => (
              <div key={post.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                {/* Post Header */}
                <div className="p-4 flex items-center space-x-3">
                  <img
                    src={profileData.avatar}
                    alt={profileData.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{profileData.displayName}</span>
                      {profileData.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <span className="text-sm text-gray-400">{post.timeAgo}</span>
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-4">
                  <p className="text-white mb-3">{post.title}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-purple-400 text-sm hover:text-purple-300 cursor-pointer">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Code Block */}
                  <div className="bg-gray-900 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-700">
                      <span className="text-sm text-gray-300 capitalize">{post.language}</span>
                      <button className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors">
                        <Play className="w-3 h-3" />
                        <span>Run</span>
                      </button>
                    </div>
                    <div className="p-4">
                      <pre className="text-sm text-gray-300 overflow-x-auto">
                        <code>{post.content}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;