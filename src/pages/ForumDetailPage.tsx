
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Users, MessageCircle, Pin, Search, TrendingUp, Clock, UserCheck, UserX } from 'lucide-react';
import { supabase, ForumWithMembership } from '../lib/supabaseClient';
import { useForumTopics } from '../hooks/useForumTopics';
import { useForums } from '../hooks/useForums';
import { useAuth } from '../contexts/AuthContext';
import CreateTopicModal from '../components/CreateTopicModal';

const ForumDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forum, setForum] = useState<ForumWithMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'replies' | 'views'>('recent');
  const [isCreateTopicModalOpen, setIsCreateTopicModalOpen] = useState(false);
  
  const { topics, loading: topicsLoading, refetch: refetchTopics } = useForumTopics(id);
  const { joinForum, leaveForum } = useForums();

  useEffect(() => {
    const fetchForum = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const { data: forumData, error } = await supabase
          .from('forums')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (user) {
          const { data: membership } = await supabase
            .from('forum_members')
            .select('forum_id')
            .eq('forum_id', id)
            .eq('user_id', user.id)
            .single();

          setForum({
            ...forumData,
            is_member: !!membership
          });
        } else {
          setForum(forumData);
        }
      } catch (error) {
        console.error('Error fetching forum:', error);
        navigate('/forums');
      } finally {
        setLoading(false);
      }
    };

    fetchForum();
  }, [id, user, navigate]);

  const handleJoinForum = async () => {
    if (!id || !forum) return;
    
    try {
      await joinForum(id);
      setForum(prev => prev ? { ...prev, is_member: true, members_count: prev.members_count + 1 } : null);
    } catch (error) {
      console.error('Failed to join forum:', error);
    }
  };

  const handleLeaveForum = async () => {
    if (!id || !forum) return;
    
    try {
      await leaveForum(id);
      setForum(prev => prev ? { ...prev, is_member: false, members_count: Math.max(0, prev.members_count - 1) } : null);
    } catch (error) {
      console.error('Failed to leave forum:', error);
    }
  };

  const filteredTopics = topics.filter(topic =>
    searchQuery === '' || 
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedTopics = [...filteredTopics].sort((a, b) => {
    switch (sortBy) {
      case 'replies':
        return b.replies_count - a.replies_count;
      case 'views':
        return b.views_count - a.views_count;
      case 'recent':
      default:
        return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
    }
  });

  const handleTopicClick = (topicId: string) => {
    navigate(`/topic/${topicId}`);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-white">Loading forum...</span>
        </div>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Forum Not Found</h2>
          <Link
            to="/forums"
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Back to Forums
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/forums')}
          className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Forums
        </button>
      </div>

      {/* Forum Header */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: forum.color }}
            >
              {forum.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{forum.name}</h1>
              <p className="text-gray-400">{forum.description}</p>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-3">
              {forum.is_member ? (
                <button
                  onClick={handleLeaveForum}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <UserX className="w-4 h-4" />
                  <span>Leave Forum</span>
                </button>
              ) : (
                <button
                  onClick={handleJoinForum}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Join Forum</span>
                </button>
              )}
              
              {forum.is_member && (
                <button
                  onClick={() => setIsCreateTopicModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Topic</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-6 text-sm text-gray-400">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{forum.members_count} members</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>{forum.topics_count} topics</span>
          </div>
          <div className="px-2 py-1 bg-gray-700 rounded-md text-xs">
            {forum.category}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics in this forum..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setSortBy('recent')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                sortBy === 'recent' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Recent</span>
            </button>
            <button
              onClick={() => setSortBy('replies')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                sortBy === 'replies' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Replies</span>
            </button>
            <button
              onClick={() => setSortBy('views')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                sortBy === 'views' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Views</span>
            </button>
          </div>
        </div>
      </div>

      {/* Topics */}
      {topicsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-white">Loading topics...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTopics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => handleTopicClick(topic.id)}
              className="bg-gray-800 rounded-lg border border-gray-700 p-4 lg:p-6 hover:border-gray-600 transition-colors cursor-pointer group"
            >
              <div className="flex items-start space-x-4">
                <img
                  src={topic.profiles.avatar_url || 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50'}
                  alt={topic.profiles.username}
                  className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {topic.is_pinned && (
                        <Pin className="w-4 h-4 text-yellow-500" />
                      )}
                      <h3 className="text-base lg:text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                        {topic.title}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {topic.content}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {topic.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-700 text-purple-400 text-xs rounded-md hover:bg-gray-600 cursor-pointer"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>by {topic.profiles.display_name || topic.profiles.username}</span>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{topic.replies_count} replies</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{topic.views_count} views</span>
                      </div>
                    </div>
                    <span>{new Date(topic.last_activity).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {sortedTopics.length === 0 && !topicsLoading && (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchQuery ? 'No topics found' : 'No topics yet'}
              </h3>
              <p className="text-gray-400 mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Be the first to start a discussion in this forum!'
                }
              </p>
              {!searchQuery && forum.is_member && (
                <button
                  onClick={() => setIsCreateTopicModalOpen(true)}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Create First Topic
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Topic Modal */}
      <CreateTopicModal
        isOpen={isCreateTopicModalOpen}
        onClose={() => {
          setIsCreateTopicModalOpen(false);
          refetchTopics();
        }}
        forumId={id}
        forumName={forum.name}
      />
    </div>
  );
};

export default ForumDetailPage;