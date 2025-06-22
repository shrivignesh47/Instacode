import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trophy, 
  Calendar, 
  Clock, 
  Users, 
  Award, 
  CheckCircle, 
  XCircle,
  Loader2,
  Play,
  User,
  BarChart,
  Medal
} from 'lucide-react';
import { useCodingChallenge, useChallengeLeaderboard } from '../hooks/useCodingChallenges';
import { useAuth } from '../contexts/AuthContext';
import ProblemCard from '../components/ProblemCard';
import { getDifficultyColor } from '../utils/problemUtils';

const CodingChallengeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { challenge, loading, error } = useCodingChallenge(id);
  const { leaderboard, loading: leaderboardLoading, userRank } = useChallengeLeaderboard(id);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'problems' | 'leaderboard'>('overview');

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mr-3" />
        <span className="text-white text-lg">Loading challenge...</span>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8">
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
          {error || 'Challenge not found'}
        </div>
        <button
          onClick={() => navigate('/challenges')}
          className="mt-4 flex items-center text-purple-400 hover:text-purple-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Challenges
        </button>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isActive = challenge.is_active;
  const hasStarted = challenge.start_date ? new Date(challenge.start_date) <= new Date() : true;
  const hasEnded = challenge.end_date ? new Date(challenge.end_date) < new Date() : false;
  
  const getStatusBadge = () => {
    if (!isActive) return { text: 'Inactive', color: 'bg-gray-600 text-gray-300' };
    if (!hasStarted) return { text: 'Upcoming', color: 'bg-blue-600 text-blue-100' };
    if (hasEnded) return { text: 'Ended', color: 'bg-red-600 text-red-100' };
    return { text: 'Active', color: 'bg-green-600 text-green-100' };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0 pb-12">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/challenges')}
          className="flex items-center text-purple-400 hover:text-purple-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Challenges
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{challenge.title}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                {statusBadge.text}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {challenge.difficulty && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty}
                </span>
              )}
              <span className="text-gray-400 text-sm">{challenge.category || 'General'}</span>
              <span className="text-gray-400 text-sm">•</span>
              <span className="flex items-center text-sm text-yellow-500">
                <Trophy className="w-4 h-4 mr-1" />
                {challenge.problems.length} problems
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Start: {formatDate(challenge.start_date)}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>End: {formatDate(challenge.end_date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('problems')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'problems'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Problems ({challenge.problems.length})
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Leaderboard
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Challenge Description</h2>
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 whitespace-pre-line">{challenge.description}</div>
              </div>
            </div>

            {/* Challenge Info */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Challenge Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Schedule</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Start Date:</span>
                      <span className="text-white">{formatDate(challenge.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">End Date:</span>
                      <span className="text-white">{formatDate(challenge.end_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={statusBadge.color + " px-2 py-0.5 rounded-full text-xs"}>
                        {statusBadge.text}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Problems:</span>
                      <span className="text-white">{challenge.problems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Participants:</span>
                      <span className="text-white">{leaderboard.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created By:</span>
                      <span className="text-white">{challenge.profiles.display_name || challenge.profiles.username}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {challenge.tags && challenge.tags.length > 0 && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {challenge.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gray-700 text-purple-400 rounded-lg text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Participation */}
            {hasStarted && !hasEnded && isActive && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
                <h2 className="text-xl font-semibold text-white mb-4">Ready to Participate?</h2>
                <p className="text-gray-300 mb-6">Start solving problems now to earn points and climb the leaderboard!</p>
                <button
                  onClick={() => setActiveTab('problems')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Challenge
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Challenge Problems</h2>
              
              {challenge.problems.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No problems in this challenge</h3>
                  <p className="text-gray-400">This challenge doesn't have any problems yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {challenge.problems
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((problem) => (
                      <ProblemCard
                        key={problem.id}
                        problem={problem}
                        isSolved={problem.user_stats?.solved || false}
                        isCompact={true}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Challenge Leaderboard</h2>
              
              {leaderboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin mr-2" />
                  <span className="text-gray-300">Loading leaderboard...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No participants yet</h3>
                  <p className="text-gray-400">Be the first to join this challenge!</p>
                </div>
              ) : (
                <>
                  {/* User's rank if available */}
                  {user && userRank && (
                    <div className="mb-6 p-4 bg-purple-900 bg-opacity-20 border border-purple-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {userRank}
                          </div>
                          <div>
                            <h3 className="text-white font-medium">Your Ranking</h3>
                            <p className="text-gray-400 text-sm">
                              You're ranked #{userRank} out of {leaderboard.length} participants
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
                
                  {/* Leaderboard Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="px-4 py-3 text-left text-gray-400 font-medium text-sm">Rank</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium text-sm">User</th>
                          <th className="px-4 py-3 text-right text-gray-400 font-medium text-sm">Problems Solved</th>
                          <th className="px-4 py-3 text-right text-gray-400 font-medium text-sm">Total Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry) => (
                          <tr 
                            key={entry.id} 
                            className={`border-b border-gray-700 hover:bg-gray-700 transition-colors ${
                              user && entry.user_id === user.id ? 'bg-purple-900 bg-opacity-20' : ''
                            }`}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                {entry.rank === 1 ? (
                                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                                    <Trophy className="w-4 h-4 text-black" />
                                  </div>
                                ) : entry.rank === 2 ? (
                                  <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                                    <Medal className="w-4 h-4 text-black" />
                                  </div>
                                ) : entry.rank === 3 ? (
                                  <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center">
                                    <Medal className="w-4 h-4 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white">
                                    {entry.rank}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center space-x-3">
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
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="text-white">{entry.problems_solved}</span>
                              <span className="text-gray-400 text-sm"> / {challenge.problems.length}</span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="text-white font-medium">{entry.total_points}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingChallengeDetailPage;