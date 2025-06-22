import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileUp, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { parseExcelFile, generateExcelTemplate, uploadProblems, ProblemTemplate } from '../utils/excelUploadUtils';

interface ProblemExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ProblemExcelUploadModal: React.FC<ProblemExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedProblems, setParsedProblems] = useState<ProblemTemplate[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

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

  const handleParseFile = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const problems = await parseExcelFile(file);
      setParsedProblems(problems);
      setStep('preview');
    } catch (err) {
      console.error('Error parsing file:', err);
      setError('Failed to parse file. Please ensure it follows the template format.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!user) {
      setError('You must be logged in to upload problems');
      return;
    }

    if (parsedProblems.length === 0) {
      setError('No problems to upload');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadProblems(parsedProblems, user.id);
      
      if (result.success) {
        setSuccess(`Successfully uploaded ${result.count} problems!`);
        setStep('complete');
        onSuccess();
      } else {
        throw new Error(result.error || 'Failed to upload problems');
      }
    } catch (err: any) {
      console.error('Error uploading problems:', err);
      setError(err.message || 'Failed to upload problems');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setParsedProblems([]);
    setError(null);
    setSuccess(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {step === 'upload' ? 'Upload Problems from Excel' : 
             step === 'preview' ? 'Preview Problems' : 
             'Upload Complete'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900 bg-opacity-50 border border-green-500 rounded-lg p-4 mb-6 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          )}

          {step === 'upload' && (
            <>
              <p className="text-gray-300 mb-6">
                Upload an Excel file containing coding problems. You can download our template to ensure your file is formatted correctly.
              </p>
              
              <div className="mb-6">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template</span>
                </button>
              </div>
              
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-6 hover:border-purple-500 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-file-input"
                />
                <label htmlFor="excel-file-input" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-white mb-2">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Excel files only (.xlsx, .xls)
                  </p>
                </label>
              </div>
              
              {file && (
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileUp className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-white">{file.name}</p>
                        <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'preview' && (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-2">
                  Preview ({parsedProblems.length} problems)
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Review the problems before uploading. Make sure everything looks correct.
                </p>
                
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
                        {problem.tags && problem.tags.slice(0, 3).map((tag, tagIndex) => (
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
            </>
          )}

          {step === 'complete' && (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Upload Complete!</h3>
              <p className="text-gray-300 mb-6">
                Your problems have been successfully uploaded and are now available in the problems list.
              </p>
              <button
                onClick={resetModal}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Upload More Problems
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'complete' && (
          <div className="flex justify-end space-x-4 p-6 border-t border-gray-700">
            {step === 'preview' && (
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            {step === 'upload' && (
              <button
                onClick={handleParseFile}
                disabled={!file || isParsing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="w-4 h-4" />
                    <span>Preview Problems</span>
                  </>
                )}
              </button>
            )}
            
            {step === 'preview' && (
              <button
                onClick={handleUpload}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemExcelUploadModal;