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
  FileUp,
  Download,
  History
} from 'lucide-react';
import { useProblems } from '../hooks/useProblems';
import { useAuth } from '../contexts/AuthContext';
import ProblemCard from '../components/ProblemCard';
import DailyProblemWidget from '../components/DailyProblemWidget';
import ProblemStatsDashboard from '../components/ProblemStatsDashboard';
import ProblemExcelUploadModal from '../components/ProblemExcelUploadModal';
import ProblemImportsHistory from '../components/ProblemImportsHistory';
import { generateExcelTemplate } from '../utils/excelUploadUtils';

const ProblemsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'points' | 'popularity'>('newest');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImportHistory, setShowImportHistory] = useState(false);
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  
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

  const handleDownloadTemplate = () => {
    const blob = generateExcelTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'problem_template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadSuccess = () => {
    refetch();
    setShowUploadModal(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowUploadDropdown(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowUploadDropdown(!showUploadDropdown);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Problems</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showUploadDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUploadModal(true);
                  setShowUploadDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white rounded-t-lg flex items-center space-x-2"
              >
                <FileUp className="w-4 h-4" />
                <span>Upload Excel File</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadTemplate();
                  setShowUploadDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImportHistory(true);
                  setShowUploadDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white rounded-b-lg flex items-center space-x-2"
              >
                <History className="w-4 h-4" />
                <span>Import History</span>
              </button>
            </div>
          )}
        </div>
        
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Problems</span>
            </button>
            <button
              onClick={() => navigate('/problems/create')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Problem</span>
            </button>
          </div>
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

      {/* Excel Upload Modal */}
      <ProblemExcelUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Import History Modal */}
      <ProblemImportsHistory
        isOpen={showImportHistory}
        onClose={() => setShowImportHistory(false)}
      />
    </div>
  );
};

export default ProblemsPage;