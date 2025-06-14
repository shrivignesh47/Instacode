import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Copy, Download, Maximize2, Minimize2 } from 'lucide-react';
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