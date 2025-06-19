// LeetCode API utility functions
export interface LeetCodeProfile {
  username: string;
  profile: {
    realName: string;
    websites: string[];
    countryName: string;
    company: string | null;
    school: string | null;
    aboutMe: string;
    reputation: number;
    ranking: number;
  };
  submitStats: {
    acSubmissionNum: Array<{
      difficulty: string;
      count: number;
      submissions: number;
    }>;
    totalSubmissionNum: Array<{
      difficulty: string;
      count: number;
      submissions: number;
    }>;
  };
}

export interface LeetCodeSubmission {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
  url: string;
}

export const fetchLeetCodeProfileStats = async (username: string): Promise<LeetCodeProfile> => {
  try {
    const response = await fetch(`https://leetcode-api-pied.vercel.app/user/${username}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch LeetCode profile: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching LeetCode profile:', error);
    throw new Error('Unable to fetch LeetCode profile. Please check the username and try again.');
  }
};

export const fetchLeetCodeSubmissions = async (username: string, limit: number = 20): Promise<LeetCodeSubmission[]> => {
  try {
    const response = await fetch(`https://leetcode-api-pied.vercel.app/user/${username}/submissions?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch LeetCode submissions: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching LeetCode submissions:', error);
    throw new Error('Unable to fetch LeetCode submissions. Please check the username and try again.');
  }
};

// Helper function to format timestamp to readable date
export const formatLeetCodeTimestamp = (timestamp: string): string => {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Helper function to get status color class
export const getStatusColorClass = (status: string): string => {
  switch (status) {
    case 'Accepted':
      return 'text-green-500';
    case 'Wrong Answer':
      return 'text-red-500';
    case 'Time Limit Exceeded':
      return 'text-yellow-500';
    case 'Runtime Error':
      return 'text-orange-500';
    case 'Compile Error':
      return 'text-purple-500';
    default:
      return 'text-gray-500';
  }
};

// Helper function to get language color class
export const getLanguageColorClass = (language: string): string => {
  switch (language.toLowerCase()) {
    case 'java':
      return 'text-orange-400';
    case 'python':
      return 'text-blue-400';
    case 'javascript':
    case 'typescript':
      return 'text-yellow-400';
    case 'cpp':
    case 'c++':
      return 'text-purple-400';
    case 'c#':
    case 'csharp':
      return 'text-green-400';
    case 'go':
      return 'text-blue-300';
    case 'ruby':
      return 'text-red-400';
    case 'swift':
      return 'text-orange-500';
    case 'kotlin':
      return 'text-purple-500';
    case 'rust':
      return 'text-orange-600';
    case 'scala':
      return 'text-red-500';
    case 'mysql':
    case 'sql':
      return 'text-blue-500';
    default:
      return 'text-gray-400';
  }
};