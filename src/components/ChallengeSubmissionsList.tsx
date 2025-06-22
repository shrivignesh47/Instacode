import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Cpu, AlertCircle } from 'lucide-react';
import { SubmissionWithUser } from '../lib/supabaseClient';

interface ChallengeSubmissionsListProps {
  submissions: SubmissionWithUser[];
  loading: boolean;
  error: string | null;
  showChallengeName?: boolean;
}

const ChallengeSubmissionsList: React.FC<ChallengeSubmissionsListProps> = ({
  submissions,
  loading,
  error,
  showChallengeName = false
}) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-500';
      case 'wrong_answer':
        return 'text-red-500';
      case 'time_limit_exceeded':
        return 'text-yellow-500';
      case 'memory_limit_exceeded':
        return 'text-orange-500';
      case 'runtime_error':
      case 'compilation_error':
        return 'text-red-400';
      case 'pending':
      case 'running':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'wrong_answer':
        return <XCircle className="w-4 h-4" />;
      case 'time_limit_exceeded':
        return <Clock className="w-4 h-4" />;
      case 'memory_limit_exceeded':
        return <Cpu className="w-4 h-4" />;
      case 'runtime_error':
      case 'compilation_error':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
      case 'running':
        return <Clock className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-white">Loading submissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
        {error}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <XCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-300 mb-2">No submissions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div 
          key={submission.id} 
          className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors cursor-pointer"
          onClick={() => navigate(`/challenges/${submission.challenge_id}`)}
        >
          <div className="flex items-center justify-between mb-2">
            {showChallengeName && submission.challenges && (
              <h3 className="text-white font-medium">{submission.challenges.title}</h3>
            )}
            <div className="flex items-center space-x-2">
              <span className={`flex items-center space-x-1 ${getStatusColor(submission.status)}`}>
                {getStatusIcon(submission.status)}
                <span className="text-sm font-medium">
                  {submission.status.replace('_', ' ').toUpperCase()}
                </span>
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-between text-sm text-gray-400 mb-2">
            <div className="flex items-center space-x-4">
              <span>Language: {submission.language}</span>
              {submission.execution_time_ms && (
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{submission.execution_time_ms}ms</span>
                </span>
              )}
              {submission.memory_used_mb && (
                <span className="flex items-center space-x-1">
                  <Cpu className="w-4 h-4" />
                  <span>{submission.memory_used_mb}MB</span>
                </span>
              )}
            </div>
            <span>{formatDate(submission.created_at)}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {submission.test_cases_passed}/{submission.test_cases_total} test cases passed
            </span>
            <div className="w-full max-w-xs bg-gray-700 rounded-full h-1.5 ml-4">
              <div 
                className={`h-1.5 rounded-full ${
                  submission.status === 'accepted' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${(submission.test_cases_passed / submission.test_cases_total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChallengeSubmissionsList;