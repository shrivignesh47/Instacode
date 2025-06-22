import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft,
  Loader2,
  Code
} from 'lucide-react';
import ProfileHeader from '../components/ProfileHeader';
import EditProfileModal from '../components/EditProfileModal';
import EditPostModal from '../components/EditPostModal';
import ContentTabs from '../components/ContentTabs';
import PostGrid from '../components/PostGrid';
import ShareModal from '../components/ShareModal';
import PostOptionsDropdown from '../components/PostOptionsDropdown';
import FollowersModal from '../components/FollowersModal';
import FollowingModal from '../components/FollowingModal';
import LeetCodeStats from '../components/LeetCodeStats';
import ChallengeStatsDashboard from '../components/ChallengeStatsDashboard';
import { useProfile } from '../hooks/useProfile';
import { 
  fetchLeetCodeProfileStats, 
  fetchLeetCodeSubmissions, 
  fetchLeetCodeSolvedStats,
  LeetCodeProfile, 
  LeetCodeSubmission,
  LeetCodeSolvedStats
} from '../utils/leetcodeApi';

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    profile,
    posts,
    loading,
    error,
    isCurrentUser,
    isFollowing,
    totalPosts,
    sortOrder,
    currentPage,
    postsPerPage,
    setProfile,
    setPosts,
    setIsFollowing,
    setSortOrder,
    setCurrentPage,
    setError
  } = useProfile(username);

  const [followLoading, setFollowLoading] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    display_name: '',
    bio: '',
    location: '',
    website: '',
    github_url: '',
    linkedin_url: '',
    twitter_url: '',
    leetcode_username: '',
    avatar_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isPostOptionsOpen, setIsPostOptionsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [editPost, setEditPost] = useState<any>(null);
  
  // New state for followers and following modals
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);

  // LeetCode integration
  const [leetcodeProfile, setLeetcodeProfile] = useState<LeetCodeProfile | null>(null);
  const [leetcodeSubmissions, setLeetcodeSubmissions] = useState<LeetCodeSubmission[] | null>(null);
  const [leetcodeSolvedStats, setLeetcodeSolvedStats] = useState<LeetCodeSolvedStats | null>(null);
  const [leetcodeLoading, setLeetcodeLoading] = useState(false);
  const [leetcodeError, setLeetcodeError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPost) {
      setShareLink(`${window.location.origin}/post/${selectedPost.id}`);
    }
  }, [selectedPost]);

  useEffect(() => {
    if (profile) {
      setProfileData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        twitter_url: profile.twitter_url || '',
        leetcode_username: profile.leetcode_username || '',
        avatar_url: profile.avatar_url || ''
      });

      // Fetch LeetCode data if username is available
      if (profile.leetcode_username) {
        fetchLeetCodeData(profile.leetcode_username);
      } else {
        // Reset LeetCode data if no username
        setLeetcodeProfile(null);
        setLeetcodeSubmissions(null);
        setLeetcodeSolvedStats(null);
        setLeetcodeError(null);
      }
    }
  }, [profile]);

  const fetchLeetCodeData = async (leetcodeUsername: string) => {
    setLeetcodeLoading(true);
    setLeetcodeError(null);

    try {
      // Fetch profile, submissions, and solved stats in parallel
      const [profile, submissions, solvedStats] = await Promise.all([
        fetchLeetCodeProfileStats(leetcodeUsername),
        fetchLeetCodeSubmissions(leetcodeUsername),
        fetchLeetCodeSolvedStats(leetcodeUsername)
      ]);

      setLeetcodeProfile(profile);
      setLeetcodeSubmissions(submissions);
      setLeetcodeSolvedStats(solvedStats);
    } catch (error) {
      console.error('Error fetching LeetCode data:', error);
      setLeetcodeError(error instanceof Error ? error.message : 'Failed to fetch LeetCode data');
    } finally {
      setLeetcodeLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      setError('You must be logged in to follow.');
      return;
    }

    setFollowLoading(true);
    setError(null);

    try {
      if (isFollowing) {
        const { error: unfollowError } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', profile.id);

        if (unfollowError) {
          throw unfollowError;
        }
        setIsFollowing(false);
      } else {
        const { error: followError } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            followed_id: profile.id,
          });

        if (followError) {
          throw followError;
        }
        setIsFollowing(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update follow status.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleEditProfile = () => {
    setEditProfile(true);
  };

  const handleSaveProfile = async (updatedProfileData: any) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedProfileData)
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      setProfile({
        ...profile,
        ...updatedProfileData,
      });
      setEditProfile(false);
      
      // If LeetCode username was updated, fetch new data
      if (updatedProfileData.leetcode_username !== profile.leetcode_username) {
        if (updatedProfileData.leetcode_username) {
          fetchLeetCodeData(updatedProfileData.leetcode_username);
        } else {
          setLeetcodeProfile(null);
          setLeetcodeSubmissions(null);
          setLeetcodeSolvedStats(null);
          setLeetcodeError(null);
        }
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const togglePostOptions = (post: any) => {
    setSelectedPost(post);
    setIsPostOptionsOpen(!isPostOptionsOpen);
  };

  const handleEditPost = (post: any) => {
    setSelectedPost(post);
    setEditPost(post);
    setIsPostOptionsOpen(false);
  };

  const handleMessageClick = () => {
    if (profile) {
      navigate(`/messages?user=${profile.username}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center mt-4">Error: {error}</div>
    );
  }

  if (!profile) {
    return (
      <div className="text-gray-500 text-center mt-4">Profile not found.</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile-optimized container with proper overflow handling */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 overflow-hidden">
        {/* Header - More compact on mobile */}
        <div className="flex items-center justify-between mb-3 sm:mb-6 pt-3 sm:pt-4">
          <button 
            onClick={() => navigate('/home')}
            className="flex items-center text-gray-400 hover:text-white p-1 sm:p-2 -ml-1 sm:-ml-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base hidden sm:inline">Back to Feed</span>
          </button>
        </div>

        {/* Profile Header - Compact mobile layout */}
        <div className="mb-4 sm:mb-6">
          <ProfileHeader
            profile={profile}
            isCurrentUser={isCurrentUser}
            isFollowing={isFollowing}
            followLoading={followLoading}
            totalPosts={totalPosts}
            onEditProfile={handleEditProfile}
            onFollow={handleFollow}
            onFollowersClick={() => setIsFollowersModalOpen(true)}
            onFollowingClick={() => setIsFollowingModalOpen(true)}
            onMessageClick={handleMessageClick}
          />
        </div>

        {/* Challenge Stats Dashboard */}
        <div className="mb-6">
          <ChallengeStatsDashboard userId={profile.id} />
        </div>

        {/* LeetCode Stats Section */}
        {profile.leetcode_username ? (
          <LeetCodeStats
            leetcodeProfile={leetcodeProfile}
            leetcodeSubmissions={leetcodeSubmissions}
            leetcodeSolvedStats={leetcodeSolvedStats}
            loading={leetcodeLoading}
            error={leetcodeError}
            username={profile.leetcode_username}
          />
        ) : isCurrentUser ? (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Code className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-semibold text-white">Connect LeetCode</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Connect your LeetCode account to showcase your coding stats and recent submissions on your profile.
            </p>
            <button
              onClick={handleEditProfile}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Code className="w-4 h-4" />
              <span>Add LeetCode Username</span>
            </button>
          </div>
        ) : null}

        {/* Content Tabs - Mobile scrollable with proper container */}
        <div className="mb-4 sm:mb-6 w-full">
          <ContentTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            posts={posts}
          />
        </div>

        {/* Posts Section - Responsive grid with better mobile spacing */}
        <div className="w-full overflow-hidden">
          <PostGrid
            posts={posts}
            currentPage={currentPage}
            postsPerPage={postsPerPage}
            sortOrder={sortOrder}
            searchQuery={searchQuery}
            likeCount={0}
            isPostLiked={false}
            isBookmarked={false}
            activeTab={activeTab}
            onToggleSortOrder={toggleSortOrder}
            onPageChange={handlePageChange}
            onSearchChange={setSearchQuery}
            onPostOptions={togglePostOptions}
            onLikePost={() => {}}
            onBookmarkPost={() => {}}
            onShareClick={() => setIsShareModalOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={editProfile}
        profileData={profileData}
        isSaving={isSaving}
        saveError={saveError}
        onClose={() => setEditProfile(false)}
        onSave={handleSaveProfile}
        onInputChange={handleInputChange}
      />

      <EditPostModal
        isOpen={!!editPost}
        onClose={() => setEditPost(null)}
        post={editPost}
        onPostUpdated={(updatedPost) => {
          setPosts(posts.map(post => post.id === updatedPost.id ? updatedPost : post));
          setEditPost(null);
        }}
      />

      <PostOptionsDropdown
        isOpen={isPostOptionsOpen}
        postId={selectedPost?.id || ''}
        postUserId={selectedPost?.user_id || ''}
        onClose={() => setIsPostOptionsOpen(false)}
        onEditPost={() => handleEditPost(selectedPost)}
        onPostDeleted={() => {
          if (selectedPost) {
            setPosts(posts.filter(post => post.id !== selectedPost.id));
            setIsPostOptionsOpen(false);
          }
        }}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        shareLink={shareLink}
        isCodeCopied={isCodeCopied}
        onClose={() => setIsShareModalOpen(false)}
        onCopyLink={() => {
          navigator.clipboard.writeText(shareLink);
          setIsCodeCopied(true);
          setTimeout(() => setIsCodeCopied(false), 2000);
        }}
      />

      {/* Followers Modal */}
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        userId={profile.id}
        username={profile.username}
      />

      {/* Following Modal */}
      <FollowingModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        userId={profile.id}
        username={profile.username}
      />
    </div>
  );
};

export default ProfilePage;