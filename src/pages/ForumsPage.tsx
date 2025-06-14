import React, { useState } from 'react';
import { Hash, Users, MessageCircle, Plus, Search, TrendingUp, Clock, Pin, Star } from 'lucide-react';

const ForumsPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Forums', count: 156 },
    { id: 'frontend', name: 'Frontend', count: 45 },
    { id: 'backend', name: 'Backend', count: 38 },
    { id: 'mobile', name: 'Mobile', count: 22 },
    { id: 'devops', name: 'DevOps', count: 18 },
    { id: 'ai', name: 'AI/ML', count: 15 },
    { id: 'web3', name: 'Web3', count: 12 },
    { id: 'career', name: 'Career', count: 6 },
  ];

  const forums = [
    {
      id: 1,
      title: 'React Best Practices 2024',
      category: 'frontend',
      author: 'sarah_dev',
      authorAvatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50',
      replies: 24,
      views: 1200,
      lastActivity: '2 hours ago',
      isPinned: true,
      tags: ['react', 'best-practices', 'performance'],
      excerpt: 'Discussing the latest React patterns and optimization techniques for 2024...',
    },
    {
      id: 2,
      title: 'Node.js vs Deno: Which to choose in 2024?',
      category: 'backend',
      author: 'alex_builds',
      authorAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50',
      replies: 18,
      views: 890,
      lastActivity: '4 hours ago',
      isPinned: false,
      tags: ['nodejs', 'deno', 'comparison'],
      excerpt: 'A comprehensive comparison of Node.js and Deno for modern backend development...',
    },
    {
      id: 3,
      title: 'Getting Started with React Native',
      category: 'mobile',
      author: 'mobile_guru',
      authorAvatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50',
      replies: 32,
      views: 1500,
      lastActivity: '6 hours ago',
      isPinned: false,
      tags: ['react-native', 'mobile', 'beginner'],
      excerpt: 'Complete guide for beginners starting their React Native journey...',
    },
    {
      id: 4,
      title: 'Docker Best Practices for Development',
      category: 'devops',
      author: 'devops_pro',
      authorAvatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50',
      replies: 15,
      views: 650,
      lastActivity: '8 hours ago',
      isPinned: false,
      tags: ['docker', 'devops', 'containers'],
      excerpt: 'Essential Docker practices every developer should know...',
    },
    {
      id: 5,
      title: 'Machine Learning with Python: Resources',
      category: 'ai',
      author: 'ai_researcher',
      authorAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50',
      replies: 28,
      views: 1100,
      lastActivity: '12 hours ago',
      isPinned: false,
      tags: ['python', 'machine-learning', 'resources'],
      excerpt: 'Curated list of the best ML resources for Python developers...',
    },
    {
      id: 6,
      title: 'Web3 Development: Where to Start?',
      category: 'web3',
      author: 'blockchain_dev',
      authorAvatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50',
      replies: 12,
      views: 420,
      lastActivity: '1 day ago',
      isPinned: false,
      tags: ['web3', 'blockchain', 'solidity'],
      excerpt: 'Complete roadmap for getting started with Web3 development...',
    },
  ];

  const filteredForums = forums.filter(forum => {
    const matchesCategory = activeCategory === 'all' || forum.category === activeCategory;
    const matchesSearch = forum.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         forum.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Developer Forums</h1>
        <p className="text-gray-400">Join discussions, ask questions, and share knowledge with the community</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 space-y-6">
          {/* Create New Topic */}
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Topic</span>
          </button>

          {/* Categories */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
                    activeCategory === category.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Forum Stats */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Forum Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Topics</span>
                <span className="text-white font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Posts</span>
                <span className="text-white font-medium">8,567</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Users</span>
                <span className="text-white font-medium">456</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Online Now</span>
                <span className="text-green-400 font-medium">89</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search and Filters */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics, tags, or content..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <button className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>Trending</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Recent</span>
                </button>
              </div>
            </div>
          </div>

          {/* Forum Topics */}
          <div className="space-y-4">
            {filteredForums.map((forum) => (
              <div
                key={forum.id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-4 lg:p-6 hover:border-gray-600 transition-colors cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={forum.authorAvatar}
                    alt={forum.author}
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {forum.isPinned && (
                          <Pin className="w-4 h-4 text-yellow-500" />
                        )}
                        <h3 className="text-base lg:text-lg font-semibold text-white hover:text-purple-400 transition-colors">
                          {forum.title}
                        </h3>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {forum.excerpt}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {forum.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-700 text-purple-400 text-xs rounded-md hover:bg-gray-600 cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>by {forum.author}</span>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{forum.replies} replies</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{forum.views} views</span>
                        </div>
                      </div>
                      <span>{forum.lastActivity}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-8">
            <button className="px-4 lg:px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm lg:text-base">
              Load More Topics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumsPage;