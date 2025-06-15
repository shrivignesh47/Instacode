
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Users, Calendar, Tag, Send, Reply } from 'lucide-react';
import { supabase, ForumTopicWithUser } from '../lib/supabaseClient';
import { useForumReplies } from '../hooks/useForumReplies';
import { useAuth } from '../contexts/AuthContext';

const TopicPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState<ForumTopicWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { replies, loading: repliesLoading, createReply } = useForumReplies(id);

  useEffect(() => {
    const fetchTopic = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const { data, error: topicError } = await supabase
          .from('forum_topics')
          .select(`
            *,
            profiles (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('id', id)
          .single();

        if (topicError) throw topicError;

        setTopic(data);

        // Increment view count
        await supabase
          .from('forum_topics')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', id);

      } catch (err) {
        console.error('Error fetching topic:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch topic');
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [id]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      setIsSubmitting(true);
      await createReply(replyContent);
      setReplyContent('');
      
      // Update topic's reply count and last activity in local state
      if (topic) {
        setTopic(prev => prev ? {
          ...prev,
          replies_count: prev.replies_count + 1,
          last_activity: new Date().toISOString()
        } : null);
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Failed to create reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-0 py-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-white">Loading topic...</span>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-0 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Topic Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The topic you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/forums')}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Back to Forums
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-0 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/forums')}
          className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forums
        </button>
      </div>

      {/* Topic Content */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
        <div className="flex items-start space-x-4 mb-4">
          <img
            src={topic.profiles.avatar_url || 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50'}
            alt={topic.profiles.username}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{topic.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
              <span>asked by {topic.profiles.display_name || topic.profiles.username}</span>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(topic.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{topic.replies_count} {topic.replies_count === 1 ? 'answer' : 'answers'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{topic.views_count} views</span>
              </div>
            </div>
          </div>
        </div>

        <div className="prose prose-invert max-w-none mb-4">
          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {topic.content}
          </div>
        </div>

        {topic.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topic.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-blue-100 text-sm rounded-md hover:bg-blue-700 cursor-pointer"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Answers Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {replies.length} {replies.length === 1 ? 'Answer' : 'Answers'}
          </h2>
          <div className="text-sm text-gray-400">
            Sorted by: <span className="text-purple-400">Oldest first</span>
          </div>
        </div>

        {repliesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-white">Loading answers...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {replies.map((reply, index) => (
              <div key={reply.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={reply.profiles.avatar_url || 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50'}
                    alt={reply.profiles.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-white">
                          {reply.profiles.display_name || reply.profiles.username}
                        </span>
                        <span className="text-sm text-gray-400">
                          answered {new Date(reply.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {reply.content}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {replies.length === 0 && !repliesLoading && (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <Reply className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No answers yet</h3>
            <p className="text-gray-400">Be the first to answer this question!</p>
          </div>
        )}
      </div>

      {/* Answer Form */}
      {user ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Your Answer</h3>
          <form onSubmit={handleSubmitReply} className="space-y-4">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your answer here... Be detailed and provide examples if possible."
              rows={6}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
              required
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">
                <strong>Tips:</strong> Provide clear explanations, include code examples, and be respectful.
              </p>
              <button
                type="submit"
                disabled={!replyContent.trim() || isSubmitting}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Posting Answer...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post Your Answer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
          <p className="text-gray-400 mb-4">You must be logged in to answer this question.</p>
          <Link
            to="/login"
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors inline-block"
          >
            Login to Answer
          </Link>
        </div>
      )}
    </div>
  );
};

export default TopicPage;