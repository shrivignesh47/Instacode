import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Copy, Download, Maximize2, Minimize2, Zap, Eye, Loader2 } from 'lucide-react';
import { executeCode, getFileExtension } from '../utils/codeRunner';

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  onCodeChange?: (code: string) => void;
  readOnly?: boolean;
  showRunButton?: boolean;
  height?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode = '',
  language = 'javascript',
  onCodeChange,
  readOnly = false,
  showRunButton = true,
  height = '400px'
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showVisualization, setShowVisualization] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [visualizationSteps, setVisualizationSteps] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (onCodeChange) {
      onCodeChange(code);
    }
  }, [code, onCodeChange]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
  };

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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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

  const editorClasses = `
    w-full p-4 bg-gray-900 text-gray-100 font-mono text-sm border border-gray-600 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
    resize-none overflow-auto
  `;

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900 p-4' : 'relative'}`}>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-700 border-b border-gray-600">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-300 capitalize flex items-center">
              <span className="mr-2">{language}</span>
              <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                {language.toUpperCase()}
              </span>
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                A-
              </button>
              <span className="text-xs text-gray-400">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(20, fontSize + 1))}
                className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                A+
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowVisualization(!showVisualization)}
              className={`p-1.5 ${showVisualization ? 'text-purple-400 bg-gray-600' : 'text-gray-400'} hover:text-white hover:bg-gray-600 rounded transition-colors`}
              title="Visualize code"
            >
              <Zap className="w-4 h-4" />
            </button>
            
            {showRunButton && (
              <button
                onClick={runCode}
                disabled={isRunning || !code.trim()}
                className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
              >
                {isRunning ? (
                  <>
                    <Square className="w-3 h-3" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>Run</span>
                  </>
                )}
              </button>
            )}
            
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
            
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            placeholder={`Write your ${language} code here...`}
            className={editorClasses}
            style={{ 
              height: isFullscreen ? 'calc(60vh - 100px)' : height,
              fontSize: `${fontSize}px`,
              lineHeight: '1.5',
              tabSize: 2
            }}
            readOnly={readOnly}
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
                  if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                  }
                }, 0);
              }
            }}
          />
        </div>

        {/* Visualization Panel */}
        {showVisualization && (
          <div className="border-t border-gray-600">
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
            <div className="p-3 bg-gray-800 text-gray-100 overflow-y-auto" style={{ maxHeight: '200px' }}>
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
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <Zap className="w-8 h-8 text-purple-500 mb-2" />
                  <h3 className="text-base font-medium text-white mb-1">Code Visualization</h3>
                  <p className="text-xs text-gray-400 max-w-md">
                    Click "Analyze" to visualize your code execution.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Output */}
        {showRunButton && (
          <div className="border-t border-gray-600">
            <div className="px-4 py-2 bg-gray-700 border-b border-gray-600">
              <span className="text-sm font-medium text-gray-300">Output</span>
            </div>
            <div
              className="p-4 bg-gray-900 text-gray-100 font-mono text-sm overflow-auto"
              style={{ 
                height: isFullscreen ? 'calc(40vh - 100px)' : '150px',
                fontSize: `${fontSize}px`
              }}
            >
              {output ? (
                <pre className="whitespace-pre-wrap">{output}</pre>
              ) : (
                <div className="text-gray-500 italic">Click "Run" to execute your code</div>
              )}
            </div>
          </div>
        )}

        {/* HTML Preview */}
        {language.toLowerCase() === 'html' && output && code && (
          <div className="border-t border-gray-600">
            <div className="px-4 py-2 bg-gray-700 border-b border-gray-600">
              <span className="text-sm font-medium text-gray-300">Preview</span>
            </div>
            <div className="p-4 bg-white" style={{ height: '200px' }}>
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
      
      {isFullscreen && (
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;