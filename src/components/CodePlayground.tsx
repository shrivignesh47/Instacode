import React, { useState } from 'react';
import { X, Play, Copy, Download, Square } from 'lucide-react';
import { executeCode, getFileExtension, getSupportedLanguages } from '../utils/codeRunner';

interface CodePlaygroundProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  initialLanguage?: string;
}

const CodePlayground: React.FC<CodePlaygroundProps> = ({
  isOpen,
  onClose,
  initialCode = '',
  initialLanguage = 'javascript'
}) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const supportedLanguages = getSupportedLanguages();

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...\n');

    try {
      const result = await executeCode(code, language);
      setOutput(result);
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
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
    a.download = `code.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">Code Playground</h2>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={runCode}
              disabled={isRunning || !code.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isRunning ? (
                <>
                  <Square className="w-4 h-4" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Code</span>
                </>
              )}
            </button>
            
            <button
              onClick={copyCode}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Copy code"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            <button
              onClick={downloadCode}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Download code"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Editor Panel */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 bg-gray-700 border-b border-gray-600">
              <span className="text-sm font-medium text-gray-300 flex items-center">
                <span className="mr-2">Editor</span>
                <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                  {language.toUpperCase()}
                </span>
              </span>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`Write your ${language} code here...`}
                className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                spellCheck={false}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const newCode = code.substring(0, start) + '  ' + code.substring(end);
                    setCode(newCode);
                    
                    // Set cursor position after the inserted spaces
                    setTimeout(() => {
                      e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                    }, 0);
                  }
                }}
              />
            </div>
          </div>

          {/* Output Panel */}
          <div className="flex-1 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-600">
            <div className="px-4 py-2 bg-gray-700 border-b border-gray-600">
              <span className="text-sm font-medium text-gray-300">Output</span>
            </div>
            <div className="flex-1 p-4 bg-gray-900 text-gray-100 font-mono text-sm overflow-auto">
              {output ? (
                <pre className="whitespace-pre-wrap">{output}</pre>
              ) : (
                <div className="text-gray-500 italic">Click "Run Code" to execute your program</div>
              )}
            </div>
          </div>
        </div>

        {/* HTML Preview */}
        {language.toLowerCase() === 'html' && code && (
          <div className="border-t border-gray-600 h-64">
            <div className="px-4 py-2 bg-gray-700 border-b border-gray-600">
              <span className="text-sm font-medium text-gray-300">Live Preview</span>
            </div>
            <div className="h-full p-4 bg-white">
              <iframe
                srcDoc={code}
                className="w-full h-full border border-gray-300 rounded"
                title="HTML Preview"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodePlayground;