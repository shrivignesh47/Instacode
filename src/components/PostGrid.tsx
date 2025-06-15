
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Search, MoreHorizontal, Heart, HeartOff, Bookmark, BookmarkMinus, Share2, Play, Edit } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { executeCode } from '../utils/codeRunner';
import CodeEditor from './CodeEditor';

interface PostGridProps {
  posts: any[];
  currentPage: number;
  postsPerPage: number;
  sortOrder: 'newest' | 'oldest';
  searchQuery: string;
  likeCount: number;
  isPostLiked: boolean;
  isBookmarked: boolean;
  activeTab: string;
  onToggleSortOrder: () => void;
  onPageChange: (page: number) => void;
  onSearchChange: (query: string) => void;
  onPostOptions: (post: any) => void;
  onLikePost: () => void;
  onBookmarkPost: () => void;
  onShareClick: () => void;
}

const PostGrid = ({
  posts,
  currentPage,
  postsPerPage,
  sortOrder,
  searchQuery,
  likeCount,
  isPostLiked,
  isBookmarked,
  activeTab,
  onToggleSortOrder,
  onPageChange,
  onSearchChange,
  onPostOptions,
  onLikePost,
  onBookmarkPost,
  onShareClick
}: PostGridProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [codeOutputs, setCodeOutputs] = useState<{[key: string]: string}>({});
  const [runningCode, setRunningCode] = useState<{[key: string]: boolean}>({});
  const [useAdvancedEditor, setUseAdvancedEditor] = useState<{[key: string]: boolean}>({});
  const [expandedCode, setExpandedCode] = useState<{[key: string]: boolean}>({});

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const getFilteredPosts = () => {
    let filteredPosts = posts;
    
    // Filter by tab type
    if (activeTab !== 'posts') {
      filteredPosts = posts.filter(post => post.type === activeTab);
    }
    
    // Filter by search query
    if (searchQuery) {
      filteredPosts = filteredPosts.filter((post: any) => {
        const title = post.title || post.content || '';
        const description = post.description || post.content || '';
        return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               description.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    
    return filteredPosts;
  };

  const handleRunCode = async (post: any) => {
    if (!post.code_content || !post.code_language) return;
    
    setRunningCode(prev => ({ ...prev, [post.id]: true }));
    setCodeOutputs(prev => ({ ...prev, [post.id]: 'Running...' }));

    try {
      const result = await executeCode(post.code_content, post.code_language);
      setCodeOutputs(prev => ({ ...prev, [post.id]: result }));
    } catch (error) {
      setCodeOutputs(prev => ({ 
        ...prev, 
        [post.id]: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
    } finally {
      setRunningCode(prev => ({ ...prev, [post.id]: false }));
    }
  };

  const toggleAdvancedEditor = (postId: string) => {
    setUseAdvancedEditor(prev => ({ ...prev, [postId]: !prev[postId] }));
    setCodeOutputs(prev => ({ ...prev, [postId]: '' }));
  };

  const toggleCodeExpanded = (postId: string) => {
    setExpandedCode(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const filteredPosts = getFilteredPosts();

  return (
    <div className="mb-6 sm:mb-8 w-full">
      {/* Header Section - Mobile optimized */}
      <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-6 sm:mb-8">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold">
          {activeTab === 'posts' ? 'All Posts' : 
           activeTab === 'project' ? 'Projects' :
           activeTab === 'code' ? 'Code Snippets' :
           activeTab === 'image' ? 'Images' :
           activeTab === 'video' ? 'Videos' : 'Posts'}
          <span className="text-sm sm:text-base lg:text-lg text-gray-400 ml-2">({filteredPosts.length})</span>
        </h3>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 lg:space-x-4">
          <button
            onClick={onToggleSortOrder}
            className="px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all"
          >
            Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </button>
          
          <div className="relative w-full sm:w-48 lg:w-64 xl:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search posts..."
              className="pl-10 pr-4 py-2 sm:py-2 lg:py-3 rounded-lg sm:rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full text-sm sm:text-base"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mobile-first Responsive Post Grid */}
      <div className="space-y-4 sm:space-y-6">
        {filteredPosts.map((post: any) => (
          <div 
            key={post.id} 
            className="bg-gray-800 rounded-lg sm:rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 hover:shadow-xl transition-all duration-300"
          >
            {/* Post Header */}
            <div className="relative">
              {post.media_url && (
                <img
                  src={post.media_url}
                  alt={post.title || 'Post image'}
                  className="w-full h-48 sm:h-64 lg:h-80 object-cover"
                />
              )}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                <button
                  onClick={() => onPostOptions(post)}
                  className="p-1.5 sm:p-2 bg-gray-900 bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all backdrop-blur-sm"
                >
                  <MoreHorizontal className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            
            {/* Post Content */}
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-white truncate flex-1 mr-2">
                  {post.title || post.content?.substring(0, 30) || 'Untitled'}
                </h4>
                <span className="text-xs bg-purple-600 px-2 py-1 sm:px-3 sm:py-1 rounded-full capitalize text-white flex-shrink-0 font-medium">
                  {post.type}
                </span>
              </div>
              
              <p className={`text-gray-400 text-sm sm:text-base mb-3 sm:mb-4 leading-relaxed ${isDescriptionExpanded ? '' : 'line-clamp-2 sm:line-clamp-3'}`}>
                {post.description || post.content || 'No description'}
              </p>
              
              {(post.description || post.content) && (post.description || post.content).length > 100 && (
                <button onClick={toggleDescription} className="text-purple-400 text-sm hover:underline mb-3 sm:mb-4 font-medium">
                  {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                </button>
              )}

              {/* Enhanced Code Block for Code Posts */}
              {post.type === 'code' && post.code_content && post.code_language && (
                <div className="bg-gray-900 rounded-lg overflow-hidden mb-3 sm:mb-4 border border-gray-600">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 gap-2 sm:gap-3">
                    <span className="text-sm text-gray-300 capitalize flex items-center font-medium">
                      <span className="mr-2">{post.code_language}</span>
                      <span className="text-xs bg-gray-600 px-2 py-1 rounded-full font-normal">
                        {post.code_language.toUpperCase()}
                      </span>
                    </span>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => toggleAdvancedEditor(post.id)}
                        className="flex items-center justify-center space-x-1 px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors font-medium"
                      >
                        <Edit className="w-3 h-3" />
                        <span>{useAdvancedEditor[post.id] ? 'Simple' : 'Advanced'}</span>
                      </button>
                      
                      {!useAdvancedEditor[post.id] && (
                        <button
                          onClick={() => handleRunCode(post)}
                          disabled={runningCode[post.id]}
                          className="flex items-center justify-center space-x-1 px-3 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded-lg transition-colors font-medium"
                        >
                          <Play className="w-3 h-3" />
                          <span>{runningCode[post.id] ? 'Running...' : 'Run'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleCodeExpanded(post.id)}
                        className="flex items-center justify-center space-x-1 px-3 py-1.5 sm:py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-lg transition-colors font-medium"
                      >
                        <span>{expandedCode[post.id] ? 'Collapse' : 'Expand'}</span>
                      </button>
                    </div>
                  </div>
                  
                  {useAdvancedEditor[post.id] ? (
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
                      <div className={`overflow-x-auto text-xs sm:text-sm ${expandedCode[post.id] ? 'max-h-none' : 'max-h-48 sm:max-h-64'} overflow-y-auto`}>
                        <SyntaxHighlighter
                          language={post.code_language}
                          style={oneDark}
                          customStyle={{
                            margin: 0,
                            padding: '0.75rem 1rem',
                            background: 'transparent',
                            fontSize: 'inherit',
                            lineHeight: '1.5',
                          }}
                          wrapLines={true}
                          wrapLongLines={true}
                        >
                          {post.code_content}
                        </SyntaxHighlighter>
                      </div>
                      
                      {/* Code Output */}
                      {codeOutputs[post.id] && (
                        <div className="border-t border-gray-600">
                          <div className="px-3 sm:px-4 py-2 bg-gray-700 border-b border-gray-600">
                            <span className="text-sm font-medium text-gray-300">Output</span>
                          </div>
                          <div className="p-3 sm:p-4 bg-gray-900 text-gray-100 font-mono text-xs max-h-32 sm:max-h-48 overflow-auto">
                            <pre className="whitespace-pre-wrap break-words">{codeOutputs[post.id]}</pre>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Enhanced Project Preview for Project Posts */}
              {post.type === 'project' && (
                <div className="bg-gray-700 rounded-lg overflow-hidden mb-3 sm:mb-4">
                  {post.project_title && (
                    <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-600">
                      <h5 className="text-base sm:text-lg lg:text-2xl font-semibold text-white mb-2 sm:mb-3 break-words">{post.project_title}</h5>
                      {post.project_description && (
                        <p className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed break-words">{post.project_description}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Tech Stack */}
                  {post.project_tech_stack && post.project_tech_stack.length > 0 && (
                    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-600">
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {post.project_tech_stack.slice(0, 6).map((tech: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-600 text-gray-200 text-xs sm:text-sm rounded-lg font-medium break-words"
                          >
                            {tech}
                          </span>
                        ))}
                        {post.project_tech_stack.length > 6 && (
                          <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-600 text-gray-400 text-xs sm:text-sm rounded-lg font-medium">
                            +{post.project_tech_stack.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Post Footer */}
              <div className="flex items-center justify-between text-gray-500 text-xs sm:text-sm">
                <span className="font-medium">{new Date(post.created_at).toLocaleDateString()}</span>
                <div className="flex space-x-3 sm:space-x-4">
                  <button 
                    onClick={onLikePost}
                    className="flex items-center space-x-1 hover:text-red-400 transition-colors"
                  >
                    {isPostLiked ? <Heart className="w-4 h-4 text-red-500 fill-current" /> : <HeartOff className="w-4 h-4" />}
                    <span className="font-medium">{likeCount}</span>
                  </button>
                  <button 
                    onClick={onBookmarkPost}
                    className="hover:text-yellow-400 transition-colors"
                  >
                    {isBookmarked ? <Bookmark className="w-4 h-4 text-yellow-500 fill-current" /> : <BookmarkMinus className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={onShareClick}
                    className="hover:text-green-400 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Posts Message */}
      {filteredPosts.length === 0 && (
        <div className="text-center py-12 sm:py-16 lg:py-20 text-gray-400">
          <p className="text-base sm:text-lg lg:text-xl">No {activeTab === 'posts' ? 'posts' : activeTab + 's'} found</p>
        </div>
      )}

      {/* Pagination - Mobile optimized */}
      {filteredPosts.length > postsPerPage && (
        <div className="flex flex-col sm:flex-row justify-center items-center mt-6 sm:mt-8 lg:mt-12 space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base font-medium w-full sm:w-auto justify-center max-w-xs"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>
          <span className="text-gray-400 font-medium text-sm sm:text-base lg:text-lg">
            Page {currentPage} of {Math.ceil(filteredPosts.length / postsPerPage)}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === Math.ceil(filteredPosts.length / postsPerPage)}
            className="flex items-center px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base font-medium w-full sm:w-auto justify-center max-w-xs"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PostGrid;