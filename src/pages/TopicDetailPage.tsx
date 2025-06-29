import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageCircle, 
  Users, 
  Plus, 
  Clock, 
  Eye, 
  Heart,
  Share,
  Bookmark,
  Send,
  Loader2,
  AlertCircle,
  Pin
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface TopicReply {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const TopicDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState<any>(null);
  const [forum, setForum] = useState<any>(null);
  const [replies, setReplies] = useState<TopicReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchTopicDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch topic details
        const { data: topicData, error: topicError } = await supabase
          .from('forum_topics')
          .select(`
            *,
            profiles (
              id,
              username,
              display_name,
              avatar_url
            ),
            forums (
              id,
              name,
              category,
              color
            )
          `)
          .eq('id', id)
          .single();
          
        if (topicError) {
          throw topicError;
        }
        
        setTopic(topicData);
        setForum(topicData.forums);
        
        // Increment view count
        await supabase
          .from('forum_topics')
          .update({ views_count: (topicData.views_count || 0) + 1 })
          .eq('id', id);
        
        // Check if user is a forum member
        if (user) {
          const { data: memberData, error: memberError } = await supabase
            .from('forum_members')
            .select('id')
            .eq('forum_id', topicData.forum_id)
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (!memberError) {
            setIsMember(!!memberData);
          }
        }
        
        // Fetch topic replies
        const { data: repliesData, error: repliesError } = await supabase
          .from('forum_replies')
          .select(`
            *,
            profiles (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('topic_id', id)
          .order('created_at', { ascending: true });
          
        if (repliesError) {
          throw repliesError;
        }
        
        setReplies(repliesData || []);
      } catch (err: any) {
        console.error('Error fetching topic details:', err);
        setError(err.message || 'Failed to load topic details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopicDetails();
    
    // Set up real-time subscription for new replies
    const channel = supabase
      .channel('forum_replies_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_replies',
          filter: `topic_id=eq.${id}`
        },
        (payload) => {
          // Fetch the complete reply with profile info
          supabase
            .from('forum_replies')
            .select(`
              *,
              profiles (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setReplies(prev => [...prev, data as TopicReply]);
                
                // Update topic's reply count and last activity
                setTopic(prev => ({
                  ...prev,
                  replies_count: (prev.replies_count || 0) + 1,
                  last_activity: new Date().toISOString()
                }));
              }
            });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!replyContent.trim()) {
      return;
    }
    
    if (!isMember) {
      alert('You need to join this forum to reply to topics');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Insert reply
      const { error: replyError } = await supabase
        .from('forum_replies')
        .insert({
          topic_id: id,
          user_id: user.id,
          content: replyContent.trim()
        });
        
      if (replyError) throw replyError;
      
      // Update topic's last activity
      await supabase
        .from('forum_topics')
        .update({ 
          last_activity: new Date().toISOString(),
          replies_count: (topic.replies_count || 0) + 1
        })
        .eq('id', id);
      
      // Clear reply input
      setReplyContent('');
    } catch (err: any) {
      console.error('Error submitting reply:', err);
      alert('Failed to submit reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mr-3" />
        <span className="text-white text-lg">Loading topic...</span>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8">
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-200">{error || 'Topic not found'}</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/forums')}
          className="flex items-center text-purple-400 hover:text-purple-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forums
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/forum/${topic.forum_id}`)}
          className="flex items-center text-purple-400 hover:text-purple-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {forum?.name || 'Forum'}
        </button>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {topic.is_pinned && (
                <Pin className="w-5 h-5 text-yellow-500" />
              )}
              <h1 className="text-2xl font-bold text-white">{topic.title}</h1>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{topic.views_count || 0} views</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{topic.replies_count || 0} replies</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={topic.profiles.avatar_url || 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50'}
              alt={topic.profiles.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="text-white font-medium">{topic.profiles.display_name || topic.profiles.username}</div>
              <div className="text-gray-400 text-sm">Posted {formatDate(topic.created_at)}</div>
            </div>
          </div>
          
          <div className="text-gray-300 whitespace-pre-line mb-4">{topic.content}</div>
          
          {topic.tags && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {topic.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-700 text-purple-400 text-xs rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center space-x-4 text-gray-400">
            <button className="flex items-center space-x-1 hover:text-red-400 transition-colors">
              <Heart className="w-4 h-4" />
              <span>Like</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-green-400 transition-colors">
              <Share className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-yellow-400 transition-colors">
              <Bookmark className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Replies Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Replies ({replies.length})</h2>
        
        {replies.length === 0 ? (
          <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No replies yet</p>
            <p className="text-gray-500 text-sm">Be the first to reply to this topic</p>
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <div key={reply.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={reply.profiles.avatar_url || 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50'}
                    alt={reply.profiles.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-white font-medium">{reply.profiles.display_name || reply.profiles.username}</div>
                    <div className="text-gray-400 text-sm">{formatDate(reply.created_at)}</div>
                  </div>
                </div>
                
                <div className="text-gray-300 whitespace-pre-line mb-3">{reply.content}</div>
                
                <div className="flex items-center space-x-4 text-gray-400">
                  <button className="flex items-center space-x-1 hover:text-red-400 transition-colors">
                    <Heart className="w-4 h-4" />
                    <span>Like</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Form */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Post a Reply</h3>
        
        {!user ? (
          <div className="text-center py-6">
            <p className="text-gray-400 mb-3">You need to be logged in to reply</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Log In
            </button>
          </div>
        ) : !isMember ? (
          <div className="text-center py-6">
            <p className="text-gray-400 mb-3">You need to join this forum to reply</p>
            <button
              onClick={() => navigate(`/forum/${topic.forum_id}`)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Join Forum
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitReply}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
              rows={5}
              required
              disabled={isSubmitting}
            />
            
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={isSubmitting || !replyContent.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Post Reply</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TopicDetailPage;