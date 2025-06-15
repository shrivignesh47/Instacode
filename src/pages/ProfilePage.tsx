import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft,
  Loader2,
  FileText,
  Code,
  Image
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
    twitter_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isPostOptionsOpen, setIsPostOptionsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPostLiked, setIsPostLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
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
        twitter_url: profile.twitter_url || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (selectedPost) {
      const fetchLikeStatus = async () => {
        if (user) {
          const { data: likeData, error: likeError } = await supabase
            .from('likes')
            .select('*')
            .eq('user_id', user.id)
            .eq('post_id', selectedPost.id)
            .single();

          if (likeError) {
            console.error('Error fetching like status:', likeError);
          } else {
            setIsPostLiked(!!likeData);
          }
        }
      };

      const fetchBookmarkStatus = async () => {
        if (user) {
          const { data: bookmarkData, error: bookmarkError } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', user.id)
            .eq('post_id', selectedPost.id)
            .single();

          if (bookmarkError) {
            console.error('Error fetching bookmark status:', bookmarkError);
          } else {
            setIsBookmarked(!!bookmarkData);
          }
        }
      };

      fetchLikeStatus();
      fetchBookmarkStatus();
    }
  }, [selectedPost, user]);

  useEffect(() => {
    const fetchLikeCount = async () => {
      if (selectedPost) {
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('count', { count: 'exact' })
          .eq('post_id', selectedPost.id);

        if (likesError) {
          console.error('Error fetching like count:', likesError);
        } else {
          setLikeCount(likesData ? likesData.length : 0);
        }
      }
    };

    fetchLikeCount();
  }, [selectedPost, isPostLiked]);

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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      setProfile({
        ...profile,
        ...profileData,
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

  const handleLikePost = async () => {
    if (!user || !selectedPost) return;

    try {
      if (isPostLiked) {
        const { error: unlikeError } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', selectedPost.id);

        if (unlikeError) {
          throw unlikeError;
        }
        setIsPostLiked(false);
        setLikeCount((prevCount: number) => prevCount > 0 ? prevCount - 1 : 0);
      } else {
        const { error: likeError } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: selectedPost.id,
          });

        if (likeError) {
          throw likeError;
        }
        setIsPostLiked(true);
        setLikeCount((prevCount: number) => prevCount + 1);
      }
    } catch (err: any) {
      console.error('Error liking/unliking post:', err);
    }
  };

  const handleBookmarkPost = async () => {
    if (!user || !selectedPost) return;

    try {
      if (isBookmarked) {
        const { error: unbookmarkError } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', selectedPost.id);

        if (unbookmarkError) {
          throw unbookmarkError;
        }
        setIsBookmarked(false);
      } else {
        const { error: bookmarkError } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            post_id: selectedPost.id,
          });

        if (bookmarkError) {
          throw bookmarkError;
        }
        setIsBookmarked(true);
      }
    } catch (err: any) {
      console.error('Error bookmarking/unbookmarking post:', err);
    }
  };

  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2000);
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
    <div className="max-w-6xl mx-auto p-4 dark:bg-gray-900 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button className="flex items-center text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Feed
        </button>
      </div>

      <ProfileHeader
        profile={profile}
        isCurrentUser={isCurrentUser}
        isFollowing={isFollowing}
        followLoading={followLoading}
        totalPosts={totalPosts}
        onEditProfile={handleEditProfile}
        onFollow={handleFollow}
      />

      <EditProfileModal
        isOpen={editProfile}
        profileData={profileData}
        isSaving={isSaving}
        saveError={saveError}
        onClose={() => setEditProfile(false)}
        onSave={handleSaveProfile}
        onInputChange={handleInputChange}
      />

      <ContentTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Posts Section */}
      {activeTab === 'posts' && (
        <PostGrid
          posts={posts}
          totalPosts={totalPosts}
          currentPage={currentPage}
          postsPerPage={postsPerPage}
          sortOrder={sortOrder}
          searchQuery={searchQuery}
          likeCount={likeCount}
          isPostLiked={isPostLiked}
          isBookmarked={isBookmarked}
          onToggleSortOrder={toggleSortOrder}
          onPageChange={handlePageChange}
          onSearchChange={setSearchQuery}
          onPostOptions={togglePostOptions}
          onLikePost={handleLikePost}
          onBookmarkPost={handleBookmarkPost}
          onShareClick={handleShareClick}
        />
      )}

      {/* Other tab content placeholders */}
      {activeTab === 'projects' && (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No projects yet</p>
        </div>
      )}
      
      {activeTab === 'code' && (
        <div className="text-center py-12 text-gray-400">
          <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No code snippets yet</p>
        </div>
      )}
      
      {activeTab === 'media' && (
        <div className="text-center py-12 text-gray-400">
          <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No media yet</p>
        </div>
      )}

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
        onClose={handleCloseShareModal}
        onCopyLink={handleCopyLink}
      />
    </div>
  );
};

export default ProfilePage;