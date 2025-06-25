import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { ProblemSubmissionWithUser } from '../lib/supabaseClient';

interface ProblemSubmissionsListProps {
  submissions: ProblemSubmissionWithUser[];
  loading?: boolean;
  error?: string | null;
}

const ProblemSubmissionsList: React.FC<ProblemSubmissionsListProps> = ({
  submissions,
  loading = false,
  error = null
}) => {
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No submissions found
        </div>
      ) : (
        submissions.map((submission) => (
          <div
            key={submission.id}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={submission.profiles.avatar_url || '/default-avatar.png'}
                  alt={submission.profiles.display_name || submission.profiles.username}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-white font-medium">
                    {submission.profiles.display_name || submission.profiles.username}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {submission.problems?.title || 'Problem'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {submission.status === 'accepted' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : submission.status === 'pending' ? (
                  <Clock className="w-5 h-5 text-yellow-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  submission.status === 'accepted' ? 'text-green-500' :
                  submission.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {submission.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-gray-400 text-sm">
                Submitted on {new Date(submission.created_at).toLocaleDateString()}
              </p>
              <div className="bg-gray-700 rounded-lg p-3 overflow-x-auto">
                <pre className="text-white text-sm whitespace-pre">
                  <code>{submission.code}</code>
                </pre>
              </div>
              <p className="text-gray-400 text-sm">
                Language: {submission.language}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ProblemSubmissionsList;
