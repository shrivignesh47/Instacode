import React from 'react';
import { FileText, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useProblemImports } from '../hooks/useProblems';

interface ProblemImportsHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProblemImportsHistory: React.FC<ProblemImportsHistoryProps> = ({
  isOpen,
  onClose
}) => {
  const { imports, loading, error } = useProblemImports();

  if (!isOpen) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Problem Import History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin mr-2" />
              <span className="text-gray-300">Loading import history...</span>
            </div>
          ) : error ? (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 text-red-200">
              {error}
            </div>
          ) : imports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300 mb-2">No import history found</p>
              <p className="text-gray-400 text-sm">You haven't imported any problems yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {imports.map((importItem) => (
                <div key={importItem.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-medium">{importItem.file_name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(importItem.status)}
                      <span className={`text-sm capitalize ${
                        importItem.status === 'completed' ? 'text-green-400' :
                        importItem.status === 'failed' ? 'text-red-400' :
                        importItem.status === 'pending' ? 'text-yellow-400' :
                        importItem.status === 'processing' ? 'text-blue-400' :
                        'text-gray-400'
                      }`}>
                        {importItem.status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                    <div>Size: {(importItem.file_size / 1024).toFixed(2)} KB</div>
                    <div>Problems: {importItem.problems_count}</div>
                    <div>Date: {formatDate(importItem.created_at)}</div>
                    <div>User: {importItem.profiles.username}</div>
                  </div>
                  {importItem.error_message && (
                    <div className="mt-2 p-2 bg-red-900 bg-opacity-30 border border-red-700 rounded text-red-300 text-sm">
                      {importItem.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProblemImportsHistory;