
import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Bookmark, Play, ExternalLink, Github, CheckCircle, Edit, MoreHorizontal } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeEditor from './CodeEditor';
import CodePlayground from './CodePlayground';
import CodePostModal from './CodePostModal';
import SharePostModal from './SharePostModal';
import EditPostModal from './EditPostModal';
import PostOptionsDropdown from './PostOptionsDropdown';
import Comments from './Comments';
import { executeCode } from '../utils/codeRunner';
import { supabase, type PostWithUser } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const PostCard: React.FC<{ 
  post: PostWithUser; 
  onPostUpdate?: (updatedPost: PostWithUser) => void;
  onPostDeleted?: (postId: string) => void;
}> = ({ 
  post: initialPost, 
  onPostUpdate,
  onPostDeleted
}) => {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(false);
  const [inFeedOutput, setInFeedOutput] = useState('');
  const [inFeedIsRunning, setInFeedIsRunning] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);

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

  const handleShare = () => {
    setShowShareModal(true);
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

  const handleCodeClick = () => {
    if (post.type === 'code' && post.code_content) {
      setShowCodeModal(true);
    }
  };

  const handleEditPost = () => {
    setShowEditModal(true);
  };

  const handlePostUpdated = (updatedPost: PostWithUser) => {
    setPost(updatedPost);
    if (onPostUpdate) {
      onPostUpdate(updatedPost);
    }
  };

  const handlePostDeleted = () => {
    if (onPostDeleted) {
      onPostDeleted(post.id);
    }
  };

  const handleCommentsCountChange = (count: number) => {
    setCommentsCount(count);
  };

  const isOwner = user && user.id === post.user_id;

  return (
    <>
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 mx-1 sm:mx-2 lg:mx-0">
        {/* Header */}
        <div className="p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <img
              src={post.profiles.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150'}
              alt={post.profiles.username}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-white text-sm sm:text-base truncate">{post.profiles.username}</span>
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
              </div>
              <span className="text-xs sm:text-sm text-gray-400">{formatTimeAgo(post.created_at)}</span>
            </div>
          </div>
          
          {/* Options Menu for Post Owner */}
          {isOwner && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <PostOptionsDropdown
                isOpen={showOptionsMenu}
                postId={post.id}
                postUserId={post.user_id}
                onClose={() => setShowOptionsMenu(false)}
                onPostDeleted={handlePostDeleted}
                onEditPost={handleEditPost}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <p className="text-white mb-3 text-sm sm:text-base break-words">{post.content}</p>
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
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

          {/* Code Block - Now clickable with better mobile layout */}
          {post.type === 'code' && post.code_content && post.code_language && (
            <div 
              className="bg-gray-900 rounded-lg overflow-hidden mb-3 sm:mb-4 cursor-pointer hover:ring-1 hover:ring-purple-500 transition-all"
              onClick={handleCodeClick}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 gap-2 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-300 capitalize flex items-center flex-shrink-0">
                  <span className="mr-2">{post.code_language}</span>
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                    {post.code_language.toUpperCase()}
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={handleEditCode}
                    className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    <span className="hidden xs:inline">{useAdvancedEditor ? 'Simple' : 'Advanced'}</span>
                    <span className="xs:hidden">{useAdvancedEditor ? 'S' : 'A'}</span>
                  </button>
                  
                  {!useAdvancedEditor && (
                    <button
                      onClick={handleRunCodeInFeed}
                      disabled={inFeedIsRunning}
                      className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded-md transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span className="hidden xs:inline">{inFeedIsRunning ? 'Running...' : 'Run'}</span>
                      <span className="xs:hidden">▶</span>
                    </button>
                  )}
                  
                  <button
                    onClick={handleOpenPlayground}
                    className="flex items-center space-x-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors"
                  >
                    <span className="hidden xs:inline">Playground</span>
                    <span className="xs:hidden">Play</span>
                  </button>
                </div>
              </div>
              
              {useAdvancedEditor ? (
                <div className="p-0" onClick={(e) => e.stopPropagation()}>
                  <CodeEditor
                    initialCode={post.code_content}
                    language={post.code_language}
                    readOnly={true}
                    showRunButton={true}
                    height="200px"
                  />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto text-xs sm:text-sm max-h-32 sm:max-h-40 overflow-y-hidden relative">
                    <SyntaxHighlighter
                      language={post.code_language}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        padding: '0.5rem',
                        background: 'transparent',
                        fontSize: 'inherit',
                      }}
                    >
                      {post.code_content}
                    </SyntaxHighlighter>
                    <div className="absolute bottom-0 left-0 right-0 h-6 sm:h-8 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
                  </div>
                  <div className="px-3 sm:px-4 py-2 bg-gray-700 text-xs text-gray-400 text-center">
                    Tap to view full code
                  </div>
                  
                  {/* In-feed Output */}
                  {inFeedOutput && (
                    <div className="border-t border-gray-600" onClick={(e) => e.stopPropagation()}>
                      <div className="px-3 sm:px-4 py-2 bg-gray-700 border-b border-gray-600">
                        <span className="text-xs sm:text-sm font-medium text-gray-300">Output</span>
                      </div>
                      <div className="p-3 sm:p-4 bg-gray-900 text-gray-100 font-mono text-xs sm:text-sm max-h-24 sm:max-h-32 overflow-auto">
                        <pre className="whitespace-pre-wrap break-words">{inFeedOutput}</pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Image */}
          {post.type === 'image' && post.media_url && (
            <div className="rounded-lg overflow-hidden mb-3 sm:mb-4">
              <img
                src={post.media_url}
                alt="Post content"
                className="w-full h-auto object-cover max-h-96"
              />
            </div>
          )}

          {/* Video */}
          {post.type === 'video' && post.media_url && (
            <div className="rounded-lg overflow-hidden mb-3 sm:mb-4">
              <video
                src={post.media_url}
                controls
                className="w-full h-auto max-h-96"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Project */}
          {post.type === 'project' && (
            <div className="bg-gray-700 rounded-lg overflow-hidden mb-3 sm:mb-4">
              {post.media_url && (
                <img
                  src={post.media_url}
                  alt={post.project_title || 'Project'}
                  className="w-full h-32 sm:h-48 object-cover"
                />
              )}
              <div className="p-3 sm:p-4">
                {post.project_title && (
                  <h3 className="text-sm sm:text-lg font-semibold text-white mb-2">
                    {post.project_title}
                  </h3>
                )}
                {post.project_description && (
                  <p className="text-gray-300 text-xs sm:text-sm mb-3 break-words">
                    {post.project_description}
                  </p>
                )}
                
                {/* Tech Stack */}
                {post.project_tech_stack && post.project_tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                    {post.project_tech_stack.map((tech: string, index: number) => (
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
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {post.project_live_url && (
                    <a
                      href={post.project_live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
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
                      className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-md transition-colors"
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
        <div className="px-3 sm:px-4 py-3 border-t border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs sm:text-sm">{likesCount}</span>
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">{commentsCount}</span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-gray-400 hover:text-green-500 transition-colors"
            >
              <Share className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">{post.shares_count || 0}</span>
            </button>
          </div>
          
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`transition-colors ${
              isSaved ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
            }`}
          >
            <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Comments Section */}
        <Comments
          postId={post.id}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          commentsCount={commentsCount}
          onCommentsCountChange={handleCommentsCountChange}
        />

        {/* Click outside to close options menu */}
        {showOptionsMenu && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowOptionsMenu(false)}
          />
        )}
      </div>

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
        onPostUpdated={handlePostUpdated}
      />

      {/* Code Post Modal */}
      <CodePostModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        post={post}
      />

      {/* Code Playground Modal */}
      {showPlayground && post.code_content && post.code_language && (
        <CodePlayground
          isOpen={showPlayground}
          onClose={() => setShowPlayground(false)}
          initialCode={post.code_content}
          initialLanguage={post.code_language}
        />
      )}

      {/* Share Post Modal */}
      <SharePostModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
      />
    </>
  );
};

export default PostCard;