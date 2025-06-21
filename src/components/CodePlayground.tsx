import React, { useState } from 'react';
import { X, Play, Copy, Download, Square, Zap, Eye, Loader2 } from 'lucide-react';
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
  const [showVisualization, setShowVisualization] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [visualizationSteps, setVisualizationSteps] = useState<any[]>([]);

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

  const visualizeCode = async () => {
    if (!code.trim()) {
      setOutput('Error: No code to visualize');
      return;
    }

    setIsVisualizing(true);
    setVisualizationSteps([]);

    try {
      // This is a placeholder for actual code visualization logic
      // In a real implementation, this would parse the code and generate visualization steps
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock visualization steps based on code type
      let mockSteps = [];
      
      if (code.includes('function') || code.includes('def ') || code.includes('class')) {
        // Function or class visualization
        mockSteps = [
          { type: 'info', content: 'Parsing code structure...' },
          { type: 'structure', content: 'Identified code structure: ' + (code.includes('class') ? 'Class definition' : 'Function definition') },
          { type: 'explanation', content: 'This code defines a ' + (code.includes('class') ? 'class' : 'function') + ' that can be used to organize and reuse code.' },
          { type: 'suggestion', content: 'Consider adding more comments to explain the purpose of this ' + (code.includes('class') ? 'class' : 'function') + '.' }
        ];
      } else if (code.includes('for') || code.includes('while')) {
        // Loop visualization
        mockSteps = [
          { type: 'info', content: 'Analyzing loop structure...' },
          { type: 'structure', content: 'Identified loop pattern: ' + (code.includes('for') ? 'For loop' : 'While loop') },
          { type: 'explanation', content: 'This loop iterates through a sequence of values, executing the code block for each iteration.' },
          { type: 'suggestion', content: 'Watch for potential infinite loops or off-by-one errors in your loop conditions.' }
        ];
      } else if (code.includes('array') || code.includes('[]') || code.includes('list')) {
        // Array/list visualization
        mockSteps = [
          { type: 'info', content: 'Analyzing data structures...' },
          { type: 'structure', content: 'Identified data structure: Array/List' },
          { type: 'explanation', content: 'This code manipulates an array or list, which is a collection of ordered elements.' },
          { type: 'suggestion', content: 'Consider using array methods like map, filter, or reduce for more concise operations.' }
        ];
      } else {
        // Generic code visualization
        mockSteps = [
          { type: 'info', content: 'Analyzing code...' },
          { type: 'structure', content: 'Basic code structure identified' },
          { type: 'explanation', content: 'This code appears to be a simple script with sequential execution.' },
          { type: 'suggestion', content: 'Consider structuring your code into functions for better organization and reusability.' }
        ];
      }
      
      setVisualizationSteps(mockSteps);
    } catch (error) {
      console.error('Code visualization error:', error);
      setVisualizationSteps([
        { type: 'error', content: `Visualization failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}` }
      ]);
    } finally {
      setIsVisualizing(false);
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

  const getStepTypeStyle = (type: string) => {
    switch (type) {
      case 'info': return 'text-blue-400';
      case 'structure': return 'text-purple-400';
      case 'explanation': return 'text-green-400';
      case 'suggestion': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-300';
    }
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
              onClick={() => setShowVisualization(!showVisualization)}
              className={`flex items-center space-x-2 px-3 py-2 ${showVisualization ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'} text-white rounded-lg transition-colors`}
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Visualize</span>
            </button>
            
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

          {/* Right Panel (Output or Visualization) */}
          <div className="flex-1 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-600">
            {showVisualization ? (
              <>
                <div className="px-4 py-2 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Code Visualization</span>
                  <button
                    onClick={visualizeCode}
                    disabled={isVisualizing || !code.trim()}
                    className="flex items-center space-x-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
                  >
                    {isVisualizing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Analyze</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 p-4 bg-gray-800 text-gray-100 overflow-auto">
                  {visualizationSteps.length > 0 ? (
                    <div className="space-y-3">
                      {visualizationSteps.map((step, index) => (
                        <div key={index} className="p-3 bg-gray-700 rounded-lg">
                          <div className={`font-medium mb-1 ${getStepTypeStyle(step.type)}`}>
                            {step.type.charAt(0).toUpperCase() + step.type.slice(1)}:
                          </div>
                          <div className="text-sm text-gray-300">{step.content}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Zap className="w-10 h-10 text-purple-500 mb-3" />
                      <h3 className="text-lg font-medium text-white mb-2">Code Visualization</h3>
                      <p className="text-sm text-gray-400 max-w-md">
                        Click "Analyze" to visualize your code execution. This feature helps you understand how your code works, step by step.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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