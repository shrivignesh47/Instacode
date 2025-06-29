import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageCircle, 
  Users, 
  Plus, 
  Search, 
  Pin, 
  Clock, 
  Eye, 
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import CreateTopicModal from '../components/CreateTopicModal';
import ForumMembersList from '../components/ForumMembersList';

const ForumDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forum, setForum] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateTopicModalOpen, setIsCreateTopicModalOpen] = useState(false);
  const [isMembersListOpen, setIsMembersListOpen] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchForumDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch forum details
        const { data: forumData, error: forumError } = await supabase
          .from('forums')
          .select('*')
          .eq('id', id)
          .single();
          
        if (forumError) {
          throw forumError;
        }
        
        setForum(forumData);
        
        // Check if user is a member
        if (user) {
          const { data: memberData, error: memberError } = await supabase
            .from('forum_members')
            .select('id')
            .eq('forum_id', id)
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (!memberError) {
            setIsMember(!!memberData);
          }
        }
        
        // Fetch forum topics
        const { data: topicsData, error: topicsError } = await supabase
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
          .eq('forum_id', id)
          .order(sortBy === 'recent' ? 'last_activity' : 'views_count', { ascending: false });
          
        if (topicsError) {
          throw topicsError;
        }
        
        setTopics(topicsData || []);
      } catch (err: any) {
        console.error('Error fetching forum details:', err);
        setError(err.message || 'Failed to load forum details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchForumDetails();
  }, [id, user, sortBy]);

  const handleJoinForum = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      setIsJoining(true);
      
      if (isMember) {
        // Leave forum
        const { error } = await supabase
          .from('forum_members')
          .delete()
          .eq('forum_id', id)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        // Update forum member count
        await supabase
          .from('forums')
          .update({ members_count: Math.max(0, forum.members_count - 1) })
          .eq('id', id);
          
        setIsMember(false);
        setForum({ ...forum, members_count: Math.max(0, forum.members_count - 1) });
      } else {
        // Join forum
        const { error } = await supabase
          .from('forum_members')
          .insert({
            forum_id: id,
            user_id: user.id
          });
          
        if (error) throw error;
        
        // Update forum member count
        await supabase
          .from('forums')
          .update({ members_count: (forum.members_count || 0) + 1 })
          .eq('id', id);
          
        setIsMember(true);
        setForum({ ...forum, members_count: (forum.members_count || 0) + 1 });
      }
    } catch (err: any) {
      console.error('Error joining/leaving forum:', err);
      alert('Failed to join/leave forum. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateTopic = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!isMember) {
      alert('You need to join this forum to create a topic');
      return;
    }
    
    setIsCreateTopicModalOpen(true);
  };

  const handleTopicClick = (topicId: string) => {
    navigate(`/topic/${topicId}`);
  };

  const filteredTopics = topics.filter(topic => 
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (topic.tags && topic.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mr-3" />
        <span className="text-white text-lg">Loading forum...</span>
      </div>
    );
  }

  if (error || !forum) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8">
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-200">{error || 'Forum not found'}</span>
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
          onClick={() => navigate('/forums')}
          className="flex items-center text-purple-400 hover:text-purple-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forums
        </button>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: forum.color }}
              >
                {forum.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{forum.name}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span className="px-2 py-1 bg-gray-700 rounded-md">{forum.category}</span>
                  <span>•</span>
                  <span>{forum.members_count} members</span>
                  <span>•</span>
                  <span>{forum.topics_count} topics</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMembersListOpen(true)}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
              >
                <Users className="w-4 h-4" />
                <span>Members</span>
              </button>
              
              <button
                onClick={handleJoinForum}
                disabled={isJoining}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                  isMember
                    ? 'bg-green-600 hover:bg-red-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isJoining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isMember ? <Users className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{isMember ? 'Joined' : 'Join Forum'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <p className="text-gray-300 mt-4">{forum.description}</p>
        </div>
      </div>

      {/* Topics Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-white">Topics</h2>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateTopic}
              className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Topic</span>
            </button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center justify-between w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <span className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center space-x-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular')}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Mobile Filters (Expandable) */}
          {showFilters && (
            <div className="mt-4 space-y-3 sm:hidden">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular')}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Topics List */}
        {filteredTopics.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No topics found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? "Try adjusting your search query"
                : "Be the first to start a discussion in this forum"}
            </p>
            <button
              onClick={handleCreateTopic}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create First Topic
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={topic.profiles.avatar_url || 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50'}
                    alt={topic.profiles.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {topic.is_pinned && (
                          <Pin className="w-4 h-4 text-yellow-500" />
                        )}
                        <h3 className="text-lg font-semibold text-white">{topic.title}</h3>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(topic.last_activity)}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{topic.content}</p>
                    
                    {topic.tags && topic.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
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
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>by {topic.profiles.display_name || topic.profiles.username}</span>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{topic.replies_count} replies</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{topic.views_count} views</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Last activity: {formatDate(topic.last_activity)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Topic Modal */}
      <CreateTopicModal
        isOpen={isCreateTopicModalOpen}
        onClose={() => setIsCreateTopicModalOpen(false)}
        forumId={id}
        forumName={forum.name}
      />

      {/* Forum Members List Modal */}
      <ForumMembersList
        forumId={id || ''}
        isOpen={isMembersListOpen}
        onClose={() => setIsMembersListOpen(false)}
      />
    </div>
  );
};

export default ForumDetailPage;