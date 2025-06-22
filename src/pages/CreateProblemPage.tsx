import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  Code,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createProblem } from '../utils/problemUtils';
import CodeEditor from '../components/CodeEditor';

const CreateProblemPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [category, setCategory] = useState('Algorithms');
  const [tags, setTags] = useState('');
  const [starterCode, setStarterCode] = useState('// Write your solution here\n\n');
  const [solutionCode, setSolutionCode] = useState('// Solution code\n\n');
  const [testCases, setTestCases] = useState<{ input: string; expected_output: string; is_sample: boolean }[]>([
    { input: '', expected_output: '', is_sample: true }
  ]);
  const [points, setPoints] = useState(100);
  const [timeLimit, setTimeLimit] = useState(1000); // ms
  const [memoryLimit, setMemoryLimit] = useState(128); // MB
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: '', expected_output: '', is_sample: true }]);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  const handleTestCaseChange = (index: number, field: keyof typeof testCases[0], value: string | boolean) => {
    const updatedTestCases = [...testCases];
    updatedTestCases[index] = { ...updatedTestCases[index], [field]: value };
    setTestCases(updatedTestCases);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a problem');
      return;
    }

    // Validate form
    if (!title.trim() || !description.trim() || !starterCode.trim() || !solutionCode.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (testCases.length === 0 || testCases.some(tc => !tc.input.trim() || !tc.expected_output.trim())) {
      setError('Please provide at least one complete test case');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Create problem
      const problemData = await createProblem({
        title: title.trim(),
        description: description.trim(),
        difficulty,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        starter_code: starterCode,
        solution_code: solutionCode,
        time_limit_ms: timeLimit,
        memory_limit_mb: memoryLimit,
        points,
        created_by: user.id,
        test_cases: testCases
      });

      setSuccess('Problem created successfully!');
      
      // Navigate to the problem page after a short delay
      setTimeout(() => {
        navigate(`/problems/${problemData.slug}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error creating problem:', err);
      setError(err.message || 'Failed to create problem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0 pb-12">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/problems')}
          className="flex items-center text-purple-400 hover:text-purple-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Problems
        </button>
        
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Create New Problem</h1>
        <p className="text-gray-400">Create a coding problem for others to solve</p>
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
          <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
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
                placeholder="e.g., Two Sum"
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
              <label htmlFor="points" className="block text-sm font-medium text-gray-300 mb-2">
                Points *
              </label>
              <input
                type="number"
                id="points"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value))}
                min={1}
                max={1000}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-300 mb-2">
                Time Limit (ms) *
              </label>
              <input
                type="number"
                id="timeLimit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                min={100}
                max={10000}
                step={100}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="memoryLimit" className="block text-sm font-medium text-gray-300 mb-2">
                Memory Limit (MB) *
              </label>
              <input
                type="number"
                id="memoryLimit"
                value={memoryLimit}
                onChange={(e) => setMemoryLimit(parseInt(e.target.value))}
                min={16}
                max={512}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., array, hash-table, two-pointers"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Problem Description</h2>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
            placeholder="Describe the problem in detail..."
            required
          />
        </div>

        {/* Code Templates */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Code Templates</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="starterCode" className="block text-sm font-medium text-gray-300 mb-2">
                Starter Code *
              </label>
              <CodeEditor
                initialCode={starterCode}
                language="javascript"
                onCodeChange={setStarterCode}
                height="200px"
              />
            </div>
            
            <div>
              <label htmlFor="solutionCode" className="block text-sm font-medium text-gray-300 mb-2">
                Solution Code *
              </label>
              <CodeEditor
                initialCode={solutionCode}
                language="javascript"
                onCodeChange={setSolutionCode}
                height="200px"
              />
            </div>
          </div>
        </div>

        {/* Test Cases */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Test Cases</h2>
            <button
              type="button"
              onClick={handleAddTestCase}
              className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Test Case</span>
            </button>
          </div>
          
          <div className="space-y-6">
            {testCases.map((testCase, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">Test Case {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveTestCase(index)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    disabled={testCases.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Input *
                    </label>
                    <textarea
                      value={testCase.input}
                      onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical font-mono text-sm"
                      placeholder="Input for this test case"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Expected Output *
                    </label>
                    <textarea
                      value={testCase.expected_output}
                      onChange={(e) => handleTestCaseChange(index, 'expected_output', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical font-mono text-sm"
                      placeholder="Expected output for this test case"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`is_sample_${index}`}
                      checked={testCase.is_sample}
                      onChange={(e) => handleTestCaseChange(index, 'is_sample', e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <label htmlFor={`is_sample_${index}`} className="ml-2 text-sm text-gray-300">
                      Show as sample test case (visible to users)
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/problems')}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
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
                <span>Create Problem</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProblemPage;