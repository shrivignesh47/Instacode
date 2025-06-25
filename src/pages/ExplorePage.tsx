import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Users, Code, Award, Search, Plus, Loader2 } from 'lucide-react';
import { useForums } from '../hooks/useForums';
import { useCodingChallenges } from '../hooks/useCodingChallenges';
import ForumCard from '../components/ForumCard';
import CodingChallengeCard from '../components/CodingChallengeCard';
import CreateForumModal from '../components/CreateForumModal';
import { useAuth } from '../contexts/AuthContext';

const ExplorePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'forums' | 'challenges'>('forums');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForumModal, setShowCreateForumModal] = useState(false);
  
  // Fetch forums
  const { 
    forums, 
    loading: forumsLoading, 
    error: forumsError, 
    joinForum, 
    leaveForum, 
    refetch: refetchForums 
  } = useForums();
  
  // Fetch challenges
  const { 
    challenges, 
    loading: challengesLoading, 
    error: challengesError 
  } = useCodingChallenges(undefined, true); // Only active challenges

  // Filter forums and challenges based on search query
  const filteredForums = forums.filter(forum => 
    forum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    forum.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    forum.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChallenges = challenges.filter(challenge => 
    challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    challenge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (challenge.category && challenge.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (challenge.tags && challenge.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

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

  const handleForumClick = (forumId: string) => {
    navigate(`/forum/${forumId}`);
  };

  const handleChallengeClick = (challengeId: string) => {
    navigate(`/challenges/${challengeId}`);
  };

  const handleCreateForum = () => {
    setShowCreateForumModal(true);
  };

  const handleCreateChallenge = () => {
    navigate('/challenges/create');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Explore</h1>
        <p className="text-gray-400">Discover forums, join challenges, and connect with the developer community</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-8">
        <button
          onClick={() => setActiveTab('forums')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'forums'
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Forums</span>
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'challenges'
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Challenges</span>
        </button>
      </div>

      {/* Search and Create Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-auto sm:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        {activeTab === 'forums' ? (
          <button
            onClick={handleCreateForum}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Forum</span>
          </button>
        ) : (
          <button
            onClick={handleCreateChallenge}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Challenge</span>
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'forums' && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Hash className="w-5 h-5 text-purple-500 mr-2" />
            Developer Forums
          </h2>
          
          {forumsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mr-3" />
              <span className="text-white text-lg">Loading forums...</span>
            </div>
          ) : forumsError ? (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
              Error loading forums: {forumsError}
            </div>
          ) : filteredForums.length === 0 ? (
            <div className="text-center py-12">
              <Hash className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No forums found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery ? "Try adjusting your search query" : "No forums are available at the moment"}
              </p>
              <button
                onClick={handleCreateForum}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Your First Forum
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredForums.map((forum) => (
                <ForumCard
                  key={forum.id}
                  forum={forum}
                  onJoin={handleJoinForum}
                  onLeave={handleLeaveForum}
                  onClick={handleForumClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'challenges' && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Award className="w-5 h-5 text-yellow-500 mr-2" />
            Coding Challenges
          </h2>
          
          {challengesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mr-3" />
              <span className="text-white text-lg">Loading challenges...</span>
            </div>
          ) : challengesError ? (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
              Error loading challenges: {challengesError}
            </div>
          ) : filteredChallenges.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No challenges found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery ? "Try adjusting your search query" : "No active challenges are available at the moment"}
              </p>
              <button
                onClick={handleCreateChallenge}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create a Challenge
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredChallenges.map((challenge) => (
                <CodingChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  isParticipating={false}
                  onClick={() => handleChallengeClick(challenge.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Forum Modal */}
      <CreateForumModal
        isOpen={showCreateForumModal}
        onClose={() => setShowCreateForumModal(false)}
        onForumCreated={refetchForums}
      />
    </div>
  );
};

export default ExplorePage;