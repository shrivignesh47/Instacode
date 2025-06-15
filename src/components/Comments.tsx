
import React, { useState, useEffect } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface CommentsProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  commentsCount: number;
  onCommentsCountChange: (count: number) => void;
}

const Comments: React.FC<CommentsProps> = ({ 
  postId, 
  isOpen, 
  onClose, 
  commentsCount,
  onCommentsCountChange 
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setComments(data as Comment[]);
      onCommentsCountChange(data.length);
    } catch (err: any) {
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, postId]);

  // Real-time subscription for comments
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel(`comments_${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        async (payload) => {
          // Fetch the new comment with profile data
          const { data } = await supabase
            .from('comments')
            .select(`
              *,
              profiles (
                username,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setComments(prev => [...prev, data as Comment]);
            onCommentsCountChange(comments.length + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, postId, comments.length]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to comment');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          post_id: postId,
          user_id: user.id
        });

      if (insertError) {
        throw insertError;
      }

      setNewComment('');
    } catch (err: any) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="mt-4 border-t border-gray-600 bg-gray-800 rounded-b-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-700 rounded-t-xl">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">
            Comments ({commentsCount})
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-600 transition-colors"
        >
          Hide
        </button>
      </div>

      {/* Comments List */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        ) : comments.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-400 text-sm">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <img
                  src={comment.profiles.avatar_url || 'https://images.pexels.com/photos/1716861/pexels-photo-1716861.jpeg?auto=compress&cs=tinysrgb&w=150'}
                  alt={comment.profiles.username}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-white text-sm">
                      {comment.profiles.username}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="p-4 border-t border-gray-600">
          <div className="flex space-x-3">
            <img
              src={user.avatar || 'https://images.pexels.com/photos/1716861/pexels-photo-1716861.jpeg?auto=compress&cs=tinysrgb&w=150'}
              alt="Your avatar"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="flex items-center justify-center px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="px-4 py-3 bg-gray-700 text-center rounded-b-xl">
          <p className="text-gray-300 text-sm">
            Please log in to comment
          </p>
        </div>
      )}
    </div>
  );
};

export default Comments;