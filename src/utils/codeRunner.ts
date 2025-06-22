// Code execution utilities

const API_BASE_URL = 'https://emkc.org/api/v2/piston/execute';

export const executeCode = async (code: string, language: string, input?: string): Promise<string> => {
  try {
    console.log('Sending code execution request:', { language, hasCode: !!code, hasInput: !!input });
    
    // Try Piston API v2 first
    const pistonResult = await tryPistonExecution(code, language, input);
    if (pistonResult) return pistonResult;
    
    // Fallback to mock execution for now
    return await mockExecution(code, language, input);
    
  } catch (error: any) {
    console.error('Code execution error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return 'Network error: Unable to connect to the code execution service. Please check your internet connection.';
    }
    
    return `Execution failed: ${error.message || 'Unknown error'}`;
  }
};

const tryPistonExecution = async (code: string, language: string, input?: string): Promise<string | null> => {
  try {
    const requestBody = {
      language: getLanguageMapping(language),
      version: getLanguageVersion(language),
      files: [
        {
          name: `main${getFileExtension(language)}`,
          content: code
        }
      ],
      stdin: input || '',
      compile_timeout: 10000,
      run_timeout: 3000
    };

    console.log('Piston API request:', requestBody);
    
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Piston response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Piston API Error:', errorText);
      return null; // Trigger fallback
    }

    const data = await response.json();
    console.log('Piston API Response:', data);

    if (data && data.run) {
      let output = '';
      
      // Check for compilation errors first
      if (data.compile && data.compile.stderr) {
        output += `Compilation Error:\n${data.compile.stderr}\n\n`;
      }
      
      // Add stdout if available
      if (data.run.stdout) {
        output += data.run.stdout;
      }
      
      // Add stderr if available
      if (data.run.stderr) {
        if (output) output += '\n';
        output += `Error:\n${data.run.stderr}`;
      }
      
      // If no output but successful execution, provide feedback
      if (!output && data.run.code === 0) {
        output = 'Program executed successfully with no output.';
      }
      
      // If there was an execution error
      if (!output && data.run.code !== 0) {
        output = `Program exited with code ${data.run.code}. No output generated.`;
      }
      
      return output || 'No output received from the execution.';
    }
    
    return null;
  } catch (error) {
    console.error('Piston execution failed:', error);
    return null;
  }
};

const mockExecution = async (code: string, language: string, input?: string): Promise<string> => {
  // Simulate execution delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // If input is provided, show it in the output
  let inputPrefix = '';
  if (input) {
    inputPrefix = `Input:\n${input}\n\nOutput:\n`;
  }
  
  const mockResults: Record<string, string> = {
    'javascript': `${inputPrefix}> node main.js\nHello, World!\n[Simulated execution - API unavailable]`,
    'python': `${inputPrefix}> python main.py\nHello, World!\n[Simulated execution - API unavailable]`,
    'java': `${inputPrefix}> javac Main.java && java Main\nHello, World!\n[Simulated execution - API unavailable]`,
    'cpp': `${inputPrefix}> g++ -o main main.cpp && ./main\nHello, World!\n[Simulated execution - API unavailable]`,
    'c': `${inputPrefix}> gcc -o main main.c && ./main\nHello, World!\n[Simulated execution - API unavailable]`
  };
  
  const defaultMock = `${inputPrefix}> Executing ${language} code...\nCode execution simulation\n[Simulated execution - API unavailable]`;
  
  if (code.includes('console.log') || code.includes('print') || code.includes('System.out') || code.includes('cout') || code.includes('printf')) {
    return mockResults[language] || defaultMock;
  }
  
  return `${inputPrefix}Code compiled and executed successfully.\n[Simulated execution - API unavailable]`;
};

const getLanguageMapping = (language: string): string => {
  const mappings: Record<string, string> = {
    'javascript': 'javascript',
    'python': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'csharp': 'csharp',
    'go': 'go',
    'rust': 'rust',
    'php': 'php',
    'ruby': 'ruby',
    'typescript': 'typescript',
    'kotlin': 'kotlin',
    'swift': 'swift',
    'scala': 'scala',
    'perl': 'perl',
    'lua': 'lua',
    'bash': 'bash',
    'sql': 'sqlite3',
    'dart': 'dart',
    'elixir': 'elixir',
    'haskell': 'haskell',
    'r': 'r'
  };
  
  return mappings[language] || language;
};

const getLanguageVersion = (language: string): string => {
  const versions: Record<string, string> = {
    'javascript': '18.15.0',
    'python': '3.10.0',
    'java': '15.0.2',
    'cpp': '10.2.0',
    'c': '10.2.0',
    'csharp': '6.12.0',
    'go': '1.16.2',
    'rust': '1.68.2',
    'php': '8.2.3',
    'ruby': '3.0.1',
    'typescript': '5.0.3',
    'kotlin': '1.8.20',
    'swift': '5.3.3',
    'scala': '3.2.2',
    'perl': '5.36.0',
    'lua': '5.4.4',
    'bash': '5.2.0',
    'sql': '3.36.0',
    'dart': '2.19.6',
    'elixir': '1.12.3',
    'haskell': '9.0.1',
    'r': '4.1.1'
  };
  
  return versions[language] || '*';
};

export const getSupportedLanguages = () => {
  return [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'swift', label: 'Swift' },
    { value: 'scala', label: 'Scala' },
    { value: 'perl', label: 'Perl' },
    { value: 'lua', label: 'Lua' },
    { value: 'bash', label: 'Bash' },
    { value: 'sql', label: 'SQL' },
    { value: 'dart', label: 'Dart' },
    { value: 'elixir', label: 'Elixir' },
    { value: 'haskell', label: 'Haskell' },
    { value: 'r', label: 'R' }
  ];
};

export const getFileExtension = (language: string): string => {
  const extensions: Record<string, string> = {
    'javascript': '.js',
    'typescript': '.ts',
    'python': '.py',
    'java': '.java',
    'cpp': '.cpp',
    'c': '.c',
    'csharp': '.cs',
    'go': '.go',
    'rust': '.rs',
    'php': '.php',
    'ruby': '.rb',
    'kotlin': '.kt',
    'swift': '.swift',
    'scala': '.scala',
    'perl': '.pl',
    'lua': '.lua',
    'bash': '.sh',
    'sql': '.sql',
    'dart': '.dart',
    'elixir': '.ex',
    'haskell': '.hs',
    'r': '.r'
  };
  
  return extensions[language] || '.txt';
};

export const getLanguageTemplate = (language: string): string => {
  const templates: Record<string, string> = {
    'javascript': `// Welcome to the JavaScript playground!
function greetUser(name) {
  return \`Hello, \${name}! Welcome to InstaCode.\`;
}

// Example usage
console.log(greetUser("Developer"));

// Try some array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled numbers:", doubled);`,
    
    'python': `# Welcome to the Python playground!
def greet_user(name):
    return f"Hello, {name}! Welcome to InstaCode."

# Example usage
print(greet_user("Developer"))

# Try some list operations
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print("Doubled numbers:", doubled)`,
    
    'java': `// Welcome to the Java playground!
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Developer! Welcome to InstaCode.");
        
        // Example array operations
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.print("Doubled numbers: ");
        for (int num : numbers) {
            System.out.print((num * 2) + " ");
        }
        System.out.println();
    }
}`,
    
    'cpp': `// Welcome to the C++ playground!
#include <iostream>
#include <vector>

int main() {
    std::cout << "Hello, Developer! Welcome to InstaCode." << std::endl;
    
    // Example vector operations
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::cout << "Doubled numbers: ";
    for (int num : numbers) {
        std::cout << (num * 2) << " ";
    }
    std::cout << std::endl;
    
    return 0;
}`,

    'go': `// Welcome to the Go playground!
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    
    // Slice operations
    numbers := []int{1, 2, 3, 4, 5}
    var doubled []int
    
    for _, num := range numbers {
        doubled = append(doubled, num*2)
    }
    
    fmt.Printf("Original: %v\\n", numbers)
    fmt.Printf("Doubled: %v\\n", doubled)
}`
  };
  
  return templates[language] || `// Write your ${language} code here...\nconsole.log("Hello, World!");`;
};