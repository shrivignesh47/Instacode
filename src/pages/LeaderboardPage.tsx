import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  Trophy, 
  Users, 
  Calendar, 
  Filter, 
  Search, 
  ArrowUp, 
  ArrowDown,
  Loader2,
  Medal,
  Crown,
  Star
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number;
  total_solved: number;
  rank: number;
  is_current_user: boolean;
}

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFrame, setTimeFrame] = useState<'all_time' | 'monthly' | 'weekly'>('all_time');
  const [sortBy, setSortBy] = useState<'points' | 'solved'>('points');
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFrame, sortBy]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, you would have a more sophisticated query
      // that takes into account the timeFrame (all_time, monthly, weekly)
      // For now, we'll just fetch all user_challenge_stats and aggregate them

      const { data: userStats, error: statsError } = await supabase
        .from('user_challenge_stats')
        .select(`
          user_id,
          points_earned,
          solved
        `);

      if (statsError) {
        throw statsError;
      }

      // Aggregate stats by user
      const userAggregates: Record<string, { total_points: number; total_solved: number }> = {};
      
      userStats?.forEach(stat => {
        if (!userAggregates[stat.user_id]) {
          userAggregates[stat.user_id] = { total_points: 0, total_solved: 0 };
        }
        
        userAggregates[stat.user_id].total_points += stat.points_earned || 0;
        if (stat.solved) {
          userAggregates[stat.user_id].total_solved += 1;
        }
      });

      // Fetch user profiles for the users with stats
      const userIds = Object.keys(userAggregates);
      
      if (userIds.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        throw profilesError;
      }

      // Combine profiles with stats and sort
      const combinedData = profiles?.map(profile => ({
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        total_points: userAggregates[profile.id]?.total_points || 0,
        total_solved: userAggregates[profile.id]?.total_solved || 0,
        is_current_user: profile.id === user?.id,
        rank: 0 // Will be set after sorting
      })) || [];

      // Sort by selected criteria
      combinedData.sort((a, b) => {
        if (sortBy === 'points') {
          return b.total_points - a.total_points;
        } else {
          return b.total_solved - a.total_solved;
        }
      });

      // Assign ranks
      combinedData.forEach((user, index) => {
        user.rank = index + 1;
        if (user.is_current_user) {
          setCurrentUserRank(index + 1);
        }
      });

      setLeaderboard(combinedData);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaderboard = leaderboard.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.display_name && user.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
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
          Leaderboard
        </h1>
        <p className="text-gray-400">See how you rank against other developers in coding challenges</p>
      </div>

      {/* Current User Rank */}
      {user && currentUserRank && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {currentUserRank}
              </div>
              <div>
                <h3 className="text-white font-medium">Your Ranking</h3>
                <p className="text-gray-400 text-sm">
                  You're ranked #{currentUserRank} out of {leaderboard.length} developers
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white">{leaderboard.find(u => u.is_current_user)?.total_points || 0}</div>
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

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'points' | 'solved')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="points">Points</option>
              <option value="solved">Challenges Solved</option>
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
              : "No users have completed any challenges yet"}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-700 bg-gray-700">
            <div className="col-span-1 text-gray-300 font-medium">Rank</div>
            <div className="col-span-5 text-gray-300 font-medium">User</div>
            <div className="col-span-3 text-gray-300 font-medium text-right">
              {sortBy === 'points' ? 'Points' : 'Solved'}
            </div>
            <div className="col-span-3 text-gray-300 font-medium text-right">
              {sortBy === 'points' ? 'Solved' : 'Points'}
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-700">
            {filteredLeaderboard.map((user) => (
              <div 
                key={user.id}
                className={`grid grid-cols-12 gap-4 p-4 hover:bg-gray-700 transition-colors cursor-pointer ${
                  user.is_current_user ? 'bg-purple-900 bg-opacity-20' : ''
                }`}
                onClick={() => handleUserClick(user.id, user.username)}
              >
                <div className="col-span-1 flex items-center">
                  {getRankIcon(user.rank)}
                </div>
                <div className="col-span-5 flex items-center space-x-3">
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${user.username}`}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-white font-medium">
                      {user.display_name || user.username}
                      {user.is_current_user && (
                        <span className="ml-2 text-xs bg-purple-600 px-2 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">@{user.username}</div>
                  </div>
                </div>
                <div className="col-span-3 flex items-center justify-end">
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {sortBy === 'points' ? user.total_points : user.total_solved}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {sortBy === 'points' ? 'points' : 'challenges'}
                    </div>
                  </div>
                </div>
                <div className="col-span-3 flex items-center justify-end">
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {sortBy === 'points' ? user.total_solved : user.total_points}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {sortBy === 'points' ? 'challenges' : 'points'}
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

export default LeaderboardPage;