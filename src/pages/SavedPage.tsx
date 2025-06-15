import { useState } from 'react';
import { Bookmark, Grid, List, Search, Filter, Code, Image, Video, FolderOpen, Heart, MessageCircle, Share, ExternalLink, Github } from 'lucide-react';

const SavedPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState<'all' | 'code' | 'image' | 'video' | 'project'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const savedPosts = [
    {
      id: 1,
      type: 'code' as const,
      title: 'React Custom Hook for API Calls',
      author: 'sarah_dev',
      authorAvatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50',
      preview: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=300',
      content: 'A reusable custom hook for handling API calls with loading states, error handling, and caching.',
      tags: ['react', 'hooks', 'api'],
      savedDate: '2 days ago',
      stats: { likes: 156, comments: 28, shares: 8 },
      code: {
        language: 'javascript',
        snippet: 'const useApi = (url) => {\n  const [data, setData] = useState(null);\n  // ... rest of the hook\n};'
      }
    },
    {
      id: 2,
      type: 'project' as const,
      title: 'E-commerce Dashboard',
      author: 'alex_builds',
      authorAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50',
      preview: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=300',
      content: 'A modern e-commerce dashboard built with React, TypeScript, and Tailwind CSS.',
      tags: ['react', 'typescript', 'dashboard'],
      savedDate: '5 days ago',
      stats: { likes: 89, comments: 15, shares: 12 },
      project: {
        liveUrl: 'https://dashboard-demo.vercel.app',
        githubUrl: 'https://github.com/alexbuilds/dashboard',
        techStack: ['React', 'TypeScript', 'Tailwind CSS']
      }
    },
    {
      id: 3,
      type: 'image' as const,
      title: 'My Coding Setup',
      author: 'code_artist',
      authorAvatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50',
      preview: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=300',
      content: 'My minimalist coding setup with dual monitors, mechanical keyboard, and plants.',
      tags: ['setup', 'workspace', 'productivity'],
      savedDate: '1 week ago',
      stats: { likes: 234, comments: 42, shares: 18 }
    },
    {
      id: 4,
      type: 'video' as const,
      title: 'React Performance Tips',
      author: 'react_master',
      authorAvatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50',
      preview: 'https://images.pexels.com/photos/3184302/pexels-photo-3184302.jpeg?auto=compress&cs=tinysrgb&w=300',
      content: 'Learn advanced React performance optimization techniques in this comprehensive video tutorial.',
      tags: ['react', 'performance', 'tutorial'],
      savedDate: '2 weeks ago',
      stats: { likes: 567, comments: 89, shares: 45 }
    },
    {
      id: 5,
      type: 'code' as const,
      title: 'TypeScript Utility Types',
      author: 'ts_guru',
      authorAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50',
      preview: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=300',
      content: 'Advanced TypeScript utility types that will make your code more type-safe and maintainable.',
      tags: ['typescript', 'types', 'advanced'],
      savedDate: '3 weeks ago',
      stats: { likes: 123, comments: 34, shares: 19 },
      code: {
        language: 'typescript',
        snippet: 'type DeepPartial<T> = {\n  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];\n};'
      }
    },
    {
      id: 6,
      type: 'project' as const,
      title: 'Real-time Chat App',
      author: 'fullstack_dev',
      authorAvatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50',
      preview: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=300',
      content: 'A real-time chat application built with Socket.io, React, and Node.js.',
      tags: ['socketio', 'realtime', 'chat'],
      savedDate: '1 month ago',
      stats: { likes: 345, comments: 67, shares: 23 },
      project: {
        liveUrl: 'https://chat-app-demo.vercel.app',
        githubUrl: 'https://github.com/fullstackdev/chat-app',
        techStack: ['React', 'Node.js', 'Socket.io', 'MongoDB']
      }
    }
  ];

  const filteredPosts = savedPosts.filter(post => {
    const matchesFilter = activeFilter === 'all' || post.type === activeFilter;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
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

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">No saved posts found</h3>
          <p className="text-gray-500">Start saving posts to build your collection</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors cursor-pointer"
                >
                  <div className="aspect-video relative">
                    <img
                      src={post.preview}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <div className={`p-1 bg-gray-900 bg-opacity-80 rounded-full ${getTypeColor(post.type)}`}>
                        {getTypeIcon(post.type)}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <button className="p-1 bg-gray-900 bg-opacity-80 rounded-full text-yellow-500 hover:text-yellow-400 transition-colors">
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">{post.title}</h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{post.content}</p>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <img
                        src={post.authorAvatar}
                        alt={post.author}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-400">{post.author}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{post.savedDate}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
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
                          <span>{post.stats.likes}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{post.stats.comments}</span>
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
                  className="bg-gray-800 rounded-lg border border-gray-700 p-4 lg:p-6 hover:border-gray-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <img
                        src={post.preview}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1">
                        <div className={`p-1 bg-gray-900 bg-opacity-80 rounded-full ${getTypeColor(post.type)}`}>
                          {getTypeIcon(post.type)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg lg:text-xl font-semibold text-white">{post.title}</h3>
                        <button className="text-yellow-500 hover:text-yellow-400 transition-colors ml-2">
                          <Bookmark className="w-5 h-5 fill-current" />
                        </button>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-3">{post.content}</p>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <img
                          src={post.authorAvatar}
                          alt={post.author}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm text-gray-400">{post.author}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">Saved {post.savedDate}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
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
                            <span>{post.stats.likes}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.stats.comments}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Share className="w-4 h-4" />
                            <span>{post.stats.shares}</span>
                          </span>
                        </div>
                        
                        {post.project && (
                          <div className="flex space-x-2">
                            {post.project.liveUrl && (
                              <a
                                href={post.project.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Live</span>
                              </a>
                            )}
                            {post.project.githubUrl && (
                              <a
                                href={post.project.githubUrl}
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
      {filteredPosts.length > 0 && (
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