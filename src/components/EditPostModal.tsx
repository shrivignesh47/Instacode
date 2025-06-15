
import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { supabase, type PostWithUser } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostWithUser | null;
  onPostUpdated: (updatedPost: PostWithUser) => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ isOpen, onClose, post, onPostUpdated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state with null checks
  const [content, setContent] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectTechStack, setProjectTechStack] = useState('');
  const [projectLiveUrl, setProjectLiveUrl] = useState('');
  const [projectGithubUrl, setProjectGithubUrl] = useState('');

  useEffect(() => {
    if (post) {
      setContent(post.content || '');
      setCodeContent(post.code_content || '');
      setProjectTitle(post.project_title || '');
      setProjectDescription(post.project_description || '');
      setProjectTechStack(post.project_tech_stack ? post.project_tech_stack.join(', ') : '');
      setProjectLiveUrl(post.project_live_url || '');
      setProjectGithubUrl(post.project_github_url || '');
    } else {
      // Reset form when post is null
      setContent('');
      setCodeContent('');
      setProjectTitle('');
      setProjectDescription('');
      setProjectTechStack('');
      setProjectLiveUrl('');
      setProjectGithubUrl('');
    }
  }, [post]);

  const handleSave = async () => {
    if (!user || !post || user.id !== post.user_id) {
      setError('You can only edit your own posts');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData: any = {
        content: content.trim()
      };

      // For code posts, allow editing code content
      if (post.type === 'code') {
        updateData.code_content = codeContent.trim();
      }

      // For projects, allow editing all fields
      if (post.type === 'project') {
        updateData.project_title = projectTitle.trim();
        updateData.project_description = projectDescription.trim();
        updateData.project_tech_stack = projectTechStack
          .split(',')
          .map(tech => tech.trim())
          .filter(tech => tech.length > 0);
        updateData.project_live_url = projectLiveUrl.trim() || null;
        updateData.project_github_url = projectGithubUrl.trim() || null;
      }

      const { data, error: updateError } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', post.id)
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .single();

      if (updateError) {
        throw updateError;
      }

      onPostUpdated(data as PostWithUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if modal is not open or post is null
  if (!isOpen || !post) return null;

  const canEdit = user && user.id === post.user_id;

  if (!canEdit) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Access Denied</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-300">You can only edit your own posts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">
            Edit {post.type === 'project' ? 'Project' : post.type === 'code' ? 'Code Post' : 'Post'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Description/Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Enter description..."
            />
          </div>

          {/* Code Content for code posts */}
          {post.type === 'code' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Code Content
              </label>
              <div className="relative">
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  rows={12}
                  placeholder="Enter your code here..."
                />
                {post.code_language && (
                  <div className="absolute top-2 right-2 bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
                    {post.code_language.toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Code Preview */}
              {codeContent && post.code_language && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preview
                  </label>
                  <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-600">
                    <SyntaxHighlighter
                      language={post.code_language}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        background: 'transparent',
                        fontSize: '14px',
                        maxHeight: '200px'
                      }}
                    >
                      {codeContent}
                    </SyntaxHighlighter>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Project-specific fields */}
          {post.type === 'project' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter project title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Description
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Enter project description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tech Stack (comma-separated)
                </label>
                <input
                  type="text"
                  value={projectTechStack}
                  onChange={(e) => setProjectTechStack(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="React, TypeScript, Node.js..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Live URL
                </label>
                <input
                  type="url"
                  value={projectLiveUrl}
                  onChange={(e) => setProjectLiveUrl(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={projectGithubUrl}
                  onChange={(e) => setProjectGithubUrl(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://github.com/username/repo"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;