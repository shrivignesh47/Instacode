import React, { useState, useEffect } from 'react';
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
  Globe,
  MessageCircle,
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type PostWithUser } from '../lib/supabaseClient';
import PostCard from '../components/PostCard';

const ProfilePage = () => {
  const { username } = useParams();
  const { user, fetchProfileByUsername, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'projects' | 'code' | 'media'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  
  const [profileData, setProfileData] = useState<any>(null);
  const isOwnProfile = user?.username === username;

  const [editProfileData, setEditProfileData] = useState({
    username: '',
    bio: '',
    location: '',
    website: '',
    githubUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
  });

  // Fetch profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const profile = await fetchProfileByUsername(username);
        if (profile) {
          setProfileData(profile);
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username, fetchProfileByUsername]);

  // Fetch user posts
  useEffect(() => {
    const loadPosts = async () => {
      if (!profileData?.id) return;
      
      setPostsLoading(true);
      try {
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles (
              id,
              username,
              avatar_url
            )
          `)
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false });

        if (postsError) {
          throw postsError;
        }

        // Check which posts the current user has liked
        let postsWithLikes = postsData || [];
        if (user) {
          const { data: likesData } = await supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', user.id);

          const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
          
          postsWithLikes = postsData?.map(post => ({
            ...post,
            user_liked: likedPostIds.has(post.id)
          })) || [];
        }

        setPosts(postsWithLikes as PostWithUser[]);
      } catch (err) {
        console.error('Error loading posts:', err);
      } finally {
        setPostsLoading(false);
      }
    };

    loadPosts();
  }, [profileData?.id, user]);

  const handleEditProfile = () => {
    if (!profileData) return;
    
    setEditProfileData({
      username: profileData.username,
      bio: profileData.bio,
      location: profileData.location,
      website: profileData.website,
      githubUrl: profileData.githubUrl,
      linkedinUrl: profileData.linkedinUrl,
      twitterUrl: profileData.twitterUrl,
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile(editProfileData);
      
      if (result.success) {
        // Refresh profile data
        const updatedProfile = await fetchProfileByUsername(username!);
        if (updatedProfile) {
          setProfileData(updatedProfile);
        }
        setIsEditing(false);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditProfileData({
      username: '',
      bio: '',
      location: '',
      website: '',
      githubUrl: '',
      linkedinUrl: '',
      twitterUrl: '',
    });
  };

  const handleStartConversation = () => {
    // Navigate to messages with the user
    window.location.href = `/messages?user=${profileData.username}`;
  };

  const tabs = [
    { id: 'posts', label: 'All Posts', icon: Users, count: profileData?.posts || 0 },
    { id: 'projects', label: 'Projects', icon: FolderOpen, count: posts.filter(p => p.type === 'project').length },
    { id: 'code', label: 'Code', icon: Code, count: posts.filter(p => p.type === 'code').length },
    { id: 'media', label: 'Media', icon: ImageIcon, count: posts.filter(p => p.type === 'image' || p.type === 'video').length },
  ];

  const codingPlatforms = [
    { 
      name: 'GitHub', 
      icon: Github, 
      key: 'githubUrl',
      color: 'hover:bg-gray-700'
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

  const getFilteredPosts = () => {
    switch (activeTab) {
      case 'projects':
        return posts.filter(post => post.type === 'project');
      case 'code':
        return posts.filter(post => post.type === 'code');
      case 'media':
        return posts.filter(post => post.type === 'image' || post.type === 'video');
      default:
        return posts;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-0">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="text-white text-lg">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-0">
        <div className="flex items-center space-x-4 mb-6">
          <Link 
            to="/home" 
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Feed</span>
          </Link>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-400 mb-2">
            {error || 'User not found'}
          </h3>
          <p className="text-gray-500">
            The profile you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

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
                alt={profileData.username}
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
                    value={editProfileData.username}
                    onChange={(e) => setEditProfileData({ ...editProfileData, username: e.target.value })}
                    className="text-2xl lg:text-3xl font-bold text-white bg-gray-700 border border-gray-600 rounded px-3 py-1 mb-2"
                    placeholder="Username"
                  />
                ) : (
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                    {profileData.username}
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
              
              {/* Action Buttons */}
              <div className="mt-4 sm:mt-0 flex space-x-2">
                {isOwnProfile ? (
                  <>
                    {isEditing ? (
                      <>
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
                      </>
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
                  <>
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
                    <button
                      onClick={handleStartConversation}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                  </>
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
        {postsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <Loader className="w-6 h-6 text-purple-500 animate-spin" />
              <span className="text-white">Loading posts...</span>
            </div>
          </div>
        ) : (
          <>
            {getFilteredPosts().length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'projects' ? (
                    <FolderOpen className="w-8 h-8 text-gray-400" />
                  ) : activeTab === 'code' ? (
                    <Code className="w-8 h-8 text-gray-400" />
                  ) : activeTab === 'media' ? (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  ) : (
                    <Users className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h3 className="text-xl font-medium text-gray-400 mb-2">
                  No {activeTab} yet
                </h3>
                <p className="text-gray-500">
                  {activeTab === 'projects' 
                    ? 'Projects will appear here when shared' 
                    : activeTab === 'code'
                    ? 'Code snippets will appear here when shared'
                    : activeTab === 'media'
                    ? 'Images and videos will appear here when shared'
                    : 'Posts will appear here when shared'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {getFilteredPosts().map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;