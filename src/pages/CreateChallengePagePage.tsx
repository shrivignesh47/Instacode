import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProblems } from '../hooks/useProblems';
import { createCodingChallenge } from '../utils/problemUtils';
import ProblemCard from '../components/ProblemCard';

const CreateChallengePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [category, setCategory] = useState('Algorithms');
  const [tags, setTags] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch all problems for selection
  const { problems, loading: problemsLoading } = useProblems();

  // Set default dates
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    setStartDate(tomorrow.toISOString().split('T')[0]);
    setEndDate(nextWeek.toISOString().split('T')[0]);
  }, []);

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

  const toggleProblemSelection = (problemId: string) => {
    if (selectedProblemIds.includes(problemId)) {
      setSelectedProblemIds(selectedProblemIds.filter(id => id !== problemId));
    } else {
      setSelectedProblemIds([...selectedProblemIds, problemId]);
    }
  };

  const filteredProblems = problems.filter(problem => 
    problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (problem.tags && problem.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a challenge');
      return;
    }

    // Validate form
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (selectedProblemIds.length === 0) {
      setError('Please select at least one problem for the challenge');
      return;
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Create challenge
      const challengeData = await createCodingChallenge({
        title: title.trim(),
        description: description.trim(),
        difficulty,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        is_active: isActive,
        created_by: user.id,
        problem_ids: selectedProblemIds
      });

      setSuccess('Challenge created successfully!');
      
      // Navigate to the challenge page after a short delay
      setTimeout(() => {
        navigate(`/challenges/${challengeData.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error creating challenge:', err);
      setError(err.message || 'Failed to create challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Create New Challenge</h1>
        <p className="text-gray-400">Create a coding challenge with multiple problems for others to participate</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-900 bg-opacity-50 border border-green-500 rounded-lg p-4 mb-6 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
          <p className="text-green-200">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Challenge Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Weekly Coding Challenge #1"
                required
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-2">
                Difficulty *
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., weekly, algorithms, competition"
              />
            </div>
            
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-300">
                Make challenge active immediately
              </label>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Challenge Description</h2>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
            placeholder="Describe the challenge, rules, and any special instructions..."
            required
          />
        </div>

        {/* Problem Selection */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Select Problems</h2>
            <div className="text-sm text-gray-400">
              {selectedProblemIds.length} problems selected
            </div>
          </div>
          
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problems..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Problem List */}
          {problemsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin mr-2" />
              <span className="text-gray-300">Loading problems...</span>
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300 mb-2">No problems found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or create new problems first</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
              {filteredProblems.map((problem) => (
                <div 
                  key={problem.id}
                  onClick={() => toggleProblemSelection(problem.id)}
                  className={`relative cursor-pointer ${
                    selectedProblemIds.includes(problem.id) 
                      ? 'ring-2 ring-purple-500' 
                      : ''
                  }`}
                >
                  <ProblemCard
                    problem={problem}
                    isSolved={problem.user_stats?.solved || false}
                    isCompact={true}
                  />
                  {selectedProblemIds.includes(problem.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/challenges')}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || selectedProblemIds.length === 0}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Create Challenge</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateChallengePage;