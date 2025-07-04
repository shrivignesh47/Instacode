import React, { useState } from 'react';
import { X, Play, Copy, Download, Square, Zap, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { executeCode, getFileExtension, getSupportedLanguages } from '../utils/codeRunner';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  const [currentStep, setCurrentStep] = useState(0);

  // Initialize Gemini API
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
    setCurrentStep(0);

    try {
      // Construct prompt for Gemini API
      const prompt = `
      Analyze this ${language} code and provide a detailed visualization of its execution:
      
      ${code}
      
      Return a JSON object with the following structure:
      {
        "frames": [
          {
            "lineNumber": number,
            "codeSnippet": "string",
            "description": "string",
            "objects": [
              {
                "name": "string",
                "type": "string",
                "value": "string",
                "change": "created|modified|unchanged"
              }
            ]
          }
        ]
      }
      
      Each frame should represent a step in the code execution, showing:
      1. The line number being executed
      2. The code snippet for that line
      3. A description of what happens
      4. The state of all relevant variables/objects at that point
      
      Focus on how variables and data structures change during execution.
      ONLY return valid JSON, no other text.
      `;

      // Call Gemini API
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      try {
        // Extract JSON from the response (in case there's any extra text)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No valid JSON found in response");
        }
        
        const jsonStr = jsonMatch[0];
        const data = JSON.parse(jsonStr);
        
        if (data && data.frames && Array.isArray(data.frames)) {
          setVisualizationSteps(data.frames);
        } else {
          throw new Error("Invalid visualization data structure");
        }
      } catch (parseError) {
        console.error("Error parsing visualization JSON:", parseError);
        // Fallback to simpler visualization if JSON parsing fails
        setVisualizationSteps([
          { 
            type: 'error', 
            content: `Visualization parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
            lineNumber: null,
            codeSnippet: null,
            objects: []
          }
        ]);
      }
    } catch (error) {
      console.error('Code visualization error:', error);
      setVisualizationSteps([
        { 
          type: 'error', 
          content: `Visualization failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          lineNumber: null,
          codeSnippet: null,
          objects: []
        }
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

  const getChangeStyle = (change: string) => {
    switch (change) {
      case 'created': return 'text-green-400';
      case 'modified': return 'text-yellow-400';
      case 'unchanged': return 'text-gray-400';
      default: return 'text-gray-400';
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
                  <div className="flex items-center space-x-2">
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
                    {visualizationSteps.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                          disabled={currentStep === 0}
                          className="p-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition-colors"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <span className="text-xs text-gray-300">
                          {currentStep + 1} / {visualizationSteps.length}
                        </span>
                        <button
                          onClick={() => setCurrentStep(Math.min(visualizationSteps.length - 1, currentStep + 1))}
                          disabled={currentStep === visualizationSteps.length - 1}
                          className="p-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition-colors"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 p-4 bg-gray-800 text-gray-100 overflow-auto">
                  {visualizationSteps.length > 0 ? (
                    <div>
                      {visualizationSteps[currentStep].type === 'error' ? (
                        <div className="p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg">
                          <div className="font-medium mb-1 text-red-400">Error:</div>
                          <div className="text-sm text-gray-300">{visualizationSteps[currentStep].content}</div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Frame information */}
                          {visualizationSteps[currentStep].lineNumber && (
                            <div className="p-3 bg-gray-700 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-purple-400">
                                  Line {visualizationSteps[currentStep].lineNumber}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Step {currentStep + 1} of {visualizationSteps.length}
                                </div>
                              </div>
                              {visualizationSteps[currentStep].codeSnippet && (
                                <div className="bg-gray-800 p-2 rounded mb-2 font-mono text-sm">
                                  {visualizationSteps[currentStep].codeSnippet}
                                </div>
                              )}
                              <div className="text-sm text-gray-300">
                                {visualizationSteps[currentStep].description}
                              </div>
                            </div>
                          )}
                          
                          {/* Objects state */}
                          {visualizationSteps[currentStep].objects && visualizationSteps[currentStep].objects.length > 0 && (
                            <div className="p-3 bg-gray-700 rounded-lg">
                              <div className="text-sm font-medium text-blue-400 mb-2">
                                Variable State:
                              </div>
                              <div className="space-y-2">
                                {visualizationSteps[currentStep].objects.map((obj: any, idx: number) => (
                                  <div key={idx} className="flex items-start p-2 bg-gray-800 rounded">
                                    <div className="w-1/4 font-mono text-xs text-gray-300">{obj.name}</div>
                                    <div className="w-1/4 text-xs text-gray-400">{obj.type}</div>
                                    <div className="w-1/3 font-mono text-xs text-white break-all">{obj.value}</div>
                                    <div className={`w-1/6 text-xs text-right ${getChangeStyle(obj.change)}`}>
                                      {obj.change}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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