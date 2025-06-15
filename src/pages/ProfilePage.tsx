
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
  Check, 
  MoreHorizontal,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Search,
  Heart,
  HeartOff,
  Bookmark,
  BookmarkMinus,
  Share2,
  Trash2,
  Copy,
  ExternalLink,
  Edit,
} from 'lucide-react';

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const [newBio, setNewBio] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 6;
    const [totalPosts, setTotalPosts] = useState(0);
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
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
      if (selectedPost) {
          setShareLink(`${window.location.origin}/post/${selectedPost.id}`);
      }
  }, [selectedPost]);

  useEffect(() => {
      if (user && profile) {
          setIsCurrentUser(user.id === profile.id);
      }
  }, [user, profile]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!username) {
          throw new Error('Username is required');
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (!profileData) {
          throw new Error('Profile not found');
        }

        setProfile(profileData);

        const { data: postsData, error: postsError, count } = await supabase
          .from('posts')
          .select('*, likes(count)', { count: 'exact' })
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: sortOrder === 'oldest' })
          .range((currentPage - 1) * postsPerPage, currentPage * postsPerPage - 1);

        if (postsError) {
          throw postsError;
        }

        setPosts(postsData || []);
        setTotalPosts(count || 0);

        if (user) {
          const { data: followingData, error: followingError } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', user.id)
            .eq('followed_id', profileData.id)
            .single();

          if (followingError) {
            console.error('Error fetching follow status:', followingError);
          } else {
            setIsFollowing(!!followingData);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, user, isFollowing, sortOrder, currentPage]);

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
        setNewDisplayName(profile.display_name || '');
        setNewBio(profile.bio || '');
        setEditProfile(true);
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setSaveError(null);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    display_name: newDisplayName,
                    bio: newBio,
                })
                .eq('id', user?.id);

            if (updateError) {
                throw updateError;
            }

            setProfile({
                ...profile,
                display_name: newDisplayName,
                bio: newBio,
            });
            setEditProfile(false);
        } catch (err: any) {
            setSaveError(err.message || 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
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

    const toggleDescription = () => {
        setIsDescriptionExpanded(!isDescriptionExpanded);
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
    <div className="max-w-4xl mx-auto p-4 dark:bg-gray-900 dark:text-white">
      {/* Profile Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <img
            src={`https://api.dicebear.com/7.x/personas/svg?seed=${profile.username}`}
            alt={profile.username}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h2 className="text-2xl font-bold">{profile.display_name || profile.username}</h2>
            <p className="text-gray-500">@{profile.username}</p>
          </div>
        </div>

        {/* Follow/Unfollow Button */}
        {!isCurrentUser && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`px-4 py-2 rounded-md font-medium ${
              isFollowing
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {followLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              isFollowing ? 'Unfollow' : 'Follow'
            )}
          </button>
        )}
      </div>

        {/* Edit Profile Section */}
        {isCurrentUser && (
            <div className="mb-6">
                {editProfile ? (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Display Name
                            </label>
                            <input
                                type="text"
                                id="displayName"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={newDisplayName}
                                onChange={(e) => setNewDisplayName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Bio
                            </label>
                            <textarea
                                id="bio"
                                rows={3}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={newBio}
                                onChange={(e) => setNewBio(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                            >
                                {isSaving ? (
                                    <>
                                        Saving...
                                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                    </>
                                ) : 'Save'}
                            </button>
                            <button
                                onClick={() => setEditProfile(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                        {saveError && (
                            <div className="text-red-500 text-sm" role="alert">
                                {saveError}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500">{profile.bio || 'No bio available.'}</p>
                        <button
                            onClick={handleEditProfile}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                        </button>
                    </div>
                )}
            </div>
        )}

      {/* Posts Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Posts</h3>
            <div className="flex items-center space-x-4">
                <button
                    onClick={toggleSortOrder}
                    className="px-3 py-2 rounded-md text-sm bg-gray-700 hover:bg-gray-600 text-gray-300"
                >
                    Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                </button>
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        className="pl-8 pr-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {/* Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts
            .filter((post: any) => {
              if (!searchQuery) return true;
              const title = post.title || post.content || '';
              const description = post.description || post.content || '';
              return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     description.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .map((post: any) => (
              <div key={post.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="relative">
                  {post.media_url && (
                    <img
                      src={post.media_url}
                      alt={post.title || 'Post image'}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => togglePostOptions(post)}
                      className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-lg font-semibold mb-2">{post.title || 'Untitled'}</h4>
                    <p className={`text-gray-400 text-sm mb-3 ${isDescriptionExpanded ? '' : 'line-clamp-2'}`}>
                        {post.description || post.content || 'No description'}
                    </p>
                    {(post.description || post.content) && (post.description || post.content).length > 100 && (
                        <button onClick={toggleDescription} className="text-purple-500 text-xs hover:underline">
                            {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                        </button>
                    )}
                  <div className="flex items-center justify-between text-gray-500 text-sm">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <div className="flex space-x-3">
                      <button onClick={handleLikePost}>
                        {isPostLiked ? <Heart className="w-4 h-4 text-red-500" /> : <HeartOff className="w-4 h-4" />}
                      </button>
                      <span>{likeCount}</span>
                      <button onClick={handleBookmarkPost}>
                        {isBookmarked ? <Bookmark className="w-4 h-4 text-blue-500" /> : <BookmarkMinus className="w-4 h-4" />}
                      </button>
                      <button onClick={handleShareClick}>
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Pagination */}
        {totalPosts > postsPerPage && (
            <div className="flex justify-center mt-6">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArrowLeft className="w-4 h-4 inline-block mr-2" />
                    Previous
                </button>
                <span className="mx-4 text-gray-400">Page {currentPage} of {Math.ceil(totalPosts / postsPerPage)}</span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === Math.ceil(totalPosts / postsPerPage)}
                    className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                    <ArrowRight className="w-4 h-4 inline-block ml-2" />
                </button>
            </div>
        )}
      </div>

        {/* Post Options Dropdown */}
        {isPostOptionsOpen && selectedPost && (
            <div className="absolute top-0 right-0 mt-8 mr-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-md z-10">
                <button
                    onClick={handleDeletePost}
                    disabled={isDeleting}
                    className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700"
                >
                    {isDeleting ? (
                        <>
                            Deleting...
                            <Loader2 className="w-4 h-4 ml-2 animate-spin inline-block" />
                        </>
                    ) : (
                        <>
                            <Trash2 className="w-4 h-4 mr-2 inline-block" />
                            Delete Post
                        </>
                    )}
                </button>
                {deleteError && (
                    <div className="text-red-500 text-sm px-4 py-2" role="alert">
                        {deleteError}
                    </div>
                )}
            </div>
        )}

        {/* Share Modal */}
        {isShareModalOpen && selectedPost && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center">
                <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">Share Post</h3>
                    <div className="flex items-center justify-between mb-4">
                        <input
                            type="text"
                            value={shareLink}
                            readOnly
                            className="w-3/4 px-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleCopyLink}
                            className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {isCodeCopied ? (
                                <>
                                    Copied!
                                    <Check className="w-4 h-4 ml-2 inline-block" />
                                </>
                            ) : (
                                <>
                                    Copy Link
                                    <Copy className="w-4 h-4 ml-2 inline-block" />
                                </>
                            )}
                        </button>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <a
                            href={shareLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Open in New Tab
                            <ExternalLink className="w-4 h-4 ml-2 inline-block" />
                        </a>
                        <button
                            onClick={handleCloseShareModal}
                            className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ProfilePage;