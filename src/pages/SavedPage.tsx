import { useState, useEffect } from 'react';
import { Bookmark, Grid, List, Search, Filter, Code, Image, Video, FolderOpen, Heart, MessageCircle, Share, ExternalLink, Github, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';

const SavedPage = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState<'all' | 'code' | 'image' | 'video' | 'project'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchSavedPosts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch bookmarks with post data
        const { data: bookmarks, error: bookmarksError } = await supabase
          .from('bookmarks')
          .select(`
            id,
            post_id,
            created_at,
            posts (
              *,
              profiles (
                id,
                username,
                avatar_url,
                display_name
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (bookmarksError) {
          throw bookmarksError;
        }
        
        // Transform the data to get the posts with bookmark info
        const posts = bookmarks
          .filter(bookmark => bookmark.posts) // Filter out any null posts
          .map(bookmark => ({
            ...bookmark.posts,
            bookmark_id: bookmark.id,
            bookmark_date: bookmark.created_at
          }));
          
        setSavedPosts(posts);
      } catch (err: any) {
        console.error('Error fetching saved posts:', err);
        setError(err.message || 'Failed to load saved posts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSavedPosts();
  }, [user]);

  const removeBookmark = async (bookmarkId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Remove from local state
      setSavedPosts(prev => prev.filter(post => post.bookmark_id !== bookmarkId));
    } catch (err: any) {
      console.error('Error removing bookmark:', err);
      alert('Failed to remove bookmark');
    }
  };

  const filteredPosts = savedPosts.filter(post => {
    const matchesFilter = activeFilter === 'all' || post.type === activeFilter;
    const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (post.tags && post.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesFilter && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'code': return <Code className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'project': return <FolderOpen className="w-4 h-4" />;
      default: return <Bookmark className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'code': return 'text-purple-400';
      case 'image': return 'text-blue-400';
      case 'video': return 'text-red-400';
      case 'project': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

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

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Saved Posts</h1>
        <p className="text-gray-400">Your collection of saved posts, code snippets, and projects</p>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved posts..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filters and View Mode */}
          <div className="flex items-center space-x-4">
            {/* Type Filter */}
            <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
              {[
                { key: 'all', label: 'All', icon: Filter },
                { key: 'code', label: 'Code', icon: Code },
                { key: 'image', label: 'Images', icon: Image },
                { key: 'video', label: 'Videos', icon: Video },
                { key: 'project', label: 'Projects', icon: FolderOpen }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key as any)}
                  className={`flex items-center space-x-1 px-2 lg:px-3 py-1 rounded-md text-xs lg:text-sm transition-colors ${
                    activeFilter === key
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* View Mode */}
            <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mr-3" />
          <span className="text-white text-lg">Loading saved posts...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">No saved posts found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || activeFilter !== 'all' 
              ? "Try adjusting your filters or search query" 
              : "Start saving posts to build your collection"}
          </p>
          <Link 
            to="/explore" 
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors inline-block"
          >
            Explore Content
          </Link>
        </div>
      )}

      {/* Posts */}
      {!loading && !error && filteredPosts.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
                >
                  {post.media_url && (
                    <div className="aspect-video relative">
                      <img
                        src={post.media_url}
                        alt={post.title || post.content}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <div className={`p-1 bg-gray-900 bg-opacity-80 rounded-full ${getTypeColor(post.type)}`}>
                          {getTypeIcon(post.type)}
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <button 
                          onClick={() => removeBookmark(post.bookmark_id)}
                          className="p-1 bg-gray-900 bg-opacity-80 rounded-full text-yellow-500 hover:text-yellow-400 transition-colors"
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
                      {post.project_title || post.title || post.content.substring(0, 30)}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {post.project_description || post.content}
                    </p>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <img
                        src={post.profiles.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${post.profiles.username}`}
                        alt={post.profiles.username}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-400">{post.profiles.display_name || post.profiles.username}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">Saved {formatTimeAgo(post.bookmark_date)}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags && post.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-700 text-purple-400 text-xs rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{post.likes_count || 0}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{post.comments_count || 0}</span>
                        </span>
                      </div>
                      <span className="capitalize">{post.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 p-4 lg:p-6 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {post.media_url ? (
                        <img
                          src={post.media_url}
                          alt={post.title || post.content}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center bg-gray-700`}>
                          <div className={getTypeColor(post.type)}>
                            {getTypeIcon(post.type)}
                          </div>
                        </div>
                      )}
                      <div className="absolute top-1 left-1">
                        <div className={`p-1 bg-gray-900 bg-opacity-80 rounded-full ${getTypeColor(post.type)}`}>
                          {getTypeIcon(post.type)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg lg:text-xl font-semibold text-white">
                          {post.project_title || post.title || post.content.substring(0, 30)}
                        </h3>
                        <button 
                          onClick={() => removeBookmark(post.bookmark_id)}
                          className="text-yellow-500 hover:text-yellow-400 transition-colors ml-2"
                        >
                          <Bookmark className="w-5 h-5 fill-current" />
                        </button>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-3">{post.project_description || post.content}</p>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <img
                          src={post.profiles.avatar_url || `https://api.dicebear.com/7.x/personas/svg?seed=${post.profiles.username}`}
                          alt={post.profiles.username}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm text-gray-400">{post.profiles.display_name || post.profiles.username}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">Saved {formatTimeAgo(post.bookmark_date)}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags && post.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-700 text-purple-400 text-xs rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                            <span>{post.likes_count || 0}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments_count || 0}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Share className="w-4 h-4" />
                            <span>{post.shares_count || 0}</span>
                          </span>
                        </div>
                        
                        {post.type === 'project' && (
                          <div className="flex space-x-2">
                            {post.project_live_url && (
                              <a
                                href={post.project_live_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Live</span>
                              </a>
                            )}
                            {post.project_github_url && (
                              <a
                                href={post.project_github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-md transition-colors"
                              >
                                <Github className="w-3 h-3" />
                                <span>Code</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Load More */}
      {!loading && !error && filteredPosts.length > 10 && (
        <div className="text-center mt-8">
          <button className="px-4 lg:px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm lg:text-base">
            Load More Saved Posts
          </button>
        </div>
      )}
    </div>
  );
};

export default SavedPage;