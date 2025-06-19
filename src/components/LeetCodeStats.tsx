import React, { useState, useEffect } from 'react';
import { Code, CheckCircle, XCircle, Clock, Calendar, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  LeetCodeProfile, 
  LeetCodeSubmission, 
  LeetCodeSolvedStats,
  formatLeetCodeTimestamp, 
  getStatusColorClass, 
  getLanguageColorClass 
} from '../utils/leetcodeApi';

interface LeetCodeStatsProps {
  leetcodeProfile: LeetCodeProfile | null;
  leetcodeSubmissions: LeetCodeSubmission[] | null;
  leetcodeSolvedStats: LeetCodeSolvedStats | null;
  loading: boolean;
  error: string | null;
  username: string;
}

const LeetCodeStats: React.FC<LeetCodeStatsProps> = ({
  leetcodeProfile,
  leetcodeSubmissions,
  leetcodeSolvedStats,
  loading,
  error,
  username
}) => {
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 mb-6 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading LeetCode data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center space-x-3 text-red-400 mb-4">
          <XCircle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">LeetCode Error</h3>
        </div>
        <p className="text-gray-400">{error}</p>
        <p className="text-gray-500 mt-2 text-sm">
          Please check the LeetCode username and try again.
        </p>
      </div>
    );
  }

  if (!leetcodeProfile || !leetcodeSubmissions || !leetcodeSolvedStats) {
    return null;
  }

  // Determine how many submissions to show
  const displaySubmissions = showAllSubmissions 
    ? leetcodeSubmissions 
    : leetcodeSubmissions.slice(0, 5);

  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Code className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-semibold text-white">LeetCode Stats</h3>
        </div>
        <a 
          href={`https://leetcode.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
        >
          <span>View Profile</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Profile Info */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4 text-gray-400">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Username:</span>
            <span>{leetcodeProfile.username}</span>
          </div>
          {leetcodeProfile.name && (
            <div className="flex items-center space-x-2">
              <span className="font-medium">Name:</span>
              <span>{leetcodeProfile.name}</span>
            </div>
          )}
          {leetcodeProfile.ranking && (
            <div className="flex items-center space-x-2">
              <span className="font-medium">Ranking:</span>
              <span>{leetcodeProfile.ranking.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Submission Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Total Solved</div>
          <div className="text-2xl font-bold text-white">{leetcodeSolvedStats.solvedProblem || 0}</div>
          <div className="text-xs text-gray-500 mt-1">
            {leetcodeSolvedStats.acSubmissionNum.find(s => s.difficulty === 'All')?.submissions || 0} submissions
          </div>
        </div>
        
        <div className="bg-green-900 bg-opacity-30 rounded-lg p-4">
          <div className="text-sm text-green-400 mb-1">Easy</div>
          <div className="text-2xl font-bold text-white">{leetcodeSolvedStats.easySolved || 0}</div>
          <div className="text-xs text-gray-500 mt-1">
            {leetcodeSolvedStats.acSubmissionNum.find(s => s.difficulty === 'Easy')?.submissions || 0} submissions
          </div>
        </div>
        
        <div className="bg-yellow-900 bg-opacity-30 rounded-lg p-4">
          <div className="text-sm text-yellow-400 mb-1">Medium</div>
          <div className="text-2xl font-bold text-white">{leetcodeSolvedStats.mediumSolved || 0}</div>
          <div className="text-xs text-gray-500 mt-1">
            {leetcodeSolvedStats.acSubmissionNum.find(s => s.difficulty === 'Medium')?.submissions || 0} submissions
          </div>
        </div>
        
        <div className="bg-red-900 bg-opacity-30 rounded-lg p-4">
          <div className="text-sm text-red-400 mb-1">Hard</div>
          <div className="text-2xl font-bold text-white">{leetcodeSolvedStats.hardSolved || 0}</div>
          <div className="text-xs text-gray-500 mt-1">
            {leetcodeSolvedStats.acSubmissionNum.find(s => s.difficulty === 'Hard')?.submissions || 0} submissions
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">Recent Submissions</h4>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {displaySubmissions.length > 0 ? (
            <>
              {displaySubmissions.map((submission, index) => (
                <a
                  key={`${submission.titleSlug}-${index}`}
                  href={`https://leetcode.com/problems/${submission.titleSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gray-700 hover:bg-gray-600 rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-white">{submission.title}</h5>
                    <span className={`text-sm ${getStatusColorClass(submission.statusDisplay)}`}>
                      {submission.statusDisplay}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center text-sm text-gray-400 gap-x-4 gap-y-1">
                    <span className={`${getLanguageColorClass(submission.lang)}`}>
                      {submission.lang}
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatLeetCodeTimestamp(submission.timestamp)}</span>
                    </span>
                  </div>
                </a>
              ))}
              
              {leetcodeSubmissions.length > 5 && (
                <button
                  onClick={() => setShowAllSubmissions(!showAllSubmissions)}
                  className="w-full text-center py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {showAllSubmissions ? (
                    <span className="flex items-center justify-center">
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Show Less
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show All ({leetcodeSubmissions.length}) Submissions
                    </span>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No recent submissions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeetCodeStats;