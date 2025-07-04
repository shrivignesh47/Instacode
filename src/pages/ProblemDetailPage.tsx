import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Clock,
  Zap,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  BarChart,
  Save,
  Copy,
  Download,
  AlertTriangle
} from 'lucide-react';
import { useProblemBySlug, useProblemSubmissions } from '../hooks/useProblems';
import { useAuth } from '../contexts/AuthContext';
import { submitProblemSolution } from '../utils/problemUtils';
import CodeEditor from '../components/CodeEditor';
import { getFileExtension } from '../utils/codeRunner';
import ProblemSubmissionsList from '../components/ProblemSubmissionsList';
import { supabase } from '../lib/supabaseClient'; // Import supabase

const ProblemDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { problem, loading, error } = useProblemBySlug(slug || '');
  const { submissions, loading: submissionsLoading } = useProblemSubmissions(problem?.id, user?.id);

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState<'description' | 'submissions' | 'discussion'>('description');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [output, setOutput] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);

  // Set initial code from problem starter code when loaded
  useEffect(() => {
    if (problem) {
      // Ensure code is always a string, even if problem.starter_code is null
      setCode(problem.starter_code || '');
    }
  }, [problem]);

  // Update starter code when language changes
  useEffect(() => {
    if (problem && problem.starter_code) {
      // For Java, provide a specific template with Solution class
      if (language === 'java') {
        // Check if starter code already contains a Solution class
        if (problem.starter_code.includes('class Solution')) {
          // Extract just the method body from the Solution class
          const methodRegex = /public\s+\w+\s+\w+\s*\([^)]*\)\s*\{[\s\S]*\}/;
          const methodMatch = problem.starter_code.match(methodRegex);

          if (methodMatch) {
            setCode(methodMatch[0]);
          } else {
            // Fallback to a default method if we can't extract it
            setCode(`public void reverseString(char[] s) {
    // Your solution here
    // This method should modify the array in-place
    int left = 0;
    int right = s.length - 1;

    while (left < right) {
        char temp = s[left];
        s[left] = s[right];
        s[right] = temp;
        left++;
        right--;
    }
}`);
          }
        } else {
          // If no Solution class, use the starter code directly (assuming it's just the method)
          setCode(problem.starter_code);
        }
      } else {
        setCode(problem.starter_code);
      }
    }
  }, [language, problem]);

  const handleRunCode = async () => {
    if (!problem) return;

    setIsRunning(true);
    setOutput('Running code...');
    setTestResults([]);

    try {
      // Submit to judge-problem function with test mode
      const result = await submitProblemSolution(problem.id, code, language);

      setTestResults(result.test_results || []);

      // Set overall output
      const passedCount = result.test_cases_passed;
      const totalCount = result.test_cases_total;

      if (result.error_message) {
        setOutput(`Error: ${result.error_message}`);
      } else {
        setOutput(`Passed ${passedCount}/${totalCount} test cases`);
      }

    } catch (error) {
      console.error('Error running code:', error);
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem || !user) return;

    setIsSubmitting(true);
    setSubmissionStatus('pending');
    setOutput('Submitting solution...');

    try {
      // Submit to judge-problem function
      const result = await submitProblemSolution(problem.id, code, language);

      // Update UI with results
      setSubmissionStatus(result.status);
      setTestResults(result.test_results || []);

      // Set output message based on status
      if (result.status === 'accepted') {
        setOutput(`Success! All ${result.test_cases_passed}/${result.test_cases_total} test cases passed.`);
      } else if (result.status === 'compilation_error') {
        setOutput(`Compilation Error: ${result.error_message}`);
      } else if (result.status === 'runtime_error') {
        setOutput(`Runtime Error: ${result.error_message}`);
      } else if (result.status === 'time_limit_exceeded') {
        setOutput(`Time Limit Exceeded: Your solution took too long to execute.`);
      } else {
        setOutput(`Failed: ${result.test_cases_passed}/${result.test_cases_total} test cases passed.`);
      }

      // Save submission to database

    } catch (error) {
      console.error('Error submitting solution:', error);
      setSubmissionStatus('error');
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const downloadCode = () => {
    const extension = getFileExtension(language);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mr-3" />
        <span className="text-white text-lg">Loading problem...</span>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8">
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
          {error || 'Problem not found'}
        </div>
        <button
          onClick={() => navigate('/problems')}
          className="mt-4 flex items-center text-purple-400 hover:text-purple-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Problems
        </button>
      </div>
    );
  }

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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{problem.title}</h1>
            <div className="flex items-center flex-wrap gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                problem.difficulty === 'easy'
                  ? 'text-green-500 bg-green-900 bg-opacity-30'
                  : problem.difficulty === 'medium'
                  ? 'text-yellow-500 bg-yellow-900 bg-opacity-30'
                  : 'text-red-500 bg-red-900 bg-opacity-30'
              }`}>
                {problem.difficulty}
              </span>
              <span className="text-gray-400 text-sm">{problem.category}</span>
              <span className="text-gray-400 text-sm">•</span>
              <span className="flex items-center text-sm text-yellow-500">
                <Award className="w-4 h-4 mr-1" />
                {problem.points} points
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{problem.time_limit_ms / 1000}s</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              <span>{submissions.length} attempts</span>
            </div>
            {problem.user_stats?.solved ? (
              <div className="flex items-center space-x-1 text-sm text-green-500">
                <CheckCircle className="w-4 h-4" />
                <span>Solved</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-sm text-gray-400">
                <XCircle className="w-4 h-4" />
                <span>Unsolved</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Description and test cases */}
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'description'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'submissions'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              My Submissions
            </button>
            <button
              onClick={() => setActiveTab('discussion')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'discussion'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Discussion
            </button>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'description' && (
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h2 className="text-lg font-semibold text-white mb-4">Problem Description</h2>
                  <div className="prose prose-invert max-w-none">
                    <div className="text-gray-300 whitespace-pre-line">{problem.description}</div>
                  </div>
                </div>

                {/* Starter Code */}
                {problem.starter_code && (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                    <h2 className="text-lg font-semibold text-white mb-4">Starter Code</h2>
                    <CodeEditor
                      initialCode={problem.starter_code}
                      language={language}
                      readOnly={true}
                      showRunButton={false}
                      height="200px"
                    />
                  </div>
                )}

                {/* Sample Test Cases */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h2 className="text-lg font-semibold text-white mb-4">Sample Test Cases</h2>
                  {problem.test_cases && problem.test_cases.length > 0 ? (
                    <div className="space-y-4">
                      {problem.test_cases.map((result, index) => (
                        <div key={result.id} className="bg-gray-700 rounded-lg p-3">
                          <div className="text-sm font-medium text-purple-400 mb-2">Example {index + 1}</div>
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Input:</div>
                              <pre className="bg-gray-800 p-2 rounded text-gray-300 text-sm overflow-x-auto">
                                {result.input}
                              </pre>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Expected Output:</div>
                              <pre className="bg-gray-800 p-2 rounded text-gray-300 text-sm overflow-x-auto">
                                {result.expected_output}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-4">No sample test cases available</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h2 className="text-lg font-semibold text-white mb-4">My Submissions</h2>
                {!user ? (
                  <div className="text-center py-6">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <p className="text-gray-300 mb-2">You need to be logged in to view your submissions</p>
                  </div>
                ) : (
                  <ProblemSubmissionsList
                    submissions={submissions}
                    loading={submissionsLoading}
                    error={null}
                  />
                )}
              </div>
            )}

            {activeTab === 'discussion' && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h2 className="text-lg font-semibold text-white mb-4">Discussion</h2>
                <div className="text-center py-6">
                  <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-300 mb-2">No discussions yet</p>
                  <p className="text-gray-400 text-sm">Be the first to start a discussion about this problem</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Code editor and submission */}
        <div className="space-y-6">
          {/* Code Editor */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-300">Your Solution</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={copyCode}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                  title="Copy code"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={downloadCode}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                  title="Download code"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-0">
              <CodeEditor
                initialCode={code}
                language={language}
                onCodeChange={setCode}
                readOnly={false}
                showRunButton={false}
                height="400px"
              />
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Test Results</h2>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-white">Test Case {index + 1}</div>
                      {result.passed ? (
                        <span className="flex items-center text-green-500 text-sm">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Passed
                        </span>
                      ) : (
                        <span className="flex items-center text-red-500 text-sm">
                          <XCircle className="w-4 h-4 mr-1" />
                          Failed
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Input:</div>
                        <pre className="bg-gray-800 p-2 rounded text-gray-300 text-xs overflow-x-auto">
                          {result.input}
                        </pre>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Expected Output:</div>
                        <pre className="bg-gray-800 p-2 rounded text-gray-300 text-xs overflow-x-auto">
                          {result.expected_output}
                        </pre>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Your Output:</div>
                        <pre className="bg-gray-800 p-2 rounded text-gray-300 text-xs overflow-x-auto">
                          {result.actual_output}
                        </pre>
                      </div>
                      {result.execution_time_ms && (
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Execution time: {result.execution_time_ms}ms</span>
                          <span>Memory used: {result.memory_used_mb?.toFixed(2) || 0}MB</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output */}
          {output && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 bg-gray-700 border-b border-gray-600">
                <span className="text-sm font-medium text-gray-300">Output</span>
              </div>
              <div className="p-4 bg-gray-900 text-gray-100 font-mono text-sm overflow-auto max-h-40">
                <pre className="whitespace-pre-wrap">{output}</pre>
              </div>
            </div>
          )}

          {/* Submission Status */}
          {submissionStatus && (
            <div className={`p-4 rounded-lg ${
              submissionStatus === 'accepted'
                ? 'bg-green-900 bg-opacity-30 border border-green-700'
                : submissionStatus === 'error'
                ? 'bg-red-900 bg-opacity-30 border border-red-700'
                : submissionStatus === 'compilation_error' || submissionStatus === 'runtime_error'
                ? 'bg-red-900 bg-opacity-30 border border-red-700'
                : 'bg-yellow-900 bg-opacity-30 border border-yellow-700'
            }`}>
              <div className="flex items-center space-x-2">
                {submissionStatus === 'accepted' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : submissionStatus === 'error'
                ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : submissionStatus === 'compilation_error' || submissionStatus === 'runtime_error'
                ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-yellow-500" />
                )}
                <span className={`font-medium ${
                  submissionStatus === 'accepted'
                    ? 'text-green-400'
                    : submissionStatus === 'error'
                    ? 'text-red-400'
                    : submissionStatus === 'compilation_error' || submissionStatus === 'runtime_error'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }`}>
                  {submissionStatus === 'accepted'
                    ? 'All test cases passed! Problem completed.'
                    : submissionStatus === 'error'
                    ? 'An error occurred during submission.'
                    : submissionStatus === 'compilation_error'
                    ? 'Compilation Error: Please check your code syntax.'
                    : submissionStatus === 'runtime_error'
                    ? 'Runtime Error: Your code crashed during execution.'
                    : 'Some test cases failed. Try again!'}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleRunCode}
              disabled={isRunning || !code.trim() || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Run Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !code.trim() || isRunning}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetailPage;
