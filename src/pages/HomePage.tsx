import { useState, useEffect } from 'react';
import { Plus, Code, Image, Video, FolderOpen } from 'lucide-react';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import DailyChallengeWidget from '../components/DailyChallengeWidget';
import ChallengeStatsDashboard from '../components/ChallengeStatsDashboard';
import { supabase, type PostWithUser } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<'code' | 'image' | 'video' | 'project'>('code');
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch posts from Supabase
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch posts with user profile information and like status
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
        .order('created_at', { ascending: false });

      if (postsError) {
        throw postsError;
      }

      // If user is logged in, check which posts they've liked
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
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchPosts();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Fetch the new post with profile information
            fetchNewPost(payload.new.id);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing post
            setPosts(prevPosts => 
              prevPosts.map(post => 
                post.id === payload.new.id 
                  ? { ...post, ...payload.new }
                  : post
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted post
            setPosts(prevPosts => 
              prevPosts.filter(post => post.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Subscribe to likes changes
    const likesChannel = supabase
      .channel('likes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes'
        },
        (payload) => {
          console.log('Likes update:', payload);
          // The trigger will update the post counts automatically
          // We just need to refresh the specific post
          if ((payload.new as any)?.post_id || (payload.old as any)?.post_id) {
            const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
            refreshPost(postId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(likesChannel);
    };
  }, [user]);

  // Fetch a new post with profile information
  const fetchNewPost = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching new post:', error);
        return;
      }

      // Check if user liked this post
      let postWithLike = data;
      if (user) {
        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();

        postWithLike = {
          ...data,
          user_liked: !!likeData
        };
      }

      setPosts(prevPosts => [postWithLike as PostWithUser, ...prevPosts]);
    } catch (err) {
      console.error('Error fetching new post:', err);
    }
  };

  // Refresh a specific post
  const refreshPost = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error refreshing post:', error);
        return;
      }

      // Check if user liked this post
      let postWithLike = data;
      if (user) {
        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();

        postWithLike = {
          ...data,
          user_liked: !!likeData
        };
      }

      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId ? postWithLike as PostWithUser : post
        )
      );
    } catch (err) {
      console.error('Error refreshing post:', err);
    }
  };

  const handleCreatePost = (type: 'code' | 'image' | 'video' | 'project') => {
    setSelectedPostType(type);
    setShowCreateModal(true);
  };

  const handlePostCreated = () => {
    // The real-time subscription will handle adding the new post
    setShowCreateModal(false);
  };

  const handlePostUpdate = (updatedPost: PostWithUser) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.filter(post => post.id !== postId)
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-0">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white text-lg">Loading posts...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-0">
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-200">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed - 2/3 width on large screens */}
        <div className="lg:col-span-2">
          {/* Create Post Section */}
          <div className="bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 border border-gray-700">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
              <img
                src={user?.avatar || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50'}
                alt="Your avatar"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
              />
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Share your code, project, or thoughts...
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:flex lg:space-x-2 lg:gap-0">
              <button
                onClick={() => handleCreatePost('code')}
                className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-xs sm:text-sm lg:text-base"
              >
                <Code className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Code</span>
              </button>
              <button
                onClick={() => handleCreatePost('image')}
                className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs sm:text-sm lg:text-base"
              >
                <Image className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Image</span>
              </button>
              <button
                onClick={() => handleCreatePost('video')}
                className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs sm:text-sm lg:text-base"
              >
                <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Video</span>
              </button>
              <button
                onClick={() => handleCreatePost('project')}
                className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs sm:text-sm lg:text-base"
              >
                <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Project</span>
              </button>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4 sm:space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-400 mb-2">No posts yet</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Be the first to share something with the community!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onPostUpdate={handlePostUpdate}
                  onPostDeleted={handlePostDeleted}
                />
              ))
            )}
          </div>

          {/* Load More */}
          {posts.length > 0 && (
            <div className="text-center mt-6 sm:mt-8">
              <button className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm sm:text-base">
                Load More Posts
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar - 1/3 width on large screens */}
        <div className="space-y-6">
          {/* Daily Challenge Widget */}
          <DailyChallengeWidget />
          
          {/* Challenge Stats Dashboard */}
          {user && <ChallengeStatsDashboard isCompact={true} />}
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
        initialType={selectedPostType}
      />
    </div>
  );
};

export default HomePage;