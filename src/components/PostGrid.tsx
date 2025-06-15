
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

  const filteredPosts = getFilteredPosts();

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h3 className="text-2xl font-semibold">
          {activeTab === 'posts' ? 'All Posts' : 
           activeTab === 'project' ? 'Projects' :
           activeTab === 'code' ? 'Code Snippets' :
           activeTab === 'image' ? 'Images' :
           activeTab === 'video' ? 'Videos' : 'Posts'}
          <span className="text-lg text-gray-400 ml-3">({filteredPosts.length})</span>
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
          <button
            onClick={onToggleSortOrder}
            className="px-6 py-3 rounded-xl text-base bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all w-full sm:w-auto"
          >
            Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </button>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search posts..."
              className="pl-12 pr-6 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full text-base"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Responsive Post Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
        {filteredPosts.map((post: any) => {
          const isWidePost = post.type === 'code' || post.type === 'project';
          
          return (
            <div 
              key={post.id} 
              className={`bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                isWidePost ? 'md:col-span-2 lg:col-span-3' : 'col-span-1'
              }`}
            >
              <div className="relative">
                {post.media_url && (
                  <img
                    src={post.media_url}
                    alt={post.title || 'Post image'}
                    className={`w-full object-cover ${isWidePost ? 'h-64 sm:h-80' : 'h-48 sm:h-64'}`}
                  />
                )}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => onPostOptions(post)}
                    className="p-3 bg-gray-900 bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all backdrop-blur-sm"
                  >
                    <MoreHorizontal className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold text-white truncate flex-1 mr-3">
                    {post.title || post.content?.substring(0, 30) || 'Untitled'}
                  </h4>
                  <span className="text-sm bg-purple-600 px-4 py-2 rounded-full capitalize text-white flex-shrink-0 font-medium">
                    {post.type}
                  </span>
                </div>
                
                <p className={`text-gray-400 text-base mb-5 leading-relaxed ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
                  {post.description || post.content || 'No description'}
                </p>
                
                {(post.description || post.content) && (post.description || post.content).length > 120 && (
                  <button onClick={toggleDescription} className="text-purple-400 text-sm hover:underline mb-5 font-medium">
                    {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                  </button>
                )}

                {/* Enhanced Code Block for Code Posts */}
                {post.type === 'code' && post.code_content && post.code_language && (
                  <div className="bg-gray-900 rounded-xl overflow-hidden mb-5 border border-gray-600">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 bg-gray-700 gap-3">
                      <span className="text-base text-gray-300 capitalize flex items-center font-medium">
                        <span className="mr-3">{post.code_language}</span>
                        <span className="text-sm bg-gray-600 px-3 py-1 rounded-full font-normal">
                          {post.code_language.toUpperCase()}
                        </span>
                      </span>
                      <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <button
                          onClick={() => toggleAdvancedEditor(post.id)}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium flex-1 sm:flex-initial"
                        >
                          <Edit className="w-4 h-4" />
                          <span>{useAdvancedEditor[post.id] ? 'Simple' : 'Advanced'}</span>
                        </button>
                        
                        {!useAdvancedEditor[post.id] && (
                          <button
                            onClick={() => handleRunCode(post)}
                            disabled={runningCode[post.id]}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors font-medium flex-1 sm:flex-initial"
                          >
                            <Play className="w-4 h-4" />
                            <span>{runningCode[post.id] ? 'Running...' : 'Run'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {useAdvancedEditor[post.id] ? (
                      <div className="p-0">
                        <CodeEditor
                          initialCode={post.code_content}
                          language={post.code_language}
                          readOnly={true}
                          showRunButton={true}
                          height="500px"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto text-base max-h-96 lg:max-h-[500px] overflow-y-auto">
                          <SyntaxHighlighter
                            language={post.code_language}
                            style={oneDark}
                            customStyle={{
                              margin: 0,
                              padding: '1.5rem',
                              background: 'transparent',
                              fontSize: '15px',
                              lineHeight: '1.6',
                            }}
                          >
                            {post.code_content}
                          </SyntaxHighlighter>
                        </div>
                        
                        {/* Code Output */}
                        {codeOutputs[post.id] && (
                          <div className="border-t border-gray-600">
                            <div className="px-5 py-3 bg-gray-700 border-b border-gray-600">
                              <span className="text-base font-medium text-gray-300">Output</span>
                            </div>
                            <div className="p-5 bg-gray-900 text-gray-100 font-mono text-sm max-h-60 overflow-auto">
                              <pre className="whitespace-pre-wrap">{codeOutputs[post.id]}</pre>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Enhanced Project Preview for Project Posts */}
                {post.type === 'project' && (
                  <div className="bg-gray-700 rounded-xl overflow-hidden mb-5">
                    {post.project_title && (
                      <div className="p-6 border-b border-gray-600">
                        <h5 className="text-2xl font-semibold text-white mb-4">{post.project_title}</h5>
                        {post.project_description && (
                          <p className="text-gray-300 text-lg leading-relaxed">{post.project_description}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Tech Stack */}
                    {post.project_tech_stack && post.project_tech_stack.length > 0 && (
                      <div className="px-6 py-5 border-b border-gray-600">
                        <div className="flex flex-wrap gap-3">
                          {post.project_tech_stack.slice(0, 6).map((tech: string, index: number) => (
                            <span
                              key={index}
                              className="px-4 py-2 bg-gray-600 text-gray-200 text-base rounded-lg font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                          {post.project_tech_stack.length > 6 && (
                            <span className="px-4 py-2 bg-gray-600 text-gray-400 text-base rounded-lg font-medium">
                              +{post.project_tech_stack.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-500 text-base">
                  <span className="text-sm font-medium">{new Date(post.created_at).toLocaleDateString()}</span>
                  <div className="flex space-x-6">
                    <button 
                      onClick={onLikePost}
                      className="flex items-center space-x-2 hover:text-red-400 transition-colors"
                    >
                      {isPostLiked ? <Heart className="w-5 h-5 text-red-500 fill-current" /> : <HeartOff className="w-5 h-5" />}
                      <span className="text-sm font-medium">{likeCount}</span>
                    </button>
                    <button 
                      onClick={onBookmarkPost}
                      className="hover:text-yellow-400 transition-colors"
                    >
                      {isBookmarked ? <Bookmark className="w-5 h-5 text-yellow-500 fill-current" /> : <BookmarkMinus className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={onShareClick}
                      className="hover:text-green-400 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Posts Message */}
      {filteredPosts.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-xl">No {activeTab === 'posts' ? 'posts' : activeTab + 's'} found</p>
        </div>
      )}

      {/* Pagination */}
      {filteredPosts.length > postsPerPage && (
        <div className="flex flex-col sm:flex-row justify-center items-center mt-12 space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center px-8 py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base font-medium w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-3" />
            Previous
          </button>
          <span className="text-gray-400 font-medium text-lg">
            Page {currentPage} of {Math.ceil(filteredPosts.length / postsPerPage)}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === Math.ceil(filteredPosts.length / postsPerPage)}
            className="flex items-center px-8 py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base font-medium w-full sm:w-auto justify-center"
          >
            Next
            <ArrowRight className="w-5 h-5 ml-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PostGrid;