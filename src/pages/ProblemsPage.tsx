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
  Loader2,
  Upload,
  FileUp
} from 'lucide-react';
import { useProblems } from '../hooks/useProblems';
import { useAuth } from '../contexts/AuthContext';
import ProblemCard from '../components/ProblemCard';
import DailyProblemWidget from '../components/DailyProblemWidget';
import ProblemStatsDashboard from '../components/ProblemStatsDashboard';
import { parseProblemFile, uploadProblemImport, processProblemImport } from '../utils/problemUtils';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ProblemsPage = () => {
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [parsedProblems, setParsedProblems] = useState<any[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Fetch problems with filters
  const { problems, loading, error, refetch } = useProblems(selectedCategory, selectedDifficulty, searchQuery);

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

  // Sort problems based on selected sort option
  const sortedProblems = [...problems].sort((a, b) => {
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
  const solvedCount = problems.filter(problem => 
    problem.user_stats && problem.user_stats.solved
  ).length;

  const totalPoints = problems.reduce((sum, problem) => 
    sum + (problem.user_stats?.points_earned || 0), 0
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setUploadError(null);
      setParsedProblems([]);
      setPreviewMode(false);
    }
  };

  const handlePreviewFile = async () => {
    if (!uploadFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsProcessing(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // Parse the file content
      const problems = await parseProblemFile(uploadFile);
      setParsedProblems(problems);
      setPreviewMode(true);
    } catch (err) {
      console.error('Error processing file:', err);
      setUploadError('Failed to process file. Please ensure it\'s in the correct format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadProblems = async () => {
    if (!user) {
      setUploadError('You must be logged in to upload problems');
      return;
    }

    if (parsedProblems.length === 0) {
      setUploadError('No problems to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // Create import record
      const importId = await uploadProblemImport(uploadFile!, user.id);
      
      // Process the problems
      const result = await processProblemImport(importId, parsedProblems);
      
      setUploadSuccess(`Successfully processed ${result.successful} problems. They will be available after review.`);
      setPreviewMode(false);
      setParsedProblems([]);
      setUploadFile(null);
      
      // Refresh the problems list
      refetch();
    } catch (err) {
      console.error('Error uploading problems:', err);
      setUploadError('Failed to upload problems. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center">
          <Code className="w-8 h-8 text-purple-500 mr-3" />
          Coding Problems
        </h1>
        <p className="text-gray-400">Solve coding problems, improve your skills, and compete with others</p>
      </div>

      {/* Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Dashboard - 2/3 width on large screens */}
        <div className="lg:col-span-2">
          {user && <ProblemStatsDashboard />}
        </div>
        
        {/* Daily Problem - 1/3 width on large screens */}
        <div>
          <DailyProblemWidget />
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
              placeholder="Search problems..."
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

      {/* Create Problem and Upload Buttons */}
      <div className="flex justify-end mb-6 space-x-4">
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Problems</span>
        </button>
        
        <button
          onClick={() => navigate('/problems/create')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Problem</span>
        </button>
      </div>

      {/* Problems Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mr-3" />
          <span className="text-white text-lg">Loading problems...</span>
        </div>
      ) : error ? (
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
          Error loading problems: {error}
        </div>
      ) : sortedProblems.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No problems found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery || selectedCategory || selectedDifficulty
              ? "Try adjusting your filters or search query"
              : "No problems are available at the moment"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProblems.map((problem) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              isSolved={problem.user_stats?.solved || false}
            />
          ))}
        </div>
      )}

      {/* Upload Problems Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Upload Problems</h2>
              <p className="text-gray-300 mt-2">
                Upload a CSV or Excel file with coding problems. The file should contain columns for Problem Title, Description, Difficulty, Category, Tags, Starter Code, Solution Code, and Test Cases.
              </p>
            </div>
            
            <div className="p-6">
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
              
              {!previewMode ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select File
                    </label>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,.txt"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted formats: CSV, Excel (.xlsx, .xls), Text (.txt)
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
                      onClick={handlePreviewFile}
                      disabled={isProcessing || !uploadFile}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <FileUp className="w-4 h-4" />
                          <span>Preview Problems</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-white mb-2">Preview ({parsedProblems.length} problems)</h3>
                    <div className="bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {parsedProblems.map((problem, index) => (
                        <div key={index} className="mb-4 pb-4 border-b border-gray-600 last:border-0 last:mb-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium">{problem.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              problem.difficulty === 'easy'
                                ? 'text-green-500 bg-green-900 bg-opacity-30'
                                : problem.difficulty === 'medium'
                                ? 'text-yellow-500 bg-yellow-900 bg-opacity-30'
                                : 'text-red-500 bg-red-900 bg-opacity-30'
                            }`}>
                              {problem.difficulty}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-2 line-clamp-2">{problem.description}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {problem.tags && problem.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                              <span key={tagIndex} className="px-2 py-0.5 bg-gray-600 text-purple-400 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                            {problem.tags && problem.tags.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-600 text-gray-400 text-xs rounded">
                                +{problem.tags.length - 3} more
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {problem.test_cases?.length || 0} test cases • {problem.points || 100} points
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setPreviewMode(false);
                        setParsedProblems([]);
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleUploadProblems}
                      disabled={isUploading || parsedProblems.length === 0}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload {parsedProblems.length} Problems</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemsPage;