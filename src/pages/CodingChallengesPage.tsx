import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Award, 
  Trophy, 
  Calendar, 
  Users, 
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  Clock
} from 'lucide-react';
import { useCodingChallenges } from '../hooks/useCodingChallenges';
import { useAuth } from '../contexts/AuthContext';
import CodingChallengeCard from '../components/CodingChallengeCard';
import { useGlobalLeaderboard } from '../hooks/useCodingChallenges';

const CodingChallengesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');
  const [timeFrame, setTimeFrame] = useState<'all_time' | 'monthly' | 'weekly'>('all_time');
  
  // Determine if we should filter by active status based on the tab
  const isActiveFilter = activeTab === 'active' ? true : 
                         activeTab === 'upcoming' || activeTab === 'past' ? false : 
                         undefined;
  
  // Fetch challenges with filters
  const { challenges, loading, error } = useCodingChallenges(selectedCategory, isActiveFilter, searchQuery);
  
  // Fetch global leaderboard
  const { leaderboard, loading: leaderboardLoading, userRank } = useGlobalLeaderboard(timeFrame, 5);

  // Categories for filters
  const categories = [
    'Algorithms', 
    'Data Structures', 
    'Dynamic Programming', 
    'Strings', 
    'Math', 
    'Sorting', 
    'Greedy', 
    'Graphs', 
    'Trees'
  ];

  // Filter challenges based on the active tab
  const filteredChallenges = challenges.filter(challenge => {
    const now = new Date();
    
    if (activeTab === 'upcoming') {
      return challenge.start_date && new Date(challenge.start_date) > now;
    } else if (activeTab === 'past') {
      return challenge.end_date && new Date(challenge.end_date) < now;
    } else if (activeTab === 'active') {
      const hasStarted = !challenge.start_date || new Date(challenge.start_date) <= now;
      const hasNotEnded = !challenge.end_date || new Date(challenge.end_date) >= now;
      return hasStarted && hasNotEnded && challenge.is_active;
    }
    
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center">
          <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
          Coding Challenges
        </h1>
        <p className="text-gray-400">Participate in coding challenges, compete with others, and win prizes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-2 rounded-md font-medium transition-colors whitespace-nowrap text-sm ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              All Challenges
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-2 rounded-md font-medium transition-colors whitespace-nowrap text-sm ${
                activeTab === 'active'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-2 rounded-md font-medium transition-colors whitespace-nowrap text-sm ${
                activeTab === 'upcoming'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-3 py-2 rounded-md font-medium transition-colors whitespace-nowrap text-sm ${
                activeTab === 'past'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Past
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search challenges..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Filter Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center justify-between w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <span className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Desktop Filters */}
              <div className="hidden lg:block">
                {/* Category Filter */}
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || undefined)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile Filters (Expandable) */}
            {showFilters && (
              <div className="mt-4 space-y-3 lg:hidden">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || undefined)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Create Challenge Button */}
          <div className="flex justify-end">
            <button
              onClick={() => navigate('/challenges/create')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Challenge</span>
            </button>
          </div>

          {/* Challenges Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mr-3" />
              <span className="text-white text-lg">Loading challenges...</span>
            </div>
          ) : error ? (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
              Error loading challenges: {error}
            </div>
          ) : filteredChallenges.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No challenges found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || selectedCategory
                  ? "Try adjusting your filters or search query"
                  : activeTab === 'active'
                  ? "No active challenges at the moment"
                  : activeTab === 'upcoming'
                  ? "No upcoming challenges scheduled"
                  : activeTab === 'past'
                  ? "No past challenges found"
                  : "No challenges are available at the moment"}
              </p>
              <button
                onClick={() => navigate('/challenges/create')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create a Challenge</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredChallenges.map((challenge) => (
                <CodingChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  isParticipating={false} // This would need to be determined from user data
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width on large screens */}
        <div className="space-y-6">
          {/* Global Leaderboard */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white flex items-center">
                <Trophy className="w-4 h-4 text-yellow-500 mr-2" />
                Global Leaderboard
              </h3>
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value as 'all_time' | 'monthly' | 'weekly')}
                className="text-xs bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white"
              >
                <option value="all_time">All Time</option>
                <option value="monthly">This Month</option>
                <option value="weekly">This Week</option>
              </select>
            </div>
            
            <div className="p-4">
              {leaderboardLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-purple-500 animate-spin mr-2" />
                  <span className="text-gray-400 text-sm">Loading leaderboard...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No leaderboard data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div key={entry.user_id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          'bg-gray-700 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex items-center space-x-2">
                          <img
                            src={entry.profiles.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${entry.profiles.username}`}
                            alt={entry.profiles.username}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-white text-sm font-medium">{entry.profiles.display_name || entry.profiles.username}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm font-medium">{entry.total_points}</div>
                        <div className="text-gray-400 text-xs">{entry.problems_solved} solved</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {user && userRank && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between bg-gray-700 p-2 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                        {userRank}
                      </div>
                      <span className="text-white text-sm font-medium">You</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm font-medium">
                        {leaderboard.find(entry => entry.user_id === user.id)?.total_points || 0}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {leaderboard.find(entry => entry.user_id === user.id)?.problems_solved || 0} solved
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  View Full Leaderboard
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Challenges */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-700 border-b border-gray-600">
              <h3 className="text-sm font-medium text-white flex items-center">
                <Calendar className="w-4 h-4 text-blue-400 mr-2" />
                Upcoming Challenges
              </h3>
            </div>
            
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-purple-500 animate-spin mr-2" />
                  <span className="text-gray-400 text-sm">Loading challenges...</span>
                </div>
              ) : (
                <>
                  {challenges
                    .filter(challenge => challenge.start_date && new Date(challenge.start_date) > new Date())
                    .slice(0, 3)
                    .map(challenge => (
                      <div 
                        key={challenge.id}
                        onClick={() => navigate(`/challenges/${challenge.id}`)}
                        className="mb-3 last:mb-0 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                      >
                        <h4 className="text-white font-medium mb-1">{challenge.title}</h4>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>
                              {challenge.start_date && new Date(challenge.start_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>
                              {challenge.start_date && new Date(challenge.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {challenges.filter(challenge => challenge.start_date && new Date(challenge.start_date) > new Date()).length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm">No upcoming challenges</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingChallengesPage;