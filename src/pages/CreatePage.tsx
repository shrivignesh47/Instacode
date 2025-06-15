import React, { useState } from 'react';
import { Code, Image, Video, FolderOpen, Play } from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import CodePlayground from '../components/CodePlayground';
import FileUpload from '../components/FileUpload';
import { getSupportedLanguages } from '../utils/codeRunner';
import { uploadFileWithProgress, validateImageFile, validateVideoFile, compressImage } from '../utils/fileUpload';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const CreatePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'code' | 'image' | 'video' | 'project'>('code');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectLiveUrl, setProjectLiveUrl] = useState('');
  const [projectGithubUrl, setProjectGithubUrl] = useState('');
  const [projectTechStack, setProjectTechStack] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectImage, setProjectImage] = useState<File | null>(null);
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(true);
  const [showPlayground, setShowPlayground] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supportedLanguages = getSupportedLanguages();

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setError(null);
  };

  const handleProjectImageSelect = (file: File | null) => {
    setProjectImage(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }

    if (!content.trim()) {
      setError('Please provide a description for your post');
      return;
    }

    // Validate based on post type
    if (activeTab === 'code' && !codeContent.trim()) {
      setError('Please provide code content');
      return;
    }

    if (activeTab === 'project' && !projectTitle.trim()) {
      setError('Please provide a project title');
      return;
    }

    if ((activeTab === 'image' || activeTab === 'video') && !selectedFile) {
      setError(`Please select a ${activeTab} file`);
      return;
    }

    // Validate files
    if (activeTab === 'image' && selectedFile) {
      const imageError = validateImageFile(selectedFile);
      if (imageError) {
        setError(imageError);
        return;
      }
    }

    if (activeTab === 'video' && selectedFile) {
      const videoError = validateVideoFile(selectedFile);
      if (videoError) {
        setError(videoError);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      let mediaUrl = null;
      let projectImageUrl = null;

      // Upload main media file
      if (selectedFile) {
        setUploadProgress(10);
        
        // Compress image if needed
        let fileToUpload = selectedFile;
        if (activeTab === 'image') {
          setUploadProgress(20);
          fileToUpload = await compressImage(selectedFile);
          setUploadProgress(30);
        }
        
        // Upload to Supabase Storage
        mediaUrl = await uploadFileWithProgress(
          fileToUpload, 
          activeTab === 'image' ? 'images' : 'videos',
          (progress) => {
            // Map upload progress to 30-70% of total progress
            const mappedProgress = 30 + (progress * 0.4);
            setUploadProgress(mappedProgress);
          }
        );
        setUploadProgress(70);
      }

      // Upload project image if provided
      if (projectImage) {
        setUploadProgress(75);
        const compressedProjectImage = await compressImage(projectImage);
        projectImageUrl = await uploadFileWithProgress(
          compressedProjectImage, 
          'projects',
          (progress) => {
            // Map upload progress to 75-85% of total progress
            const mappedProgress = 75 + (progress * 0.1);
            setUploadProgress(mappedProgress);
          }
        );
        setUploadProgress(85);
      }

      setUploadProgress(90);

      // Prepare the post data
      const postData: any = {
        user_id: user.id,
        type: activeTab,
        content: content.trim(),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      };

      // Add type-specific data
      if (activeTab === 'code') {
        postData.code_language = codeLanguage;
        postData.code_content = codeContent;
      } else if (activeTab === 'project') {
        postData.project_title = projectTitle;
        postData.project_description = projectDescription || null;
        postData.project_live_url = projectLiveUrl || null;
        postData.project_github_url = projectGithubUrl || null;
        postData.project_tech_stack = projectTechStack.split(',').map(tech => tech.trim()).filter(tech => tech.length > 0);
        if (projectImageUrl) {
          postData.media_url = projectImageUrl;
        }
      } else if (activeTab === 'image' || activeTab === 'video') {
        postData.media_url = mediaUrl;
      }

      // Insert the post
      const { error: insertError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setUploadProgress(100);
      setSuccess('Post created successfully! 🎉');

      // Reset form
      setContent('');
      setTags('');
      setCodeContent('');
      setProjectTitle('');
      setProjectDescription('');
      setProjectLiveUrl('');
      setProjectGithubUrl('');
      setProjectTechStack('');
      setSelectedFile(null);
      setProjectImage(null);
      setUploadProgress(0);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const codeTemplates = {
    javascript: `// Welcome to the JavaScript playground!
function greetUser(name) {
  return \`Hello, \${name}! Welcome to InstaCode.\`;
}

// Example usage
console.log(greetUser("Developer"));

// Try some array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled numbers:", doubled);`,
    
    typescript: `// Welcome to the TypeScript playground!
interface User {
  name: string;
  age: number;
  isActive: boolean;
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}! You are \${user.age} years old.\`;
}

// Example usage
const developer: User = {
  name: "Developer",
  age: 25,
  isActive: true
};

console.log(greetUser(developer));`,
    
    python: `# Welcome to the Python playground!
def greet_user(name):
    return f"Hello, {name}! Welcome to InstaCode."

# Example usage
print(greet_user("Developer"))

# Try some list operations
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print("Doubled numbers:", doubled)`,
    
    java: `// Welcome to the Java playground!
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Developer! Welcome to InstaCode.");
        
        // Array example
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.println("Original numbers:");
        for (int num : numbers) {
            System.out.print(num + " ");
        }
        
        System.out.println("\\nDoubled numbers:");
        for (int num : numbers) {
            System.out.print((num * 2) + " ");
        }
    }
}`,
    
    cpp: `// Welcome to the C++ playground!
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    cout << "Hello, Developer! Welcome to InstaCode." << endl;
    
    // Vector example
    vector<int> numbers = {1, 2, 3, 4, 5};
    
    cout << "Original numbers: ";
    for (int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    cout << "Doubled numbers: ";
    for (int num : numbers) {
        cout << (num * 2) << " ";
    }
    cout << endl;
    
    return 0;
}`,
    
    csharp: `// Welcome to the C# playground!
using System;
using System.Linq;

class Program 
{
    static void Main() 
    {
        Console.WriteLine("Hello, Developer! Welcome to InstaCode.");
        
        // Array example
        int[] numbers = {1, 2, 3, 4, 5};
        
        Console.WriteLine("Original numbers: " + string.Join(" ", numbers));
        
        var doubled = numbers.Select(n => n * 2).ToArray();
        Console.WriteLine("Doubled numbers: " + string.Join(" ", doubled));
        
        // Class example
        var calculator = new Calculator();
        Console.WriteLine($"5 + 3 = {calculator.Add(5, 3)}");
    }
}

class Calculator 
{
    public int Add(int a, int b) 
    {
        return a + b;
    }
}`,
    
    go: `// Welcome to the Go playground!
package main

import "fmt"

func main() {
    fmt.Println("Hello, Developer! Welcome to InstaCode.")
    
    // Slice example
    numbers := []int{1, 2, 3, 4, 5}
    
    fmt.Print("Original numbers: ")
    for _, num := range numbers {
        fmt.Print(num, " ")
    }
    fmt.Println()
    
    fmt.Print("Doubled numbers: ")
    for _, num := range numbers {
        fmt.Print(num*2, " ")
    }
    fmt.Println()
    
    // Function example
    result := add(5, 3)
    fmt.Printf("5 + 3 = %d\\n", result)
}

func add(a, b int) int {
    return a + b
}`,
    
    rust: `// Welcome to the Rust playground!
fn main() {
    println!("Hello, Developer! Welcome to InstaCode.");
    
    // Vector example
    let numbers = vec![1, 2, 3, 4, 5];
    
    print!("Original numbers: ");
    for num in &numbers {
        print!("{} ", num);
    }
    println!();
    
    print!("Doubled numbers: ");
    for num in &numbers {
        print!("{} ", num * 2);
    }
    println!();
    
    // Function example
    let result = add(5, 3);
    println!("5 + 3 = {}", result);
}

fn add(a: i32, b: i32) -> i32 {
    a + b
}`,
    
    php: `<?php
// Welcome to the PHP playground!
echo "Hello, Developer! Welcome to InstaCode.\\n";

// Array example
$numbers = [1, 2, 3, 4, 5];

echo "Original numbers: ";
foreach ($numbers as $num) {
    echo $num . " ";
}
echo "\\n";

echo "Doubled numbers: ";
foreach ($numbers as $num) {
    echo ($num * 2) . " ";
}
echo "\\n";

// Function example
function add($a, $b) {
    return $a + $b;
}

$result = add(5, 3);
echo "5 + 3 = " . $result . "\\n";
?>`,
    
    ruby: `# Welcome to the Ruby playground!
puts "Hello, Developer! Welcome to InstaCode."

# Array example
numbers = [1, 2, 3, 4, 5]

print "Original numbers: "
numbers.each { |num| print "#{num} " }
puts

print "Doubled numbers: "
numbers.each { |num| print "#{num * 2} " }
puts

# Method example
def add(a, b)
  a + b
end

result = add(5, 3)
puts "5 + 3 = #{result}"

# Class example
class Calculator
  def multiply(a, b)
    a * b
  end
end

calc = Calculator.new
puts "5 * 3 = #{calc.multiply(5, 3)}"`,
    
    sql: `-- Welcome to the SQL playground!
-- Create a sample table
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    email VARCHAR(100),
    age INT
);

-- Insert sample data
INSERT INTO users (id, name, email, age) VALUES
(1, 'John Doe', 'john@example.com', 25),
(2, 'Jane Smith', 'jane@example.com', 30),
(3, 'Bob Johnson', 'bob@example.com', 35);

-- Query examples
SELECT * FROM users;

SELECT name, age FROM users WHERE age > 25;

SELECT COUNT(*) as total_users FROM users;

-- Update example
UPDATE users SET age = 26 WHERE id = 1;

-- Delete example (commented out)
-- DELETE FROM users WHERE id = 3;`,
    
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to InstaCode</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .button {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            transition: transform 0.3s ease;
            margin: 10px;
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .feature {
            display: inline-block;
            margin: 10px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>🚀 Welcome to InstaCode!</h1>
        <p>The ultimate platform for developers to share code, collaborate, and grow together.</p>
        
        <div class="feature">
            <h3>💻 Code Sharing</h3>
            <p>Share your code snippets with syntax highlighting</p>
        </div>
        
        <div class="feature">
            <h3>🎮 Live Playground</h3>
            <p>Test and run code in real-time</p>
        </div>
        
        <div class="feature">
            <h3>👥 Community</h3>
            <p>Connect with fellow developers</p>
        </div>
        
        <button class="button" onclick="showAlert()">Get Started</button>
        <button class="button" onclick="changeTheme()">Change Theme</button>
    </div>

    <script>
        function showAlert() {
            alert('Welcome to InstaCode! Start sharing your amazing code! 🎉');
        }
        
        function changeTheme() {
            const body = document.body;
            const currentBg = body.style.background;
            
            if (currentBg.includes('667eea')) {
                body.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
            } else {
                body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
        }
    </script>
</body>
</html>`,
    
    css: `/* Welcome to the CSS playground! */
/* Modern CSS Grid and Flexbox Layout */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.card {
  background: rgba(255, 255, 255, 0.1);
  padding: 30px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

.card h2 {
  color: white;
  margin-bottom: 15px;
  font-size: 1.5rem;
}

.card p {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: 20px;
}

.button {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background: linear-gradient(45deg, #45a049, #4CAF50);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.feature {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.feature h3 {
  color: #4CAF50;
  margin-bottom: 10px;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeIn 0.6s ease-out;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
    padding: 10px;
  }
  
  .card {
    padding: 20px;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}`
  };

  const handleLanguageChange = (language: string) => {
    setCodeLanguage(language);
    if (!codeContent && codeTemplates[language as keyof typeof codeTemplates]) {
      setCodeContent(codeTemplates[language as keyof typeof codeTemplates]);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 lg:px-0">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Create New Post</h1>
          <p className="text-gray-400">Share your code, projects, or thoughts with the community</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-900 bg-opacity-50 border border-green-500 rounded-lg p-4 mb-6">
            <p className="text-green-200">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Upload Progress */}
        {isSubmitting && uploadProgress > 0 && (
          <div className="bg-blue-900 bg-opacity-50 border border-blue-500 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-200 text-sm">
                {uploadProgress < 30 ? 'Preparing files...' :
                 uploadProgress < 70 ? 'Uploading to Supabase...' :
                 uploadProgress < 90 ? 'Processing...' :
                 uploadProgress < 100 ? 'Saving post...' :
                 'Complete!'}
              </span>
              <span className="text-blue-200 text-sm">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* Post Type Tabs */}
          <div className="border-b border-gray-700 p-4 lg:p-6">
            <div className="grid grid-cols-2 lg:flex lg:space-x-2 gap-2 lg:gap-0">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center justify-center space-x-2 px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base ${
                  activeTab === 'code' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Code</span>
              </button>
              <button
                onClick={() => setActiveTab('image')}
                className={`flex items-center justify-center space-x-2 px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base ${
                  activeTab === 'image' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>Image</span>
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center justify-center space-x-2 px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base ${
                  activeTab === 'video' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Video</span>
              </button>
              <button
                onClick={() => setActiveTab('project')}
                className={`flex items-center justify-center space-x-2 px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base ${
                  activeTab === 'project' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Project</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-6">
            {/* Content Description */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                required
              />
            </div>

            {/* Code-specific fields */}
            {activeTab === 'code' && (
              <>
                <div className="flex items-center justify-between">
                  <label htmlFor="codeLanguage" className="block text-sm font-medium text-gray-300">
                    Programming Language
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setUseAdvancedEditor(!useAdvancedEditor)}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                    >
                      <Code className="w-3 h-3" />
                      <span>{useAdvancedEditor ? 'Simple Editor' : 'Advanced Editor'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPlayground(true)}
                      className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>Playground</span>
                    </button>
                  </div>
                </div>
                
                <select
                  id="codeLanguage"
                  value={codeLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                
                <div>
                  <label htmlFor="codeContent" className="block text-sm font-medium text-gray-300 mb-2">
                    Code
                  </label>
                  {useAdvancedEditor ? (
                    <CodeEditor
                      initialCode={codeContent || codeTemplates[codeLanguage as keyof typeof codeTemplates] || ''}
                      language={codeLanguage}
                      onCodeChange={setCodeContent}
                      showRunButton={true}
                      height="500px"
                    />
                  ) : (
                    <textarea
                      id="codeContent"
                      value={codeContent}
                      onChange={(e) => setCodeContent(e.target.value)}
                      placeholder="Paste your code here..."
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-none"
                      rows={15}
                      required
                    />
                  )}
                </div>
              </>
            )}

            {/* Image/Video upload */}
            {(activeTab === 'image' || activeTab === 'video') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload {activeTab === 'image' ? 'Image' : 'Video'}
                </label>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  acceptedTypes={activeTab === 'image' ? 'image/*' : 'video/*'}
                  maxSize={activeTab === 'image' ? 10 : 100}
                  type={activeTab}
                  currentFile={selectedFile}
                />
              </div>
            )}

            {/* Project-specific fields */}
            {activeTab === 'project' && (
              <>
                <div>
                  <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-300 mb-2">
                    Project Title
                  </label>
                  <input
                    type="text"
                    id="projectTitle"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Enter project title"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-300 mb-2">
                    Project Description
                  </label>
                  <textarea
                    id="projectDescription"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe your project..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Image (Optional)
                  </label>
                  <FileUpload
                    onFileSelect={handleProjectImageSelect}
                    acceptedTypes="image/*"
                    maxSize={10}
                    type="image"
                    currentFile={projectImage}
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="projectLiveUrl" className="block text-sm font-medium text-gray-300 mb-2">
                      Live URL (Optional)
                    </label>
                    <input
                      type="url"
                      id="projectLiveUrl"
                      value={projectLiveUrl}
                      onChange={(e) => setProjectLiveUrl(e.target.value)}
                      placeholder="https://your-project.com"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="projectGithubUrl" className="block text-sm font-medium text-gray-300 mb-2">
                      GitHub URL (Optional)
                    </label>
                    <input
                      type="url"
                      id="projectGithubUrl"
                      value={projectGithubUrl}
                      onChange={(e) => setProjectGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/repo"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="projectTechStack" className="block text-sm font-medium text-gray-300 mb-2">
                    Tech Stack
                  </label>
                  <input
                    type="text"
                    id="projectTechStack"
                    value={projectTechStack}
                    onChange={(e) => setProjectTechStack(e.target.value)}
                    placeholder="React, Node.js, MongoDB, etc. (comma-separated)"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </>
            )}

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="#react, #javascript, #webdev (comma-separated)"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
              <button
                type="button"
                className="px-4 lg:px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm lg:text-base"
              >
                Save Draft
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 lg:px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm lg:text-base flex items-center justify-center space-x-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isSubmitting ? 'Creating...' : 'Share Post'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Code Playground Modal */}
      {showPlayground && (
        <CodePlayground
          isOpen={showPlayground}
          onClose={() => setShowPlayground(false)}
          initialCode={codeContent || codeTemplates[codeLanguage as keyof typeof codeTemplates] || ''}
          initialLanguage={codeLanguage}
        />
      )}
    </>
  );
};

export default CreatePage;