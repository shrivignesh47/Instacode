// LeetCode API utility functions
export interface LeetCodeProfile {
  username: string;
  name: string;
  birthday: string | null;
  avatar: string;
  ranking: number;
  reputation: number;
  gitHub: string | null;
  twitter: string | null;
  linkedIN: string | null;
  website: string[];
  country: string | null;
  company: string | null;
  school: string | null;
  skillTags: string[];
  about: string;
}

export interface LeetCodeSubmission {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

export interface LeetCodeSubmissionsResponse {
  count: number;
  submission: LeetCodeSubmission[];
}

export interface LeetCodeSolvedStats {
  solvedProblem: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSubmissionNum: Array<{
    difficulty: string;
    count: number;
    submissions: number;
  }>;
  acSubmissionNum: Array<{
    difficulty: string;
    count: number;
    submissions: number;
  }>;
}

// Base URL for the LeetCode API
const API_BASE_URL = 'https://leetcode-api1.onrender.com';

export const fetchLeetCodeProfileStats = async (username: string): Promise<LeetCodeProfile> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${username}`);
    
    if (!response.ok) {
      const errorMessage = `HTTP ${response.status} ${response.statusText}`;
      console.error('LeetCode API Error:', errorMessage);
      throw new Error(`Failed to fetch LeetCode profile: ${errorMessage}. Please verify the username "${username}" exists on LeetCode.`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching LeetCode profile:', error);
    
    // Handle network-level errors (CORS, network connectivity, etc.)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to LeetCode API. Please check your internet connection and try again.');
    }
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new Error('Invalid response from LeetCode API. The service may be temporarily unavailable.');
    }
    
    // Re-throw our custom errors
    if (error instanceof Error && error.message.includes('Failed to fetch LeetCode profile:')) {
      throw error;
    }
    
    // Handle any other unexpected errors
    throw new Error(`Unable to fetch LeetCode profile for "${username}". Please check the username and try again.`);
  }
};

export const fetchLeetCodeSubmissions = async (username: string, limit: number = 20): Promise<LeetCodeSubmission[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${username}/submission`);
    
    if (!response.ok) {
      const errorMessage = `HTTP ${response.status} ${response.statusText}`;
      console.error('LeetCode Submissions API Error:', errorMessage);
      throw new Error(`Failed to fetch LeetCode submissions: ${errorMessage}. Please verify the username "${username}" exists on LeetCode.`);
    }
    
    const data: LeetCodeSubmissionsResponse = await response.json();
    return data.submission || [];
  } catch (error) {
    console.error('Error fetching LeetCode submissions:', error);
    
    // Handle network-level errors (CORS, network connectivity, etc.)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to LeetCode API. Please check your internet connection and try again.');
    }
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new Error('Invalid response from LeetCode API. The service may be temporarily unavailable.');
    }
    
    // Re-throw our custom errors
    if (error instanceof Error && error.message.includes('Failed to fetch LeetCode submissions:')) {
      throw error;
    }
    
    // Handle any other unexpected errors
    throw new Error(`Unable to fetch LeetCode submissions for "${username}". Please check the username and try again.`);
  }
};

export const fetchLeetCodeSolvedStats = async (username: string): Promise<LeetCodeSolvedStats> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${username}/solved`);
    
    if (!response.ok) {
      const errorMessage = `HTTP ${response.status} ${response.statusText}`;
      console.error('LeetCode Solved Stats API Error:', errorMessage);
      throw new Error(`Failed to fetch LeetCode solved stats: ${errorMessage}. Please verify the username "${username}" exists on LeetCode.`);
    }
    
    const data: LeetCodeSolvedStats = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching LeetCode solved stats:', error);
    
    // Handle network-level errors (CORS, network connectivity, etc.)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to LeetCode API. Please check your internet connection and try again.');
    }
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new Error('Invalid response from LeetCode API. The service may be temporarily unavailable.');
    }
    
    // Re-throw our custom errors
    if (error instanceof Error && error.message.includes('Failed to fetch LeetCode solved stats:')) {
      throw error;
    }
    
    // Handle any other unexpected errors
    throw new Error(`Unable to fetch LeetCode solved stats for "${username}". Please check the username and try again.`);
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