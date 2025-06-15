
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Search, MoreHorizontal, Heart, HeartOff, Bookmark, BookmarkMinus, Share2 } from 'lucide-react';

interface PostGridProps {
  posts: any[];
  totalPosts: number;
  currentPage: number;
  postsPerPage: number;
  sortOrder: 'newest' | 'oldest';
  searchQuery: string;
  likeCount: number;
  isPostLiked: boolean;
  isBookmarked: boolean;
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
  totalPosts,
  currentPage,
  postsPerPage,
  sortOrder,
  searchQuery,
  likeCount,
  isPostLiked,
  isBookmarked,
  onToggleSortOrder,
  onPageChange,
  onSearchChange,
  onPostOptions,
  onLikePost,
  onBookmarkPost,
  onShareClick
}: PostGridProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Posts</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSortOrder}
            className="px-3 py-2 rounded-md text-sm bg-gray-700 hover:bg-gray-600 text-gray-300"
          >
            Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search posts..."
              className="pl-8 pr-4 py-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Post Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts
          .filter((post: any) => {
            if (!searchQuery) return true;
            const title = post.title || post.content || '';
            const description = post.description || post.content || '';
            return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   description.toLowerCase().includes(searchQuery.toLowerCase());
          })
          .map((post: any) => (
            <div key={post.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="relative">
                {post.media_url && (
                  <img
                    src={post.media_url}
                    alt={post.title || 'Post image'}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => onPostOptions(post)}
                    className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-lg font-semibold mb-2">{post.title || 'Untitled'}</h4>
                <p className={`text-gray-400 text-sm mb-3 ${isDescriptionExpanded ? '' : 'line-clamp-2'}`}>
                  {post.description || post.content || 'No description'}
                </p>
                {(post.description || post.content) && (post.description || post.content).length > 100 && (
                  <button onClick={toggleDescription} className="text-purple-500 text-xs hover:underline">
                    {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                  </button>
                )}
                <div className="flex items-center justify-between text-gray-500 text-sm">
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <div className="flex space-x-3">
                    <button onClick={onLikePost}>
                      {isPostLiked ? <Heart className="w-4 h-4 text-red-500" /> : <HeartOff className="w-4 h-4" />}
                    </button>
                    <span>{likeCount}</span>
                    <button onClick={onBookmarkPost}>
                      {isBookmarked ? <Bookmark className="w-4 h-4 text-blue-500" /> : <BookmarkMinus className="w-4 h-4" />}
                    </button>
                    <button onClick={onShareClick}>
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Pagination */}
      {totalPosts > postsPerPage && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 inline-block mr-2" />
            Previous
          </button>
          <span className="mx-4 text-gray-400">Page {currentPage} of {Math.ceil(totalPosts / postsPerPage)}</span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === Math.ceil(totalPosts / postsPerPage)}
            className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="w-4 h-4 inline-block ml-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PostGrid;