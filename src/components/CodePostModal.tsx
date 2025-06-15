import React, { useState } from 'react';
import { X, Heart, MessageCircle, Share, Bookmark, Play, Edit, Copy, Save, Loader2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeEditor from './CodeEditor';
import { executeCode } from '../utils/codeRunner';
import { supabase, type PostWithUser } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface CodePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostWithUser;
  onPostUpdated?: (updatedPost: PostWithUser) => void;
}

const CodePostModal: React.FC<CodePostModalProps> = ({ isOpen, onClose, post: initialPost, onPostUpdated }) => {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [isSaved, setIsSaved] = useState(false);
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(false);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content || '');
  const [editedCode, setEditedCode] = useState(post.code_content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (!error) {
          setIsLiked(false);
          setLikesCount((prev: number) => prev - 1);
        }
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });

        if (!error) {
          setIsLiked(true);
          setLikesCount((prev: number) => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleRunCode = async () => {
    const codeToRun = isEditing ? editedCode : post.code_content;
    if (!codeToRun || !post.code_language) return;
    
    setIsRunning(true);
    setOutput('Running...');

    try {
      const result = await executeCode(codeToRun, post.code_language);
      setOutput(result);
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = () => {
    const codeToCopy = isEditing ? editedCode : post.code_content;
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(post.content || '');
    setEditedCode(post.code_content || '');
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(post.content || '');
    setEditedCode(post.code_content || '');
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!user || user.id !== post.user_id) {
      setEditError('You can only edit your own posts');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          content: editedContent.trim(),
          code_content: editedCode.trim()
        })
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

      if (error) {
        throw error;
      }

      const updatedPost = data as PostWithUser;
      setPost(updatedPost);
      setIsEditing(false);
      
      if (onPostUpdated) {
        onPostUpdated(updatedPost);
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update post');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isOwner = user && user.id === post.user_id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <img
              src={post.profiles.avatar_url || 'https://images.pexels.com/photos/1716861/pexels-photo-1716861.jpeg?auto=compress&cs=tinysrgb&w=150'}
              alt={post.profiles.username}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white text-sm sm:text-base truncate">{post.profiles.username}</span>
              </div>
              <span className="text-xs sm:text-sm text-gray-400">{formatTimeAgo(post.created_at)}</span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col min-h-full">
            {/* Post Description */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-700 flex-shrink-0">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                      rows={3}
                      placeholder="Enter description..."
                    />
                  </div>
                  {editError && (
                    <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-3">
                      <p className="text-red-200 text-xs sm:text-sm">{editError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-white text-sm sm:text-lg break-words">{post.content}</p>
              )}
              
              {/* Tags */}
              {post.tags && post.tags.length > 0 && !isEditing && (
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-3">
                  {post.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="text-purple-400 text-xs sm:text-sm hover:text-purple-300 cursor-pointer break-all"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Code Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-gray-700 border-b border-gray-600 gap-2 sm:gap-0 flex-shrink-0">
                <span className="text-sm sm:text-lg text-gray-300 capitalize flex items-center">
                  <span className="mr-2 sm:mr-3">{post.code_language}</span>
                  <span className="text-xs sm:text-sm bg-gray-600 px-2 sm:px-3 py-1 rounded-full">
                    {post.code_language?.toUpperCase()}
                  </span>
                </span>
                
                <div className="flex flex-wrap items-center gap-1 sm:gap-3">
                  {isOwner && !isEditing && (
                    <button
                      onClick={handleEdit}
                      className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-xs sm:text-sm"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Edit</span>
                    </button>
                  )}
                  
                  {isEditing && (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-xs sm:text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-xs sm:text-sm"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                        <span>{isSaving ? 'Saving...' : 'Save'}</span>
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setUseAdvancedEditor(!useAdvancedEditor)}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs sm:text-sm"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">{useAdvancedEditor ? 'Simple View' : 'Advanced View'}</span>
                    <span className="xs:hidden">{useAdvancedEditor ? 'Simple' : 'Advanced'}</span>
                  </button>
                  
                  {!useAdvancedEditor && (
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning}
                      className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-xs sm:text-sm"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                    </button>
                  )}
                  
                  <button
                    onClick={copyCode}
                    className="p-1 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
              
              {/* Code Display */}
              <div className="flex-1 flex flex-col min-h-0">
                {useAdvancedEditor ? (
                  <div className="flex-1">
                    <CodeEditor
                      initialCode={isEditing ? editedCode : post.code_content || ''}
                      language={post.code_language || 'javascript'}
                      readOnly={!isEditing}
                      showRunButton={true}
                      height="100%"
                      onCodeChange={isEditing ? setEditedCode : undefined}
                    />
                  </div>
                ) : (
                  <>
                    {/* Code Panel */}
                    <div className={`${output ? 'flex-shrink-0' : 'flex-1'} min-h-0`} style={{ minHeight: output ? '300px' : 'auto' }}>
                      {isEditing ? (
                        <textarea
                          value={editedCode}
                          onChange={(e) => setEditedCode(e.target.value)}
                          className="w-full h-full bg-gray-900 text-gray-100 font-mono text-xs sm:text-sm p-3 sm:p-6 border-none outline-none resize-none"
                          placeholder="Enter your code here..."
                          style={{ minHeight: '300px' }}
                        />
                      ) : (
                        <div className="h-full overflow-auto">
                          <SyntaxHighlighter
                            language={post.code_language || 'javascript'}
                            style={oneDark}
                            customStyle={{
                              margin: 0,
                              padding: '0.75rem',
                              background: 'transparent',
                              fontSize: window.innerWidth < 640 ? '12px' : '16px',
                              lineHeight: '1.6',
                              minHeight: '300px'
                            }}
                          >
                            {post.code_content || ''}
                          </SyntaxHighlighter>
                        </div>
                      )}
                    </div>
                    
                    {/* Output Panel */}
                    {output && (
                      <div className="border-t border-gray-600 bg-gray-900 flex flex-col flex-shrink-0" style={{ height: '250px' }}>
                        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border-b border-gray-600 flex-shrink-0">
                          <span className="text-sm sm:text-lg font-medium text-gray-300">Output</span>
                        </div>
                        <div className="flex-1 p-3 sm:p-4 text-gray-100 font-mono text-xs sm:text-sm overflow-y-auto overflow-x-auto">
                          <pre className="whitespace-pre-wrap break-words">{output}</pre>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        {!isEditing && (
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-700 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 sm:space-x-2 transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm sm:text-lg">{likesCount}</span>
              </button>
              
              <button className="flex items-center space-x-1 sm:space-x-2 text-gray-400 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-sm sm:text-lg">{post.comments_count || 0}</span>
              </button>
              
              <button className="flex items-center space-x-1 sm:space-x-2 text-gray-400 hover:text-green-500 transition-colors">
                <Share className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-sm sm:text-lg">{post.shares_count || 0}</span>
              </button>
            </div>
            
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`transition-colors ${
                isSaved ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
              }`}
            >
              <Bookmark className={`w-5 h-5 sm:w-6 sm:h-6 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodePostModal;