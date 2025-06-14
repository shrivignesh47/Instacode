import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Bookmark, Play, ExternalLink, Github, CheckCircle, Code, Edit } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeEditor from './CodeEditor';
import CodePlayground from './CodePlayground';
import { executeCode } from '../utils/codeRunner';
import { supabase, type PostWithUser } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface PostCardProps {
  post: PostWithUser;
  onPostUpdate?: (updatedPost: PostWithUser) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(false);
  const [inFeedOutput, setInFeedOutput] = useState('');
  const [inFeedIsRunning, setInFeedIsRunning] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [sharesCount, setSharesCount] = useState(post.shares_count);

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
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (!error) {
          setIsLiked(false);
          setLikesCount(prev => prev - 1);
        }
      } else {
        // Like the post
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });

        if (!error) {
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Check out this ${post.type} by ${post.profiles.username}`,
          text: post.content,
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
      setSharesCount(prev => prev + 1);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleRunCodeInFeed = async () => {
    if (!post.code_content || !post.code_language) return;
    
    setInFeedIsRunning(true);
    setInFeedOutput('Running...');

    try {
      const result = await executeCode(post.code_content, post.code_language);
      setInFeedOutput(result);
    } catch (error) {
      setInFeedOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setInFeedIsRunning(false);
    }
  };

  const handleOpenPlayground = () => {
    if (post.code_content && post.code_language) {
      setShowPlayground(true);
    }
  };

  const handleEditCode = () => {
    setUseAdvancedEditor(!useAdvancedEditor);
    setInFeedOutput('');
  };

  return (
    <>
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 mx-2 lg:mx-0">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={post.profiles.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150'}
              alt={post.profiles.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white">{post.profiles.username}</span>
                <CheckCircle className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm text-gray-400">{formatTimeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          <p className="text-white mb-3 text-sm lg:text-base">{post.content}</p>
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-purple-400 text-xs lg:text-sm hover:text-purple-300 cursor-pointer"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          {/* Code Block */}
          {post.type === 'code' && post.code_content && post.code_language && (
            <div className="bg-gray-900 rounded-lg overflow-hidden mb-4">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-700">
                <span className="text-sm text-gray-300 capitalize flex items-center">
                  <span className="mr-2">{post.code_language}</span>
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                    {post.code_language.toUpperCase()}
                  </span>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleEditCode}
                    className="flex items-center space-x-1 px-2 lg:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs lg:text-sm rounded-md transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    <span>{useAdvancedEditor ? 'Simple' : 'Advanced'}</span>
                  </button>
                  
                  {!useAdvancedEditor && (
                    <button
                      onClick={handleRunCodeInFeed}
                      disabled={inFeedIsRunning}
                      className="flex items-center space-x-1 px-2 lg:px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs lg:text-sm rounded-md transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>{inFeedIsRunning ? 'Running...' : 'Run'}</span>
                    </button>
                  )}
                  
                  <button
                    onClick={handleOpenPlayground}
                    className="flex items-center space-x-1 px-2 lg:px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs lg:text-sm rounded-md transition-colors"
                  >
                    <Code className="w-3 h-3" />
                    <span>Playground</span>
                  </button>
                </div>
              </div>
              
              {useAdvancedEditor ? (
                <div className="p-0">
                  <CodeEditor
                    initialCode={post.code_content}
                    language={post.code_language}
                    readOnly={true}
                    showRunButton={true}
                    height="300px"
                  />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto text-xs lg:text-sm">
                    <SyntaxHighlighter
                      language={post.code_language}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        padding: '0.75rem',
                        background: 'transparent',
                        fontSize: 'inherit',
                      }}
                    >
                      {post.code_content}
                    </SyntaxHighlighter>
                  </div>
                  
                  {/* In-feed Output */}
                  {inFeedOutput && (
                    <div className="border-t border-gray-600">
                      <div className="px-4 py-2 bg-gray-700 border-b border-gray-600">
                        <span className="text-sm font-medium text-gray-300">Output</span>
                      </div>
                      <div className="p-4 bg-gray-900 text-gray-100 font-mono text-sm max-h-32 overflow-auto">
                        <pre className="whitespace-pre-wrap">{inFeedOutput}</pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Image */}
          {post.type === 'image' && post.media_url && (
            <div className="rounded-lg overflow-hidden mb-4">
              <img
                src={post.media_url}
                alt="Post content"
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Video */}
          {post.type === 'video' && post.media_url && (
            <div className="rounded-lg overflow-hidden mb-4">
              <video
                src={post.media_url}
                controls
                className="w-full h-auto"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Project */}
          {post.type === 'project' && (
            <div className="bg-gray-700 rounded-lg overflow-hidden mb-4">
              {post.media_url && (
                <img
                  src={post.media_url}
                  alt={post.project_title || 'Project'}
                  className="w-full h-32 lg:h-48 object-cover"
                />
              )}
              <div className="p-4">
                {post.project_title && (
                  <h3 className="text-base lg:text-lg font-semibold text-white mb-2">
                    {post.project_title}
                  </h3>
                )}
                {post.project_description && (
                  <p className="text-gray-300 text-xs lg:text-sm mb-3">
                    {post.project_description}
                  </p>
                )}
                
                {/* Tech Stack */}
                {post.project_tech_stack && post.project_tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.project_tech_stack.map((tech, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-600 text-gray-200 text-xs rounded-md"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Project Links */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  {post.project_live_url && (
                    <a
                      href={post.project_live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs lg:text-sm rounded-md transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Live Demo</span>
                    </a>
                  )}
                  {post.project_github_url && (
                    <a
                      href={post.project_github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs lg:text-sm rounded-md transition-colors"
                    >
                      <Github className="w-3 h-3" />
                      <span>GitHub</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-4 lg:space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs lg:text-sm">{likesCount}</span>
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs lg:text-sm">{commentsCount}</span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-gray-400 hover:text-green-500 transition-colors"
            >
              <Share className="w-5 h-5" />
              <span className="text-xs lg:text-sm">{sharesCount}</span>
            </button>
          </div>
          
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`transition-colors ${
              isSaved ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="px-4 py-3 bg-gray-700 border-t border-gray-600">
            <div className="text-sm text-gray-400">
              Comments feature will be implemented here...
            </div>
          </div>
        )}
      </div>

      {/* Code Playground Modal */}
      {showPlayground && post.code_content && post.code_language && (
        <CodePlayground
          isOpen={showPlayground}
          onClose={() => setShowPlayground(false)}
          initialCode={post.code_content}
          initialLanguage={post.code_language}
        />
      )}
    </>
  );
};

export default PostCard;