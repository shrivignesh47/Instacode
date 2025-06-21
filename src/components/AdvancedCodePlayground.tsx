import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Square, Copy, Download, Maximize2, Monitor, Settings, Save, Eye, Code, Zap, Loader2 } from 'lucide-react';
import { executeCode, getFileExtension, getSupportedLanguages } from '../utils/codeRunner';
import RecordingControls from './RecordingControls';
import VideoProcessor from './VideoProcessor';
import { useRecording } from '../hooks/useRecording';

interface AdvancedCodePlaygroundProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  initialLanguage?: string;
  onCreatePost?: (videoBlob: Blob, code: string, language: string) => void;
}

const AdvancedCodePlayground: React.FC<AdvancedCodePlaygroundProps> = ({
  isOpen,
  onClose,
  initialCode = '',
  initialLanguage = 'javascript',
  onCreatePost
}) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState('dark');
  const [showInput, setShowInput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [visualizationSteps, setVisualizationSteps] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const {
    isRecording,
    isScreenRecording,
    isVoiceRecording,
    isCameraRecording,
    recordingTime,
    startRecording,
    stopRecording,
    toggleScreen,
    toggleVoice,
    toggleCamera,
    toggleCameraFacingMode,
    recordedBlob,
    cameraStream,
    cameraFacingMode
  } = useRecording();

  const supportedLanguages = getSupportedLanguages();

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Load default template when language changes
  useEffect(() => {
    if (!code.trim()) {
      const templates: Record<string, string> = {
        'javascript': `// JavaScript Example
console.log("Hello, World!");

// Try some basic operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled numbers:", doubled);

// Function example
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Developer"));`,
        'python': `# Python Example
print("Hello, World!")

# Try some basic operations
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print("Doubled numbers:", doubled)

# Function example
def greet(name):
    return f"Hello, {name}!"

print(greet("Developer"))`,
        'java': `// Java Example
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Array example
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.print("Doubled numbers: ");
        for (int num : numbers) {
            System.out.print((num * 2) + " ");
        }
        System.out.println();
        
        // Method example
        System.out.println(greet("Developer"));
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`
      };
      
      setCode(templates[language] || `// Write your ${language} code here...\nconsole.log("Hello, World!");`);
    }
  }, [language]);

  if (!isOpen) return null;

  const runCode = async () => {
    if (!code.trim()) {
      setOutput('Error: No code to execute');
      return;
    }

    setIsRunning(true);
    setOutput('Running...\n');

    try {
      console.log('Executing code:', { code, language, input });
      const result = await executeCode(code, language, input);
      console.log('Execution result:', result);
      
      if (!result || result.trim() === '') {
        setOutput('Program executed successfully. No output was generated.');
      } else {
        setOutput(result);
      }
    } catch (error) {
      console.error('Code execution error:', error);
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
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
    a.download = `code${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveSession = () => {
    const session = {
      code,
      language,
      input,
      output,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('codingSession', JSON.stringify(session));
    console.log('Session saved');
  };

  const loadSession = () => {
    const saved = localStorage.getItem('codingSession');
    if (saved) {
      const session = JSON.parse(saved);
      setCode(session.code || '');
      setLanguage(session.language || 'javascript');
      setInput(session.input || '');
      setOutput(session.output || '');
      console.log('Session loaded');
    }
  };

  const handleCreatePost = () => {
    if (recordedBlob && onCreatePost) {
      onCreatePost(recordedBlob, code, language);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    w-full p-4 bg-gray-900 text-gray-100 font-mono border border-gray-600 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
    resize-none overflow-auto transition-all duration-200
  `;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-4 ${isFullscreen ? 'p-0' : ''}`}>
      <div className={`bg-gray-800 rounded-xl border border-gray-700 overflow-hidden ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-7xl h-[95vh]'} flex flex-col`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-2 sm:p-4 border-b border-gray-700 bg-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
            <h2 className="text-base sm:text-xl font-semibold text-white whitespace-nowrap">Advanced Code Playground</h2>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-2 py-1 sm:px-3 sm:py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            
            {/* Recording Status */}
            {isRecording && (
              <div className="flex items-center space-x-1 sm:space-x-2 px-2 py-1 sm:px-3 sm:py-2 bg-red-600 rounded-lg">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-xs sm:font-medium sm:text-sm">{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Recording Controls */}
            <div className="hidden sm:block">
              <RecordingControls
                isRecording={isRecording}
                isScreenRecording={isScreenRecording}
                isVoiceRecording={isVoiceRecording}
                isCameraRecording={isCameraRecording}
                cameraFacingMode={cameraFacingMode}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onToggleScreen={toggleScreen}
                onToggleVoice={toggleVoice}
                onToggleCamera={toggleCamera}
                onToggleCameraFacingMode={toggleCameraFacingMode}
              />
            </div>
            
            <button
              onClick={() => setShowVisualization(!showVisualization)}
              className={`p-1 sm:p-2 ${showVisualization ? 'text-purple-400 bg-gray-600' : 'text-gray-400'} hover:text-white hover:bg-gray-600 rounded transition-colors`}
              title="Visualize code"
            >
              <Zap className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowInput(!showInput)}
              className="p-1 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
              title="Toggle input panel"
            >
              <Monitor className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <button
              onClick={saveSession}
              className="p-1 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
              title="Save session"
            >
              <Save className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-1 sm:p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Recording Controls */}
        <div className="sm:hidden p-2 border-b border-gray-600 bg-gray-700 flex justify-center">
          <RecordingControls
            isRecording={isRecording}
            isScreenRecording={isScreenRecording}
            isVoiceRecording={isVoiceRecording}
            isCameraRecording={isCameraRecording}
            cameraFacingMode={cameraFacingMode}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onToggleScreen={toggleScreen}
            onToggleVoice={toggleVoice}
            onToggleCamera={toggleCamera}
            onToggleCameraFacingMode={toggleCameraFacingMode}
          />
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-2 sm:p-4 border-b border-gray-600 bg-gray-700">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <div className="flex items-center space-x-2">
                <label className="text-xs sm:text-sm text-gray-300">Font Size:</label>
                <button
                  onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                  className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  A-
                </button>
                <span className="text-xs text-gray-400 w-6 text-center">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                  className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  A+
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-xs sm:text-sm text-gray-300">Theme:</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs sm:text-sm"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="blue">Blue</option>
                </select>
              </div>
              
              <button
                onClick={loadSession}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded transition-colors"
              >
                Load Session
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Side - Editor + Camera */}
          <div className="flex-1 flex flex-col">
            
            {/* Camera Preview */}
            {isCameraRecording && (
              <div className="relative p-2 border-b border-gray-600">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-24 h-18 sm:w-32 sm:h-24 bg-gray-900 rounded border border-gray-600 object-cover"
                />
                <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            )}
            
            {/* Code Editor */}
            <div className="flex-1 flex flex-col">
              <div className="px-2 sm:px-4 py-2 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-gray-300">Code Editor</span>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={runCode}
                    disabled={isRunning || !code.trim()}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs sm:text-sm rounded transition-colors"
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
                  
                  <button
                    onClick={copyCode}
                    className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    title="Copy code"
                  >
                    <Copy className="w-3 sm:w-4 h-3 sm:h-4" />
                  </button>
                  
                  <button
                    onClick={downloadCode}
                    className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    title="Download code"
                  >
                    <Download className="w-3 sm:w-4 h-3 sm:h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 p-2 sm:p-4">
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={`Write your ${language} code here...`}
                  className={editorClasses}
                  style={{ 
                    fontSize: `${fontSize}px`,
                    lineHeight: '1.5',
                    height: '100%'
                  }}
                  spellCheck={false}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const start = e.currentTarget.selectionStart;
                      const end = e.currentTarget.selectionEnd;
                      const newCode = code.substring(0, start) + '  ' + code.substring(end);
                      setCode(newCode);
                      
                      setTimeout(() => {
                        if (textareaRef.current) {
                          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                        }
                      }, 0);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Side - Input + Output + Visualization */}
          <div className="flex-1 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-600">
            
            {/* Input Panel */}
            {showInput && (
              <div className="border-b border-gray-600">
                <div className="px-2 sm:px-4 py-2 bg-gray-700 border-b border-gray-600">
                  <span className="text-xs sm:text-sm font-medium text-gray-300">Program Input</span>
                </div>
                <div className="p-2 sm:p-4">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter input for your program..."
                    className="w-full h-16 sm:h-20 p-2 sm:p-3 bg-gray-900 text-gray-100 font-mono text-xs sm:text-sm border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
              </div>
            )}
            
            {/* Visualization Panel */}
            {showVisualization && (
              <div className="border-b border-gray-600 flex flex-col">
                <div className="px-2 sm:px-4 py-2 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-300">Code Visualization</span>
                  <div className="flex items-center space-x-1 sm:space-x-2">
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
                </div>
                <div className="p-3 sm:p-4 bg-gray-800 text-gray-100 overflow-y-auto" style={{ maxHeight: '250px' }}>
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
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Zap className="w-10 h-10 text-purple-500 mb-3" />
                      <h3 className="text-lg font-medium text-white mb-2">Code Visualization</h3>
                      <p className="text-sm text-gray-400 max-w-md">
                        Click "Analyze" to visualize your code execution. This feature helps you understand how your code works, step by step.
                      </p>
                      <div className="mt-4 p-3 bg-gray-700 rounded-lg text-xs text-left w-full">
                        <p className="text-purple-400 font-medium mb-1">Supported visualizations:</p>
                        <ul className="list-disc list-inside text-gray-300 space-y-1">
                          <li>Data structures (arrays, linked lists, trees)</li>
                          <li>Algorithms (sorting, searching, traversal)</li>
                          <li>Function calls and execution flow</li>
                          <li>Object-oriented patterns</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Output Panel */}
            <div className="flex-1 flex flex-col">
              <div className="px-2 sm:px-4 py-2 bg-gray-700 border-b border-gray-600">
                <span className="text-xs sm:text-sm font-medium text-gray-300">Output</span>
              </div>
              <div className="flex-1 p-2 sm:p-4 bg-gray-900 text-gray-100 font-mono text-xs sm:text-sm overflow-auto">
                {output ? (
                  <pre className="whitespace-pre-wrap" style={{ fontSize: `${fontSize}px` }}>{output}</pre>
                ) : (
                  <div className="text-gray-500 italic">Click "Run" to execute your code</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Processing & Upload */}
        {recordedBlob && (
          <VideoProcessor
            videoBlob={recordedBlob}
            onCreatePost={handleCreatePost}
            code={code}
            language={language}
          />
        )}
      </div>
    </div>
  );
};

export default AdvancedCodePlayground;