import React, { useState, useRef } from 'react';
import { Zap, Code, Play, Download, Copy, Share2, Loader2, AlertCircle, CheckCircle, Info, Lightbulb, FileCode, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSupportedLanguages, getFileExtension } from '../utils/codeRunner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { GoogleGenerativeAI } from '@google/generative-ai';

const CodeAnalyserPage = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'structure' | 'explanation' | 'suggestions' | 'visualization'>('structure');
  const [currentFrame, setCurrentFrame] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Initialize Gemini API
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const supportedLanguages = getSupportedLanguages();

  const analyseCode = async () => {
    if (!code.trim()) {
      return;
    }

    setIsAnalysing(true);
    setAnalysisResult(null);

    try {
      // Construct prompt for Gemini API
      const prompt = `
      Analyze this ${language} code and provide a detailed analysis:
      
      ${code}
      
      Return a JSON object with the following structure:
      {
        "structure": {
          "type": "string", // Object-Oriented, Functional, or Procedural
          "components": [
            { "name": "string", "count": number }
          ],
          "complexity": "string", // Low, Medium, or High
          "lineCount": number,
          "commentLines": number
        },
        "explanation": {
          "summary": "string",
          "steps": ["string"]
        },
        "suggestions": [
          {
            "type": "string", // improvement, warning, refactor, info
            "title": "string",
            "description": "string"
          }
        ],
        "visualization": {
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
      }
      
      Focus on providing accurate analysis with helpful suggestions.
      For the visualization, show how variables and data structures change during execution.
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
        
        setAnalysisResult(data);
      } catch (parseError) {
        console.error("Error parsing analysis JSON:", parseError);
        // Fallback to mock analysis if JSON parsing fails
        setAnalysisResult(generateMockAnalysis(code, language));
      }
    } catch (error) {
      console.error('Error analysing code:', error);
      // Fallback to mock analysis if API call fails
      setAnalysisResult(generateMockAnalysis(code, language));
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
      frames: generateVisualizationFrames(codeToAnalyse, lang)
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

  const generateVisualizationFrames = (codeToAnalyse: string, lang: string) => {
    // This is a simplified mock implementation for visualization frames
    const frames = [];
    const lines = codeToAnalyse.split('\n');
    
    // Generate frames based on code type
    if (lang === 'javascript' || lang === 'typescript') {
      // For JavaScript/TypeScript code
      let variables: any = {};
      
      // Variable declaration frame
      const varDeclarations = lines.filter(line => 
        line.includes('var ') || 
        line.includes('let ') || 
        line.includes('const ')
      );
      
      for (let i = 0; i < varDeclarations.length; i++) {
        const line = varDeclarations[i];
        const lineNumber = lines.indexOf(line) + 1;
        
        // Simple variable extraction (this is a mock implementation)
        const match = line.match(/(var|let|const)\s+(\w+)\s*=\s*(.+?);/);
        if (match) {
          const [, declarationType, varName, varValue] = match;
          variables[varName] = {
            type: varValue.includes('[') ? 'array' : 
                  varValue.includes('{') ? 'object' : 
                  varValue.includes('"') || varValue.includes("'") ? 'string' : 
                  !isNaN(Number(varValue)) ? 'number' : 
                  'unknown',
            value: varValue.trim()
          };
          
          frames.push({
            lineNumber,
            codeSnippet: line.trim(),
            description: `${declarationType} ${varName} is initialized with value ${varValue.trim()}`,
            objects: Object.entries(variables).map(([name, details]: [string, any]) => ({
              name,
              type: details.type,
              value: details.value,
              change: name === varName ? 'created' : 'unchanged'
            }))
          });
        }
      }
      
      // Function calls
      const functionCalls = lines.filter(line => 
        line.includes('(') && 
        line.includes(')') && 
        !line.includes('function')
      );
      
      for (let i = 0; i < functionCalls.length; i++) {
        const line = functionCalls[i];
        const lineNumber = lines.indexOf(line) + 1;
        
        frames.push({
          lineNumber,
          codeSnippet: line.trim(),
          description: `Function call executed`,
          objects: Object.entries(variables).map(([name, details]: [string, any]) => ({
            name,
            type: details.type,
            value: details.value,
            change: 'unchanged'
          }))
        });
      }
      
    } else if (lang === 'python') {
      // For Python code
      let variables: any = {};
      
      // Variable assignments
      const varAssignments = lines.filter(line => 
        line.includes('=') && 
        !line.includes('==') && 
        !line.includes('!=') && 
        !line.includes('<=') && 
        !line.includes('>=')
      );
      
      for (let i = 0; i < varAssignments.length; i++) {
        const line = varAssignments[i];
        const lineNumber = lines.indexOf(line) + 1;
        
        // Simple variable extraction (this is a mock implementation)
        const match = line.match(/(\w+)\s*=\s*(.+)/);
        if (match) {
          const [, varName, varValue] = match;
          const isNewVar = !variables[varName];
          variables[varName] = {
            type: varValue.includes('[') ? 'list' : 
                  varValue.includes('{') ? 'dict' : 
                  varValue.includes('"') || varValue.includes("'") ? 'string' : 
                  !isNaN(Number(varValue)) ? 'number' : 
                  'unknown',
            value: varValue.trim()
          };
          
          frames.push({
            lineNumber,
            codeSnippet: line.trim(),
            description: `Variable ${varName} is ${isNewVar ? 'initialized' : 'updated'} with value ${varValue.trim()}`,
            objects: Object.entries(variables).map(([name, details]: [string, any]) => ({
              name,
              type: details.type,
              value: details.value,
              change: name === varName ? (isNewVar ? 'created' : 'modified') : 'unchanged'
            }))
          });
        }
      }
      
      // Function calls
      const functionCalls = lines.filter(line => 
        line.includes('(') && 
        line.includes(')') && 
        !line.includes('def ')
      );
      
      for (let i = 0; i < functionCalls.length; i++) {
        const line = functionCalls[i];
        const lineNumber = lines.indexOf(line) + 1;
        
        frames.push({
          lineNumber,
          codeSnippet: line.trim(),
          description: `Function call executed`,
          objects: Object.entries(variables).map(([name, details]: [string, any]) => ({
            name,
            type: details.type,
            value: details.value,
            change: 'unchanged'
          }))
        });
      }
    }
    
    // If no frames were generated, add a default frame
    if (frames.length === 0) {
      frames.push({
        lineNumber: 1,
        codeSnippet: lines[0]?.trim() || 'No code',
        description: 'Code execution starts',
        objects: []
      });
    }
    
    return frames;
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

  const getChangeStyle = (change: string) => {
    switch (change) {
      case 'created': return 'text-green-400';
      case 'modified': return 'text-yellow-400';
      case 'unchanged': return 'text-gray-400';
      default: return 'text-gray-400';
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
        if (!analysisResult.visualization || !analysisResult.visualization.frames || analysisResult.visualization.frames.length === 0) {
          return (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
              <FileCode className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No visualization available</h3>
              <p className="text-gray-300">Visualization data could not be generated for this code.</p>
            </div>
          );
        }
        
        const frames = analysisResult.visualization.frames;
        
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Code Execution Visualization</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))}
                    disabled={currentFrame === 0}
                    className="p-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-300">
                    {currentFrame + 1} / {frames.length}
                  </span>
                  <button
                    onClick={() => setCurrentFrame(Math.min(frames.length - 1, currentFrame + 1))}
                    disabled={currentFrame === frames.length - 1}
                    className="p-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Frame information */}
                <div className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-purple-400">
                      Line {frames[currentFrame].lineNumber}
                    </div>
                    <div className="text-xs text-gray-400">
                      Step {currentFrame + 1} of {frames.length}
                    </div>
                  </div>
                  {frames[currentFrame].codeSnippet && (
                    <div className="bg-gray-800 p-3 rounded mb-3 font-mono text-sm">
                      {frames[currentFrame].codeSnippet}
                    </div>
                  )}
                  <div className="text-sm text-gray-300">
                    {frames[currentFrame].description}
                  </div>
                </div>
                
                {/* Objects state */}
                {frames[currentFrame].objects && frames[currentFrame].objects.length > 0 && (
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-blue-400 mb-3">
                      Variable State:
                    </div>
                    <div className="space-y-2">
                      {frames[currentFrame].objects.map((obj: any, idx: number) => (
                        <div key={idx} className="flex items-start p-3 bg-gray-800 rounded">
                          <div className="w-1/4 font-mono text-sm text-gray-300">{obj.name}</div>
                          <div className="w-1/4 text-sm text-gray-400">{obj.type}</div>
                          <div className="w-1/3 font-mono text-sm text-white break-all">{obj.value}</div>
                          <div className={`w-1/6 text-sm text-right ${getChangeStyle(obj.change)}`}>
                            {obj.change}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
    </div>
  );
};

export default CodeAnalyserPage;