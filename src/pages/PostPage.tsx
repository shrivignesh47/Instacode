
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, type PostWithUser } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';

const PostPage = () => {
  const { id: postId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<PostWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedPosts, setFeedPosts] = useState<PostWithUser[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError('Post ID is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: postData, error: postError } = await supabase
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

        if (postError || !postData) {
          throw new Error(postError?.message || 'Post not found.');
        }

        let postWithLike = postData;
        if (user) {
          const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();
          
          postWithLike = {
            ...postData,
            user_liked: !!likeData,
          };
        }

        setPost(postWithLike as PostWithUser);
      } catch (err: any) {
        console.error('Error fetching post:', err);
        setError(err.message || 'Failed to load post.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, user]);

  useEffect(() => {
    const fetchFeedPosts = async () => {
      if (!postId) return;

      try {
        setFeedLoading(true);
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
          .neq('id', postId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (postsError) {
          throw postsError;
        }

        let postsWithLikes = postsData || [];
        if (user && postsData) {
          const postIds = postsData.map(p => p.id);
          const { data: likesData } = await supabase
            .from('likes')
            .select('post_id')
            .in('post_id', postIds)
            .eq('user_id', user.id);

          const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
          
          postsWithLikes = postsData.map(post => ({
            ...post,
            user_liked: likedPostIds.has(post.id)
          }));
        }

        setFeedPosts(postsWithLikes as PostWithUser[]);
      } catch (err) {
        console.error('Error fetching feed posts:', err);
      } finally {
        setFeedLoading(false);
      }
    };

    if (post) {
      fetchFeedPosts();
    }
  }, [postId, user, post]);

  const handlePostUpdate = (updatedPost: PostWithUser) => {
    if (post && post.id === updatedPost.id) {
      setPost(updatedPost);
    }
    setFeedPosts(prevPosts =>
      prevPosts.map(p => (p.id === updatedPost.id ? updatedPost : p))
    );
  };

  const handlePostDeleted = (deletedPostId: string) => {
    if (post && post.id === deletedPostId) {
      setPost(null);
      setError("This post has been deleted.");
    }
    setFeedPosts(prevPosts => prevPosts.filter(p => p.id !== deletedPostId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-lg">Loading post...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-2 lg:px-0">
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 my-6">
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-2 lg:px-0 py-6">
      {post ? (
        <PostCard
          key={post.id}
          post={post}
          onPostUpdate={handlePostUpdate}
          onPostDeleted={handlePostDeleted}
        />
      ) : (
        <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-400 mb-2">Post not found</h3>
            <p className="text-gray-500">This post may have been deleted or the link is incorrect.</p>
        </div>
      )}

      {post && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-6 px-2 lg:px-0">More Posts</h2>
          {feedLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white text-lg">Loading feed...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {feedPosts.map(feedPost => (
                <PostCard
                  key={feedPost.id}
                  post={feedPost}
                  onPostUpdate={handlePostUpdate}
                  onPostDeleted={handlePostDeleted}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostPage;