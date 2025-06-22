import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Search, 
  Calendar, 
  Medal, 
  Crown, 
  Star,
  Loader2,
  User
} from 'lucide-react';
import { useGlobalLeaderboard } from '../hooks/useCodingChallenges';
import { useAuth } from '../contexts/AuthContext';

const GlobalLeaderboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFrame, setTimeFrame] = useState<'all_time' | 'monthly' | 'weekly'>('all_time');
  
  const { leaderboard, loading, error, userRank } = useGlobalLeaderboard(timeFrame);

  const filteredLeaderboard = leaderboard.filter(entry => 
    entry.profiles.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.profiles.display_name && entry.profiles.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleUserClick = (userId: string, username: string) => {
    navigate(`/profile/${username}`);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Crown className="w-5 h-5 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="w-5 h-5 text-gray-300" />;
    } else if (rank === 3) {
      return <Medal className="w-5 h-5 text-amber-600" />;
    } else if (rank <= 10) {
      return <Star className="w-5 h-5 text-purple-400" />;
    } else {
      return <span className="text-gray-400 font-medium">{rank}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center">
          <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
          Global Leaderboard
        </h1>
        <p className="text-gray-400">See how you rank against other developers in solving coding problems</p>
      </div>

      {/* Current User Rank */}
      {user && userRank && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {userRank}
              </div>
              <div>
                <h3 className="text-white font-medium">Your Ranking</h3>
                <p className="text-gray-400 text-sm">
                  You're ranked #{userRank} out of {leaderboard.length} developers
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">
                {leaderboard.find(entry => entry.user_id === user.id)?.total_points || 0}
              </div>
              <div className="text-gray-400 text-sm">points earned</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Time Frame */}
          <div>
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value as 'all_time' | 'monthly' | 'weekly')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all_time">All Time</option>
              <option value="monthly">This Month</option>
              <option value="weekly">This Week</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mr-3" />
          <span className="text-white text-lg">Loading leaderboard...</span>
        </div>
      ) : error ? (
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      ) : filteredLeaderboard.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No users found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery
              ? "No users match your search criteria"
              : "No users have completed any problems yet"}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-700 bg-gray-700">
            <div className="col-span-1 text-gray-300 font-medium">Rank</div>
            <div className="col-span-5 text-gray-300 font-medium">User</div>
            <div className="col-span-3 text-gray-300 font-medium text-right">
              Problems Solved
            </div>
            <div className="col-span-3 text-gray-300 font-medium text-right">
              Total Points
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-700">
            {filteredLeaderboard.map((entry) => (
              <div 
                key={entry.user_id}
                className={`grid grid-cols-12 gap-4 p-4 hover:bg-gray-700 transition-colors cursor-pointer ${
                  user && entry.user_id === user.id ? 'bg-purple-900 bg-opacity-20' : ''
                }`}
                onClick={() => handleUserClick(entry.user_id, entry.profiles.username)}
              >
                <div className="col-span-1 flex items-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="col-span-5 flex items-center space-x-3">
                  <img
                    src={entry.profiles.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${entry.profiles.username}`}
                    alt={entry.profiles.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-white font-medium">
                      {entry.profiles.display_name || entry.profiles.username}
                      {user && entry.user_id === user.id && (
                        <span className="ml-2 text-xs bg-purple-600 px-2 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">@{entry.profiles.username}</div>
                  </div>
                </div>
                <div className="col-span-3 flex items-center justify-end">
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {entry.problems_solved}
                    </div>
                    <div className="text-gray-400 text-sm">
                      problems
                    </div>
                  </div>
                </div>
                <div className="col-span-3 flex items-center justify-end">
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {entry.total_points}
                    </div>
                    <div className="text-gray-400 text-sm">
                      points
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalLeaderboardPage;