import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Award, 
  Code, 
  Zap, 
  BarChart, 
  Clock, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2
} from 'lucide-react';
import { useChallenges } from '../hooks/useChallenges';
import ChallengeCard from '../components/ChallengeCard';
import { useAuth } from '../contexts/AuthContext';
import DailyChallengeWidget from '../components/DailyChallengeWidget';
import ChallengeStatsDashboard from '../components/ChallengeStatsDashboard';
import CreateChallengeModal from '../components/CreateChallengeModal';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ChallengesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'points' | 'popularity'>('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  // Initialize Gemini API
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // Fetch challenges with filters
  const { challenges, loading, error } = useChallenges(selectedCategory, selectedDifficulty, searchQuery);

  // Categories and difficulties for filters
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
  
  const difficulties = ['easy', 'medium', 'hard'];

  // Sort challenges based on selected sort option
  const sortedChallenges = [...challenges].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'points') {
      return b.points - a.points;
    } else {
      // Sort by popularity (placeholder - would need a popularity metric)
      return b.points - a.points;
    }
  });

  // Calculate user stats
  const solvedCount = challenges.filter(challenge => 
    challenge.user_stats && challenge.user_stats.solved
  ).length;

  const totalPoints = challenges.reduce((sum, challenge) => 
    sum + (challenge.user_stats?.points_earned || 0), 0
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const processExcelFile = async () => {
    if (!uploadFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // Read file content
      const fileContent = await readFileAsText(uploadFile);
      
      // Use Gemini to parse the file content
      const prompt = `
        Parse this CSV/Excel data into a structured JSON format for coding challenges.
        The data contains coding problems with their details.
        
        Here's the content:
        ${fileContent}
        
        Convert it to an array of objects with these fields:
        - title: The problem title
        - description: Full problem description
        - difficulty: "easy", "medium", or "hard"
        - category: The problem category (e.g., "Algorithms", "Data Structures")
        - tags: Array of relevant tags
        - starter_code: Initial code template
        - test_cases: Array of objects with "input" and "expected_output" fields
        - is_sample: Boolean indicating if this is a sample test case
        
        Return ONLY valid JSON without any explanation.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse file content');
      }
      
      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('Parsed challenge data:', parsedData);
      
      // TODO: Insert the parsed challenges into the database
      // This would involve multiple Supabase operations to:
      // 1. Insert each challenge
      // 2. Insert the test cases for each challenge
      
      setUploadSuccess(`Successfully processed ${parsedData.length} challenges. They will be available after review.`);
    } catch (err) {
      console.error('Error processing file:', err);
      setUploadError('Failed to process file. Please ensure it\'s in the correct format.');
    } finally {
      setIsUploading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center">
          <Code className="w-8 h-8 text-purple-500 mr-3" />
          Coding Challenges
        </h1>
        <p className="text-gray-400">Solve coding challenges, improve your skills, and compete with others</p>
      </div>

      {/* Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Dashboard - 2/3 width on large screens */}
        <div className="lg:col-span-2">
          {user && <ChallengeStatsDashboard />}
        </div>
        
        {/* Daily Challenge - 1/3 width on large screens */}
        <div>
          <DailyChallengeWidget />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
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
          <div className="hidden lg:flex items-center space-x-4">
            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty || ''}
              onChange={(e) => setSelectedDifficulty(e.target.value || undefined)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Difficulties</option>
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>

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

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'points' | 'popularity')}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="newest">Newest</option>
              <option value="points">Highest Points</option>
              <option value="popularity">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Mobile Filters (Expandable) */}
        {showFilters && (
          <div className="mt-4 space-y-3 lg:hidden">
            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty</label>
              <select
                value={selectedDifficulty || ''}
                onChange={(e) => setSelectedDifficulty(e.target.value || undefined)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Difficulties</option>
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>

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

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'points' | 'popularity')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="newest">Newest</option>
                <option value="points">Highest Points</option>
                <option value="popularity">Most Popular</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Create Challenge and Upload Buttons */}
      <div className="flex justify-end mb-6 space-x-4">
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Problems</span>
        </button>
        
        <button
          onClick={() => setShowCreateModal(true)}
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
      ) : sortedChallenges.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No challenges found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery || selectedCategory || selectedDifficulty
              ? "Try adjusting your filters or search query"
              : "No challenges are available at the moment"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              isSolved={challenge.user_stats?.solved || false}
            />
          ))}
        </div>
      )}

      {/* Create Challenge Modal */}
      <CreateChallengeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onChallengeCreated={() => {
          // Refresh challenges after creation
          setShowCreateModal(false);
        }}
      />

      {/* Upload Challenges Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Upload Challenges</h2>
            
            <p className="text-gray-300 mb-4">
              Upload a CSV or Excel file with coding challenges. The file should contain columns for Problem ID, Title, Description, Constraints, Sample Input, Sample Output, and Test Cases.
            </p>
            
            {uploadError && (
              <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-3 mb-4">
                <p className="text-red-200 text-sm">{uploadError}</p>
              </div>
            )}
            
            {uploadSuccess && (
              <div className="bg-green-900 bg-opacity-50 border border-green-500 rounded-lg p-3 mb-4">
                <p className="text-green-200 text-sm">{uploadSuccess}</p>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select File
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: CSV, Excel (.xlsx, .xls)
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={processExcelFile}
                disabled={isUploading || !uploadFile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Process File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengesPage;