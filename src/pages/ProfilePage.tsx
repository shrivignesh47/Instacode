
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import ProfileHeader from '../components/ProfileHeader';
import EditProfileModal from '../components/EditProfileModal';
import ContentTabs from '../components/ContentTabs';
import PostGrid from '../components/PostGrid';
import ShareModal from '../components/ShareModal';
import PostOptionsDropdown from '../components/PostOptionsDropdown';
import { useProfile } from '../hooks/useProfile';

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  
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
    avatar_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isPostOptionsOpen, setIsPostOptionsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

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
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

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

  const handleDeletePost = async () => {
    if (!selectedPost) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', selectedPost.id);

      if (deleteError) {
        throw deleteError;
      }

      setPosts(posts.filter(post => post.id !== selectedPost.id));
      setIsPostOptionsOpen(false);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete post.');
    } finally {
      setIsDeleting(false);
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
          <button className="flex items-center text-gray-400 hover:text-white p-1 sm:p-2 -ml-1 sm:-ml-2 rounded-lg">
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
          />
        </div>

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

      <PostOptionsDropdown
        isOpen={isPostOptionsOpen}
        isDeleting={isDeleting}
        deleteError={deleteError}
        onDelete={handleDeletePost}
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
    </div>
  );
};

export default ProfilePage;