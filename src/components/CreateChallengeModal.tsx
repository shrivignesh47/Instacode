import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface TestCase {
  input: string;
  expected_output: string;
  is_sample: boolean;
}

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeCreated: () => void;
}

const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onChallengeCreated
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [category, setCategory] = useState('Algorithms');
  const [tags, setTags] = useState('');
  const [starterCode, setStarterCode] = useState('// Write your solution here\n\n');
  const [solutionCode, setSolutionCode] = useState('// Solution code\n\n');
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expected_output: '', is_sample: true }
  ]);
  const [points, setPoints] = useState(100);
  const [timeLimit, setTimeLimit] = useState(1000); // ms
  const [memoryLimit, setMemoryLimit] = useState(128); // MB
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleTestCaseChange = (index: number, field: keyof TestCase, value: string | boolean) => {
    const updatedTestCases = [...testCases];
    updatedTestCases[index] = { ...updatedTestCases[index], [field]: value };
    setTestCases(updatedTestCases);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a challenge');
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

    try {
      // Create challenge
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .insert({
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
          is_approved: false // Requires admin approval
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      // Create test cases
      const testCasesWithChallengeId = testCases.map((tc, index) => ({
        challenge_id: challengeData.id,
        input: tc.input,
        expected_output: tc.expected_output,
        is_sample: tc.is_sample,
        order_index: index
      }));

      const { error: testCasesError } = await supabase
        .from('test_cases')
        .insert(testCasesWithChallengeId);

      if (testCasesError) throw testCasesError;

      // Reset form
      setTitle('');
      setDescription('');
      setDifficulty('easy');
      setCategory('Algorithms');
      setTags('');
      setStarterCode('// Write your solution here\n\n');
      setSolutionCode('// Solution code\n\n');
      setTestCases([{ input: '', expected_output: '', is_sample: true }]);
      setPoints(100);
      setTimeLimit(1000);
      setMemoryLimit(128);

      onChallengeCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating challenge:', err);
      setError(err.message || 'Failed to create challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Create New Challenge</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Problem Description</h3>
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
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Code Templates</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="starterCode" className="block text-sm font-medium text-gray-300 mb-2">
                  Starter Code *
                </label>
                <textarea
                  id="starterCode"
                  value={starterCode}
                  onChange={(e) => setStarterCode(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical font-mono text-sm"
                  placeholder="// Provide starter code template for users"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="solutionCode" className="block text-sm font-medium text-gray-300 mb-2">
                  Solution Code *
                </label>
                <textarea
                  id="solutionCode"
                  value={solutionCode}
                  onChange={(e) => setSolutionCode(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical font-mono text-sm"
                  placeholder="// Provide the solution code"
                  required
                />
              </div>
            </div>
          </div>

          {/* Test Cases */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Test Cases</h3>
              <button
                type="button"
                onClick={handleAddTestCase}
                className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Test Case</span>
              </button>
            </div>
            
            <div className="space-y-4">
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
              onClick={onClose}
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
                  <span>Create Challenge</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChallengeModal;