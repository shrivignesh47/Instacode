
import React, { useState } from 'react';
import { X, Heart, MessageCircle, Share, Bookmark, Play, Edit, Copy } from 'lucide-react';
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
}

const CodePostModal: React.FC<CodePostModalProps> = ({ isOpen, onClose, post }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [isSaved, setIsSaved] = useState(false);
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(false);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);

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
    if (!post.code_content || !post.code_language) return;
    
    setIsRunning(true);
    setOutput('Running...');

    try {
      const result = await executeCode(post.code_content, post.code_language);
      setOutput(result);
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = () => {
    if (post.code_content) {
      navigator.clipboard.writeText(post.code_content);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <img
              src={post.profiles.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150'}
              alt={post.profiles.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">{post.profiles.username}</span>
              </div>
              <span className="text-sm text-gray-400">{formatTimeAgo(post.created_at)}</span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Post Description */}
          {post.content && (
            <div className="px-6 py-4 border-b border-gray-700">
              <p className="text-white text-lg">{post.content}</p>
              
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="text-purple-400 text-sm hover:text-purple-300 cursor-pointer"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Code Section */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 bg-gray-700 border-b border-gray-600">
              <span className="text-lg text-gray-300 capitalize flex items-center">
                <span className="mr-3">{post.code_language}</span>
                <span className="text-sm bg-gray-600 px-3 py-1 rounded-full">
                  {post.code_language?.toUpperCase()}
                </span>
              </span>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setUseAdvancedEditor(!useAdvancedEditor)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>{useAdvancedEditor ? 'Simple View' : 'Advanced View'}</span>
                </button>
                
                {!useAdvancedEditor && (
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                  </button>
                )}
                
                <button
                  onClick={copyCode}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                  title="Copy code"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Code Display */}
            <div className="flex-1 overflow-hidden">
              {useAdvancedEditor ? (
                <div className="h-full">
                  <CodeEditor
                    initialCode={post.code_content || ''}
                    language={post.code_language || 'javascript'}
                    readOnly={true}
                    showRunButton={true}
                    height="100%"
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col lg:flex-row">
                  {/* Code Panel */}
                  <div className="flex-1 overflow-auto">
                    <SyntaxHighlighter
                      language={post.code_language || 'javascript'}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        background: 'transparent',
                        fontSize: '16px',
                        lineHeight: '1.6',
                        height: '100%',
                        minHeight: '400px'
                      }}
                    >
                      {post.code_content || ''}
                    </SyntaxHighlighter>
                  </div>
                  
                  {/* Output Panel */}
                  {output && (
                    <div className="flex-1 border-t lg:border-t-0 lg:border-l border-gray-600 flex flex-col">
                      <div className="px-4 py-3 bg-gray-700 border-b border-gray-600">
                        <span className="text-lg font-medium text-gray-300">Output</span>
                      </div>
                      <div className="flex-1 p-4 bg-gray-900 text-gray-100 font-mono text-sm overflow-auto">
                        <pre className="whitespace-pre-wrap">{output}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-lg">{likesCount}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-500 transition-colors">
              <MessageCircle className="w-6 h-6" />
              <span className="text-lg">{post.comments_count || 0}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-400 hover:text-green-500 transition-colors">
              <Share className="w-6 h-6" />
              <span className="text-lg">{post.shares_count || 0}</span>
            </button>
          </div>
          
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`transition-colors ${
              isSaved ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
            }`}
          >
            <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodePostModal;