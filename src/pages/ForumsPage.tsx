import { useState } from 'react';
import { Users, MessageCircle, Plus, Search, TrendingUp, Clock, Pin, AlertCircle } from 'lucide-react';
import { useForums } from '../hooks/useForums';
import { useForumTopics } from '../hooks/useForumTopics';
import CreateTopicModal from '../components/CreateTopicModal';
import CreateForumModal from '../components/CreateForumModal';
import ForumCard from '../components/ForumCard';
import ForumMembersList from '../components/ForumMembersList';
import { useNavigate } from 'react-router-dom';

const ForumsPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateTopicModalOpen, setIsCreateTopicModalOpen] = useState(false);
  const [isCreateForumModalOpen, setIsCreateForumModalOpen] = useState(false);
  const [selectedForum, setSelectedForum] = useState<string | null>(null);
  const [isMembersListOpen, setIsMembersListOpen] = useState(false);
  const [selectedForumForMembers, setSelectedForumForMembers] = useState<string | null>(null);
  const navigate = useNavigate();

  const { forums, loading: forumsLoading, joinForum, leaveForum, error: forumsError, refetch } = useForums();
  const { topics, loading: topicsLoading, error: topicsError } = useForumTopics();

  console.log('Forums data:', forums);
  console.log('Topics data:', topics);
  console.log('Forums error:', forumsError);
  console.log('Topics error:', topicsError);

  const categories = [
    { id: 'all', name: 'All Forums', count: forums.length },
    { id: 'frontend', name: 'Frontend', count: forums.filter(f => f.category === 'frontend').length },
    { id: 'backend', name: 'Backend', count: forums.filter(f => f.category === 'backend').length },
    { id: 'mobile', name: 'Mobile', count: forums.filter(f => f.category === 'mobile').length },
    { id: 'devops', name: 'DevOps', count: forums.filter(f => f.category === 'devops').length },
    { id: 'ai', name: 'AI/ML', count: forums.filter(f => f.category === 'ai').length },
    { id: 'web3', name: 'Web3', count: forums.filter(f => f.category === 'web3').length },
    { id: 'career', name: 'Career', count: forums.filter(f => f.category === 'career').length },
    { id: 'others', name: 'Others', count: forums.filter(f => f.category === 'others').length },
  ];

  const handleJoinForum = async (forumId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await joinForum(forumId);
    } catch (error) {
      console.error('Failed to join forum:', error);
    }
  };

  const handleLeaveForum = async (forumId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await leaveForum(forumId);
    } catch (error) {
      console.error('Failed to leave forum:', error);
    }
  };

  const openCreateTopicModal = (forumId?: string) => {
    if (forums.length === 0) {
      alert('Please create forums first!');
      return;
    }
    setSelectedForum(forumId || null);
    setIsCreateTopicModalOpen(true);
  };

  const handleTopicClick = (topicId: string) => {
    navigate(`/topic/${topicId}`);
  };

  const handleForumCreated = () => {
    refetch();
  };

  const handleForumClick = (forumId: string) => {
    navigate(`/forum/${forumId}`);
  };

  const handleViewMembers = (forumId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedForumForMembers(forumId);
    setIsMembersListOpen(true);
  };

  if (forumsLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-white">Loading forums...</span>
        </div>
      </div>
    );
  }

  if (forumsError) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8">
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-200">Error loading forums: {forumsError}</span>
          </div>
        </div>
      </div>
    );
  }

  if (forums.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Forums Found</h2>
          <p className="text-gray-400 mb-6">
            It looks like no forums have been created yet. Please run the SQL queries in your Supabase database to create the forum tables and sample data.
          </p>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-white mb-3">Next Steps:</h3>
            <ol className="text-left text-gray-300 space-y-2">
              <li>1. Go to your Supabase dashboard</li>
              <li>2. Navigate to the SQL Editor</li>
              <li>3. Run the forum creation SQL queries provided earlier</li>
              <li>4. Refresh this page</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Developer Forums</h1>
        <p className="text-gray-400">Join discussions, ask questions, and share knowledge with the community</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 space-y-6">
          {/* Create Buttons */}
          <div className="space-y-3">
            <button 
              onClick={() => openCreateTopicModal()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Topic</span>
            </button>
            
            <button 
              onClick={() => setIsCreateForumModalOpen(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Forum</span>
            </button>
          </div>

          {/* Categories */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
                    activeCategory === category.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search and Filters */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics, tags, or content..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <button className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>Trending</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Recent</span>
                </button>
              </div>
            </div>
          </div>

          {/* Forums Grid using ForumCard */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {activeCategory === 'all' ? 'All Forums' : `${categories.find(c => c.id === activeCategory)?.name} Forums`}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forums.filter(forum => activeCategory === 'all' || forum.category === activeCategory).map((forum) => (
                <div key={forum.id} className="relative">
                  <ForumCard
                    forum={forum}
                    onJoin={handleJoinForum}
                    onLeave={handleLeaveForum}
                    onClick={handleForumClick}
                  />
                  <button
                    onClick={(e) => handleViewMembers(forum.id, e)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 rounded"
                    title="View members"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Topics */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Recent Topics</h2>
            {topicsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-white">Loading topics...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {topics.slice(0, 5).map((topic) => {
                  const topicForum = forums.find(f => f.id === topic.forum_id);
                  return (
                    <div
                      key={topic.id}
                      onClick={() => handleTopicClick(topic.id)}
                      className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors cursor-pointer group"
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
                              <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                                {topic.title}
                              </h3>
                            </div>
                          </div>
                          
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                            {topic.content}
                          </p>

                          {topicForum && (
                            <div className="mb-3">
                              <span className="inline-flex items-center px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded-md">
                                {topicForum.name}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span>by {topic.profiles.display_name || topic.profiles.username}</span>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{topic.replies_count} replies</span>
                              </div>
                            </div>
                            <span>{new Date(topic.last_activity).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Topic Modal */}
      <CreateTopicModal
        isOpen={isCreateTopicModalOpen}
        onClose={() => setIsCreateTopicModalOpen(false)}
        forumId={selectedForum || undefined}
        forumName={selectedForum ? forums.find(f => f.id === selectedForum)?.name : undefined}
      />

      {/* Create Forum Modal */}
      <CreateForumModal
        isOpen={isCreateForumModalOpen}
        onClose={() => setIsCreateForumModalOpen(false)}
        onForumCreated={handleForumCreated}
      />

      {/* Forum Members List Modal */}
      <ForumMembersList
        forumId={selectedForumForMembers || ''}
        isOpen={isMembersListOpen}
        onClose={() => {
          setIsMembersListOpen(false);
          setSelectedForumForMembers(null);
        }}
      />
    </div>
  );
};

export default ForumsPage;