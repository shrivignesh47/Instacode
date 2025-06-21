import React, { useState, useEffect } from 'react';
import { Code, CheckCircle, XCircle, Clock, Calendar, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

// Types for LeetCode daily challenge
interface LeetCodeDailyChallenge {
  questionLink: string;
  date: string;
  questionId: string;
  questionFrontendId: string;
  questionTitle: string;
  titleSlug: string;
  difficulty: string;
  isPaidOnly: boolean;
  topicTags: Array<{
    name: string;
    slug: string;
    translatedName: string | null;
  }>;
  likes: number;
  dislikes: number;
}

// Types for GeeksforGeeks daily challenge
interface GFGDailyChallenge {
  id: number;
  date: string;
  is_solved: boolean;
  problem_id: number;
  problem_name: string;
  problem_url: string;
  remaining_time: number;
  difficulty: string;
  accuracy: number;
  total_submissions: number;
  tags: {
    company_tags: string[];
    topic_tags: string[];
  };
}

const DailyChallengeCard: React.FC = () => {
  const [leetCodeChallenge, setLeetCodeChallenge] = useState<LeetCodeDailyChallenge | null>(null);
  const [gfgChallenge, setGfgChallenge] = useState<GFGDailyChallenge | null>(null);
  const [leetCodeLoading, setLeetCodeLoading] = useState(true);
  const [gfgLoading, setGfgLoading] = useState(true);
  const [leetCodeError, setLeetCodeError] = useState<string | null>(null);
  const [gfgError, setGfgError] = useState<string | null>(null);
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);

  useEffect(() => {
    // Fetch LeetCode daily challenge
    const fetchLeetCodeChallenge = async () => {
      try {
        setLeetCodeLoading(true);
        setLeetCodeError(null);

        const response = await fetch('https://leetcode-api1.onrender.com/daily');

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setLeetCodeChallenge(data);
      } catch (error) {
        console.error('Error fetching LeetCode daily challenge:', error);
        setLeetCodeError('Failed to load LeetCode challenge');
      } finally {
        setLeetCodeLoading(false);
      }
    };

    fetchLeetCodeChallenge();
    fetchGFGChallenge(); // Initial fetch for GFG
  }, []);

  // Manual fetch for GFG
  const fetchGFGChallenge = async () => {
    try {
      setGfgLoading(true);
      setGfgError(null);

      const response = await fetch(
        'https://nmlgdixqnrtrvvipvawd.supabase.co/functions/v1/fetch-problem-of-the-day',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setGfgChallenge(data);
    } catch (error) {
      console.error('Error fetching GeeksforGeeks daily challenge:', error);
      setGfgError('Failed to load GeeksforGeeks challenge');
    } finally {
      setGfgLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-500 bg-green-900 bg-opacity-30';
      case 'medium':
        return 'text-yellow-500 bg-yellow-900 bg-opacity-30';
      case 'hard':
        return 'text-red-500 bg-red-900 bg-opacity-30';
      default:
        return 'text-gray-500 bg-gray-700';
    }
  };

  const formatRemainingTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Daily Challenges</h3>
      </div>

      {/* LeetCode */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2 mb-3">
          <Code className="w-4 h-4 text-yellow-500" />
          <h4 className="text-sm font-medium text-white">LeetCode</h4>
        </div>

        {leetCodeLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-400 text-sm">Loading challenge...</span>
          </div>
        ) : leetCodeError ? (
          <div className="flex items-center text-red-400 text-sm py-2">
            <XCircle className="w-4 h-4 mr-2" />
            {leetCodeError}
          </div>
        ) : leetCodeChallenge ? (
          <a
            href={leetCodeChallenge.questionLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:bg-gray-700 rounded-lg p-3 transition-colors"
          >
            <h5 className="font-medium text-white mb-2 line-clamp-2">{leetCodeChallenge.questionTitle}</h5>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(leetCodeChallenge.difficulty)}`}>
                {leetCodeChallenge.difficulty}
              </span>
              <span className="flex items-center text-xs text-gray-400">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(leetCodeChallenge.date)}
              </span>
            </div>

            {leetCodeChallenge.topicTags && leetCodeChallenge.topicTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {leetCodeChallenge.topicTags.slice(0, 3).map(tag => (
                  <span key={tag.slug} className="px-2 py-1 bg-gray-700 text-xs text-purple-400 rounded">
                    {tag.name}
                  </span>
                ))}
                {leetCodeChallenge.topicTags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-700 text-xs text-gray-400 rounded">
                    +{leetCodeChallenge.topicTags.length - 3} more
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-end mt-2 text-purple-400 text-xs">
              <span>Solve Challenge</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </div>
          </a>
        ) : (
          <div className="text-gray-400 text-sm py-2">No challenge available</div>
        )}
      </div>

      {/* GFG */}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <h4 className="text-sm font-medium text-white">GeeksforGeeks</h4>
        </div>

        {gfgLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-400 text-sm">Loading challenge...</span>
          </div>
        ) : gfgError ? (
          <div className="flex items-center text-red-400 text-sm py-2">
            <XCircle className="w-4 h-4 mr-2" />
            {gfgError}
          </div>
        ) : gfgChallenge ? (
          <a
            href={gfgChallenge.problem_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:bg-gray-700 rounded-lg p-3 transition-colors"
          >
            <h5 className="font-medium text-white mb-2 line-clamp-2">{gfgChallenge.problem_name}</h5>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(gfgChallenge.difficulty)}`}>
                {gfgChallenge.difficulty}
              </span>
              <span className="flex items-center text-xs text-gray-400">
                <Clock className="w-3 h-3 mr-1" />
                {formatRemainingTime(gfgChallenge.remaining_time)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
              <span>Accuracy: {gfgChallenge.accuracy}%</span>
              <span>Submissions: {gfgChallenge.total_submissions.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-end mt-2 text-green-400 text-xs">
              <span>Solve Challenge</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </div>
          </a>
        ) : (
          <div className="text-gray-400 text-sm py-2">No challenge available</div>
        )}
      </div>
    </div>
  );
};

export default DailyChallengeCard;