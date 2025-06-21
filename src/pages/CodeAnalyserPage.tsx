import React, { useState, useRef } from 'react';
import { Zap, Code, Play, Download, Copy, Share2, Loader2, AlertCircle, CheckCircle, Info, Lightbulb, FileCode, ArrowRight } from 'lucide-react';
import { getSupportedLanguages, getFileExtension } from '../utils/codeRunner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeAnalyserPage = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'structure' | 'explanation' | 'suggestions' | 'visualization'>('structure');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const supportedLanguages = getSupportedLanguages();

  const analyseCode = async () => {
    if (!code.trim()) {
      return;
    }

    setIsAnalysing(true);
    setAnalysisResult(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // This is a placeholder for actual code analysis
      // In a real implementation, this would call a backend service
      const mockAnalysis = generateMockAnalysis(code, language);
      setAnalysisResult(mockAnalysis);
    } catch (error) {
      console.error('Error analysing code:', error);
    } finally {
      setIsAnalysing(false);
    }
  };

  const generateMockAnalysis = (codeToAnalyse: string, lang: string) => {
    // Detect code patterns
    const hasClasses = codeToAnalyse.includes('class');
    const hasFunctions = codeToAnalyse.includes('function') || codeToAnalyse.includes('def ');
    const hasLoops = codeToAnalyse.includes('for') || codeToAnalyse.includes('while');
    const hasArrays = codeToAnalyse.includes('[]') || codeToAnalyse.includes('array') || codeToAnalyse.includes('list');
    const hasConditionals = codeToAnalyse.includes('if') || codeToAnalyse.includes('switch') || codeToAnalyse.includes('?');
    const hasComments = codeToAnalyse.includes('//') || codeToAnalyse.includes('/*') || codeToAnalyse.includes('#');
    
    // Generate structure analysis
    const structure = {
      type: hasClasses ? 'Object-Oriented' : hasFunctions ? 'Functional' : 'Procedural',
      components: [
        ...(hasClasses ? [{ name: 'Classes', count: countOccurrences(codeToAnalyse, 'class ') }] : []),
        ...(hasFunctions ? [{ name: 'Functions', count: countOccurrences(codeToAnalyse, 'function') + countOccurrences(codeToAnalyse, 'def ') }] : []),
        ...(hasLoops ? [{ name: 'Loops', count: countOccurrences(codeToAnalyse, 'for') + countOccurrences(codeToAnalyse, 'while') }] : []),
        ...(hasArrays ? [{ name: 'Data Structures', count: countOccurrences(codeToAnalyse, '[') }] : []),
        ...(hasConditionals ? [{ name: 'Conditionals', count: countOccurrences(codeToAnalyse, 'if') + countOccurrences(codeToAnalyse, 'switch') + countOccurrences(codeToAnalyse, '?') }] : []),
      ],
      complexity: calculateComplexity(codeToAnalyse),
      lineCount: codeToAnalyse.split('\n').length,
      commentLines: hasComments ? countCommentLines(codeToAnalyse) : 0,
    };
    
    // Generate explanation
    const explanation = {
      summary: generateSummary(codeToAnalyse, lang, structure),
      steps: generateExecutionSteps(codeToAnalyse, lang, structure),
    };
    
    // Generate suggestions
    const suggestions = generateSuggestions(codeToAnalyse, lang, structure);
    
    // Generate visualization data
    const visualization = {
      flowchart: generateFlowchartData(codeToAnalyse, structure),
      dataFlow: generateDataFlowData(codeToAnalyse, structure),
    };
    
    return {
      structure,
      explanation,
      suggestions,
      visualization,
    };
  };

  const countOccurrences = (str: string, searchValue: string) => {
    return (str.match(new RegExp(searchValue, 'g')) || []).length;
  };

  const calculateComplexity = (codeToAnalyse: string) => {
    // Simple cyclomatic complexity estimation
    const conditionals = countOccurrences(codeToAnalyse, 'if') + 
                        countOccurrences(codeToAnalyse, 'else if') + 
                        countOccurrences(codeToAnalyse, 'switch') + 
                        countOccurrences(codeToAnalyse, 'case') + 
                        countOccurrences(codeToAnalyse, '?') + 
                        countOccurrences(codeToAnalyse, 'for') + 
                        countOccurrences(codeToAnalyse, 'while') + 
                        countOccurrences(codeToAnalyse, 'catch');
    
    if (conditionals <= 5) return 'Low';
    if (conditionals <= 15) return 'Medium';
    return 'High';
  };

  const countCommentLines = (codeToAnalyse: string) => {
    const lines = codeToAnalyse.split('\n');
    let commentCount = 0;
    
    for (const line of lines) {
      if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('/*') || line.trim().includes('*/')) {
        commentCount++;
      }
    }
    
    return commentCount;
  };

  const generateSummary = (codeToAnalyse: string, lang: string, structure: any) => {
    if (structure.type === 'Object-Oriented') {
      return `This is an object-oriented ${lang} program that defines ${structure.components.find((c: any) => c.name === 'Classes')?.count || 0} classes. The code has a ${structure.complexity.toLowerCase()} complexity level with ${structure.lineCount} lines of code.`;
    } else if (structure.type === 'Functional') {
      return `This is a functional ${lang} program with ${structure.components.find((c: any) => c.name === 'Functions')?.count || 0} functions. The code has a ${structure.complexity.toLowerCase()} complexity level with ${structure.lineCount} lines of code.`;
    } else {
      return `This is a procedural ${lang} program with a ${structure.complexity.toLowerCase()} complexity level. It contains ${structure.lineCount} lines of code with a straightforward execution flow.`;
    }
  };

  const generateExecutionSteps = (codeToAnalyse: string, lang: string, structure: any) => {
    // This is a simplified mock implementation
    const steps = [];
    
    if (structure.type === 'Object-Oriented') {
      steps.push('Class definitions are loaded into memory');
      steps.push('Constructor methods initialize object instances');
      steps.push('Class methods are called based on program flow');
    } else if (hasFunctions(codeToAnalyse)) {
      steps.push('Function definitions are loaded into memory');
      steps.push('Main program execution begins');
      steps.push('Functions are called as needed during execution');
    } else {
      steps.push('Program execution begins from the top');
      steps.push('Code executes sequentially line by line');
      if (hasLoops(codeToAnalyse)) {
        steps.push('Loop iterations execute until termination condition is met');
      }
      if (hasConditionals(codeToAnalyse)) {
        steps.push('Conditional branches direct program flow based on conditions');
      }
    }
    
    return steps;
  };

  const hasFunctions = (codeToAnalyse: string) => {
    return codeToAnalyse.includes('function') || codeToAnalyse.includes('def ');
  };

  const hasLoops = (codeToAnalyse: string) => {
    return codeToAnalyse.includes('for') || codeToAnalyse.includes('while');
  };

  const hasConditionals = (codeToAnalyse: string) => {
    return codeToAnalyse.includes('if') || codeToAnalyse.includes('switch') || codeToAnalyse.includes('?');
  };

  const generateSuggestions = (codeToAnalyse: string, lang: string, structure: any) => {
    const suggestions = [];
    
    // Comment suggestions
    if (structure.commentLines < structure.lineCount * 0.1) {
      suggestions.push({
        type: 'improvement',
        title: 'Add more comments',
        description: 'Your code has few comments. Consider adding more documentation to improve readability and maintainability.',
      });
    }
    
    // Complexity suggestions
    if (structure.complexity === 'High') {
      suggestions.push({
        type: 'warning',
        title: 'High complexity detected',
        description: 'Consider breaking down complex logic into smaller, more manageable functions or methods.',
      });
    }
    
    // Function length suggestions
    if (structure.lineCount > 50 && structure.components.find((c: any) => c.name === 'Functions')?.count === 1) {
      suggestions.push({
        type: 'refactor',
        title: 'Long function detected',
        description: 'Consider breaking down this long function into smaller, more focused functions.',
      });
    }
    
    // Error handling suggestions
    if (!codeToAnalyse.includes('try') && !codeToAnalyse.includes('catch') && !codeToAnalyse.includes('except')) {
      suggestions.push({
        type: 'improvement',
        title: 'Add error handling',
        description: 'Your code lacks error handling. Consider adding try-catch blocks to handle potential exceptions.',
      });
    }
    
    // Add a generic suggestion if none were generated
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'info',
        title: 'Code looks good',
        description: 'No major issues detected. Your code follows good practices.',
      });
    }
    
    return suggestions;
  };

  const generateFlowchartData = (codeToAnalyse: string, structure: any) => {
    // This would normally generate data for a flowchart visualization
    // For this mock implementation, we'll return placeholder data
    return {
      nodes: [
        { id: 'start', label: 'Start', type: 'start' },
        { id: 'process', label: 'Process Data', type: 'process' },
        { id: 'decision', label: 'Check Condition', type: 'decision' },
        { id: 'end', label: 'End', type: 'end' },
      ],
      edges: [
        { from: 'start', to: 'process' },
        { from: 'process', to: 'decision' },
        { from: 'decision', to: 'end', label: 'Yes' },
        { from: 'decision', to: 'process', label: 'No' },
      ],
    };
  };

  const generateDataFlowData = (codeToAnalyse: string, structure: any) => {
    // This would normally generate data for a data flow visualization
    // For this mock implementation, we'll return placeholder data
    return {
      variables: [
        { name: 'input', type: 'array', value: '[1, 2, 3, 4, 5]' },
        { name: 'result', type: 'array', value: '[2, 4, 6, 8, 10]' },
      ],
      operations: [
        { name: 'map', input: 'input', output: 'result', description: 'Doubles each value' },
      ],
    };
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

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <Lightbulb className="w-5 h-5 text-yellow-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-400" />;
      case 'refactor': return <Code className="w-5 h-5 text-blue-400" />;
      case 'info': return <Info className="w-5 h-5 text-green-400" />;
      default: return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const renderVisualization = () => {
    if (!analysisResult) return null;

    switch (activeTab) {
      case 'structure':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Code Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Type</div>
                  <div className="text-xl font-bold text-white">{analysisResult.structure.type}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Complexity</div>
                  <div className="text-xl font-bold text-white">{analysisResult.structure.complexity}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Lines of Code</div>
                  <div className="text-xl font-bold text-white">{analysisResult.structure.lineCount}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Comment Lines</div>
                  <div className="text-xl font-bold text-white">{analysisResult.structure.commentLines}</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Components</h3>
              <div className="space-y-3">
                {analysisResult.structure.components.map((component: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <span className="text-white">{component.name}</span>
                    <span className="px-2 py-1 bg-purple-600 text-white rounded-full text-sm">{component.count}</span>
                  </div>
                ))}
                {analysisResult.structure.components.length === 0 && (
                  <div className="text-gray-400 text-center py-4">No components detected</div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'explanation':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Code Summary</h3>
              <p className="text-gray-300">{analysisResult.explanation.summary}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Execution Flow</h3>
              <div className="space-y-3">
                {analysisResult.explanation.steps.map((step: string, index: number) => (
                  <div key={index} className="flex items-start p-3 bg-gray-700 rounded-lg">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm mr-3 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="text-gray-300">{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'suggestions':
        return (
          <div className="space-y-4">
            {analysisResult.suggestions.map((suggestion: any, index: number) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-start">
                  <div className="mr-4 flex-shrink-0">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{suggestion.title}</h3>
                    <p className="text-gray-300">{suggestion.description}</p>
                  </div>
                </div>
              </div>
            ))}
            {analysisResult.suggestions.length === 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No suggestions</h3>
                <p className="text-gray-300">Your code looks good! No suggestions to make.</p>
              </div>
            )}
          </div>
        );
      
      case 'visualization':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Code Flowchart</h3>
              <div className="bg-gray-700 rounded-lg p-4 h-64 flex items-center justify-center">
                <div className="text-center">
                  <FileCode className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                  <p className="text-gray-300">Interactive flowchart visualization coming soon!</p>
                  <p className="text-gray-500 text-sm mt-2">This feature is under development.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Data Flow</h3>
              <div className="space-y-3">
                {analysisResult.visualization.dataFlow.variables.map((variable: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-400 font-mono">{variable.name}</span>
                      <span className="text-gray-400 text-sm">{variable.type}</span>
                    </div>
                    <div className="text-white font-mono text-sm bg-gray-800 p-2 rounded">{variable.value}</div>
                  </div>
                ))}
                
                {analysisResult.visualization.dataFlow.operations.map((operation: any, index: number) => (
                  <div key={index} className="flex items-center p-3 bg-gray-700 rounded-lg">
                    <div className="text-blue-400 font-mono">{operation.input}</div>
                    <ArrowRight className="mx-3 text-gray-500" />
                    <div className="text-green-400 font-mono">{operation.output}</div>
                    <div className="ml-auto text-gray-400 text-sm">{operation.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center">
          <Zap className="w-8 h-8 text-purple-500 mr-3" />
          CodeAnalyser
        </h1>
        <p className="text-gray-400">Analyze, visualize, and understand your code with powerful insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Input Section */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-700 border-b border-gray-600">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-300">Code Input</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
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
            </div>
          </div>
          
          <div className="p-4">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`Paste your ${language} code here to analyze...`}
              className="w-full h-96 p-4 bg-gray-900 text-gray-100 font-mono text-sm border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
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
          
          <div className="px-4 py-3 bg-gray-700 border-t border-gray-600 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {code ? `${code.split('\n').length} lines` : 'No code entered'}
            </div>
            
            <button
              onClick={analyseCode}
              disabled={isAnalysing || !code.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isAnalysing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analysing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Analyse Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Analysis Results Section */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-700 border-b border-gray-600">
            <h3 className="text-lg font-semibold text-white">Analysis Results</h3>
          </div>
          
          {isAnalysing ? (
            <div className="flex flex-col items-center justify-center p-12 h-96">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Analysing Your Code</h3>
              <p className="text-gray-400 text-center max-w-md">
                We're examining your code structure, identifying patterns, and generating insights...
              </p>
            </div>
          ) : analysisResult ? (
            <div className="flex flex-col h-[calc(100%-56px)]">
              {/* Tabs */}
              <div className="flex border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('structure')}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === 'structure'
                      ? 'text-purple-400 border-b-2 border-purple-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Structure
                </button>
                <button
                  onClick={() => setActiveTab('explanation')}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === 'explanation'
                      ? 'text-purple-400 border-b-2 border-purple-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Explanation
                </button>
                <button
                  onClick={() => setActiveTab('suggestions')}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === 'suggestions'
                      ? 'text-purple-400 border-b-2 border-purple-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Suggestions
                </button>
                <button
                  onClick={() => setActiveTab('visualization')}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === 'visualization'
                      ? 'text-purple-400 border-b-2 border-purple-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Visualization
                </button>
              </div>
              
              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {renderVisualization()}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 h-96">
              <Zap className="w-16 h-16 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Code Analyser</h3>
              <p className="text-gray-400 text-center max-w-md mb-6">
                Paste your code in the editor and click "Analyse Code" to get insights, visualizations, and suggestions.
              </p>
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <Code className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <h4 className="text-white font-medium mb-1">Structure Analysis</h4>
                  <p className="text-gray-400 text-sm">Understand your code's organization</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <Lightbulb className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <h4 className="text-white font-medium mb-1">Smart Suggestions</h4>
                  <p className="text-gray-400 text-sm">Get tips to improve your code</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Code Examples Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Example Code Snippets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* JavaScript Example */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
              <span className="text-sm font-medium text-white">JavaScript Array Example</span>
              <button 
                onClick={() => setCode(`// Array manipulation example
const numbers = [1, 2, 3, 4, 5];

// Map: Double each number
const doubled = numbers.map(num => num * 2);
console.log('Doubled:', doubled);

// Filter: Get only even numbers
const evens = numbers.filter(num => num % 2 === 0);
console.log('Even numbers:', evens);

// Reduce: Sum all numbers
const sum = numbers.reduce((total, num) => total + num, 0);
console.log('Sum:', sum);

// Find: Get first number greater than 3
const found = numbers.find(num => num > 3);
console.log('First number > 3:', found);`)}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded"
              >
                Use Example
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <SyntaxHighlighter language="javascript" style={oneDark} customStyle={{ margin: 0, padding: '1rem' }}>
{`// Array manipulation example
const numbers = [1, 2, 3, 4, 5];

// Map: Double each number
const doubled = numbers.map(num => num * 2);
console.log('Doubled:', doubled);

// Filter: Get only even numbers
const evens = numbers.filter(num => num % 2 === 0);
console.log('Even numbers:', evens);

// Reduce: Sum all numbers
const sum = numbers.reduce((total, num) => total + num, 0);
console.log('Sum:', sum);

// Find: Get first number greater than 3
const found = numbers.find(num => num > 3);
console.log('First number > 3:', found);`}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Python Example */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
              <span className="text-sm font-medium text-white">Python Class Example</span>
              <button 
                onClick={() => {
                  setCode(`# Simple Python class example
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
        
    def greet(self):
        return f"Hello, my name is {self.name} and I am {self.age} years old."
    
    def is_adult(self):
        return self.age >= 18

# Create instances
alice = Person("Alice", 25)
bob = Person("Bob", 17)

# Use methods
print(alice.greet())
print(f"Alice is an adult: {alice.is_adult()}")
print(bob.greet())
print(f"Bob is an adult: {bob.is_adult()}")`);
                  setLanguage('python');
                }}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded"
              >
                Use Example
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <SyntaxHighlighter language="python" style={oneDark} customStyle={{ margin: 0, padding: '1rem' }}>
{`# Simple Python class example
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
        
    def greet(self):
        return f"Hello, my name is {self.name} and I am {self.age} years old."
    
    def is_adult(self):
        return self.age >= 18

# Create instances
alice = Person("Alice", 25)
bob = Person("Bob", 17)

# Use methods
print(alice.greet())
print(f"Alice is an adult: {alice.is_adult()}")
print(bob.greet())
print(f"Bob is an adult: {bob.is_adult()}")`}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Java Example */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex justify-between items-center">
              <span className="text-sm font-medium text-white">Java Algorithm Example</span>
              <button 
                onClick={() => {
                  setCode(`// Binary search implementation in Java
public class BinarySearch {
    public static void main(String[] args) {
        int[] array = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        int target = 23;
        
        int result = binarySearch(array, target);
        
        if (result == -1) {
            System.out.println("Element not found");
        } else {
            System.out.println("Element found at index: " + result);
        }
    }
    
    // Binary search algorithm
    public static int binarySearch(int[] array, int target) {
        int left = 0;
        int right = array.length - 1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            
            // Check if target is at mid
            if (array[mid] == target) {
                return mid;
            }
            
            // If target is greater, ignore left half
            if (array[mid] < target) {
                left = mid + 1;
            } 
            // If target is smaller, ignore right half
            else {
                right = mid - 1;
            }
        }
        
        // Element not found
        return -1;
    }
}`);
                  setLanguage('java');
                }}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded"
              >
                Use Example
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <SyntaxHighlighter language="java" style={oneDark} customStyle={{ margin: 0, padding: '1rem' }}>
{`// Binary search implementation in Java
public class BinarySearch {
    public static void main(String[] args) {
        int[] array = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        int target = 23;
        
        int result = binarySearch(array, target);
        
        if (result == -1) {
            System.out.println("Element not found");
        } else {
            System.out.println("Element found at index: " + result);
        }
    }
    
    // Binary search algorithm
    public static int binarySearch(int[] array, int target) {
        int left = 0;
        int right = array.length - 1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            
            // Check if target is at mid
            if (array[mid] == target) {
                return mid;
            }
            
            // If target is greater, ignore left half
            if (array[mid] < target) {
                left = mid + 1;
            } 
            // If target is smaller, ignore right half
            else {
                right = mid - 1;
            }
        }
        
        // Element not found
        return -1;
    }
}`}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeAnalyserPage;