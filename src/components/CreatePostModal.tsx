import React, { useState } from 'react';
import { X, Code, Image, Video, FolderOpen } from 'lucide-react';
import CodeEditor from './CodeEditor';
import FileUpload from './FileUpload';
import { getSupportedLanguages } from '../utils/codeRunner';
import { uploadFileWithProgress, validateImageFile, validateVideoFile, compressImage } from '../utils/fileUpload';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  initialType?: 'code' | 'image' | 'video' | 'project';
  initialVideo?: Blob;
  initialCode?: string;
  initialLanguage?: string;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ 
  isOpen, 
  onClose, 
  onPostCreated,
  initialType = 'code',
  initialVideo,
  initialCode = '',
  initialLanguage = 'javascript'
}) => {
  const { user } = useAuth();
  const [postType, setPostType] = useState(initialType);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [codeContent, setCodeContent] = useState(initialCode);
  const [codeLanguage, setCodeLanguage] = useState(initialLanguage);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectLiveUrl, setProjectLiveUrl] = useState('');
  const [projectGithubUrl, setProjectGithubUrl] = useState('');
  const [projectTechStack, setProjectTechStack] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(
    initialVideo ? new File([initialVideo], 'recording.webm', { type: 'video/webm' }) : null
  );
  const [projectImage, setProjectImage] = useState<File | null>(null);
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const supportedLanguages = getSupportedLanguages();

  if (!isOpen) return null;

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
    if (postType === 'code' && !codeContent.trim()) {
      setError('Please provide code content');
      return;
    }

    if (postType === 'project' && !projectTitle.trim()) {
      setError('Please provide a project title');
      return;
    }

    if ((postType === 'image' || postType === 'video') && !selectedFile) {
      setError(`Please select a ${postType} file`);
      return;
    }

    // Validate files
    if (postType === 'image' && selectedFile) {
      const imageError = validateImageFile(selectedFile);
      if (imageError) {
        setError(imageError);
        return;
      }
    }

    if (postType === 'video' && selectedFile) {
      const videoError = validateVideoFile(selectedFile);
      if (videoError) {
        setError(videoError);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);

    try {
      let mediaUrl = null;
      let projectImageUrl = null;

      // Upload main media file
      if (selectedFile) {
        setUploadProgress(10);
        
        // Compress image if needed
        let fileToUpload = selectedFile;
        if (postType === 'image') {
          setUploadProgress(20);
          fileToUpload = await compressImage(selectedFile);
          setUploadProgress(30);
        }
        
        // Upload to Supabase Storage
        mediaUrl = await uploadFileWithProgress(
          fileToUpload, 
          postType === 'image' ? 'images' : 'videos',
          (progress: number) => {
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
          (progress: number) => {
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
        type: postType,
        content: content.trim(),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      };

      // Add type-specific data
      if (postType === 'code') {
        postData.code_language = codeLanguage;
        postData.code_content = codeContent;
      } else if (postType === 'project') {
        postData.project_title = projectTitle;
        postData.project_description = projectDescription || null;
        postData.project_live_url = projectLiveUrl || null;
        postData.project_github_url = projectGithubUrl || null;
        postData.project_tech_stack = projectTechStack.split(',').map(tech => tech.trim()).filter(tech => tech.length > 0);
        if (projectImageUrl) {
          postData.media_url = projectImageUrl;
        }
      } else if (postType === 'image' || postType === 'video') {
        postData.media_url = mediaUrl;
        
        // Special handling for coding videos from playground
        if (postType === 'video' && codeContent) {
          postData.code_content = codeContent;
          postData.code_language = codeLanguage;
          postData.type = 'coding_video'; // Special type for coding tutorial videos
        }
      }

      // Insert the post
      const { data, error: insertError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setUploadProgress(100);
      console.log('Post created successfully:', data);

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

      // Call the callback
      if (onPostCreated) {
        onPostCreated();
      }

      onClose();
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
  };

  const handleLanguageChange = (language: string) => {
    setCodeLanguage(language);
    if (!codeContent && codeTemplates[language as keyof typeof codeTemplates]) {
      setCodeContent(codeTemplates[language as keyof typeof codeTemplates]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Create New Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="bg-blue-900 bg-opacity-50 border border-blue-500 rounded-lg p-4">
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

          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Post Type</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setPostType('code')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  postType === 'code' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={() => setPostType('image')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  postType === 'image' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>Image</span>
              </button>
              <button
                type="button"
                onClick={() => setPostType('video')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  postType === 'video' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Video</span>
              </button>
              <button
                type="button"
                onClick={() => setPostType('project')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  postType === 'project' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Project</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
              Description *
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
          {(postType === 'code' || (postType === 'video' && codeContent)) && (
            <>
              <div className="flex items-center justify-between">
                <label htmlFor="codeLanguage" className="block text-sm font-medium text-gray-300">
                  Programming Language {postType === 'code' ? '*' : '(Optional)'}
                </label>
                <button
                  type="button"
                  onClick={() => setUseAdvancedEditor(!useAdvancedEditor)}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                >
                  <Code className="w-3 h-3" />
                  <span>{useAdvancedEditor ? 'Simple Editor' : 'Advanced Editor'}</span>
                </button>
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
                  Code {postType === 'code' ? '*' : '(Optional)'}
                </label>
                {useAdvancedEditor ? (
                  <CodeEditor
                    initialCode={codeContent || codeTemplates[codeLanguage as keyof typeof codeTemplates] || ''}
                    language={codeLanguage}
                    onCodeChange={setCodeContent}
                    showRunButton={true}
                    height="400px"
                  />
                ) : (
                  <textarea
                    id="codeContent"
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    placeholder="Paste your code here..."
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-none"
                    rows={12}
                    required={postType === 'code'}
                  />
                )}
              </div>
            </>
          )}

          {/* Image/Video upload */}
          {(postType === 'image' || postType === 'video') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload {postType === 'image' ? 'Image' : 'Video'} *
              </label>
              <FileUpload
                onFileSelect={handleFileSelect}
                acceptedTypes={postType === 'image' ? 'image/*' : 'video/*'}
                maxSize={postType === 'image' ? 10 : 100}
                type={postType}
                currentFile={selectedFile}
              />
            </div>
          )}

          {/* Project-specific fields */}
          {postType === 'project' && (
            <>
              <div>
                <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-300 mb-2">
                  Project Title *
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="react, javascript, webdev (comma-separated)"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
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
  );
};

export default CreatePostModal;