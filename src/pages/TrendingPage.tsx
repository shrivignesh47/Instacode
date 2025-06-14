import React, { useState } from 'react';
import { TrendingUp, Flame, Clock, Star, Hash, Users, MessageCircle, Heart, Share, Code, Image, Video, FolderOpen, Award, Calendar } from 'lucide-react';

const TrendingPage = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [activeCategory, setActiveCategory] = useState<'all' | 'code' | 'image' | 'video' | 'project'>('all');

  const trendingPosts = [
    {
      id: 1,
      type: 'code' as const,
      title: 'Revolutionary React Hook for State Management',
      author: 'react_wizard',
      authorAvatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50',
      preview: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=300',
      content: 'A game-changing React hook that simplifies complex state management patterns.',
      tags: ['react', 'hooks', 'state-management'],
      stats: { likes: 2456, comments: 189, shares: 234, views: 15600 },
      trendingScore: 98,
      timePosted: '4 hours ago',
      growth: '+156%',
    },
    {
      id: 2,
      type: 'project' as const,
      title: 'Open Source AI Code Assistant',
      author: 'ai_developer',
      authorAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50',
      preview: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=300',
      content: 'An open-source AI-powered code assistant that helps developers write better code faster.',
      tags: ['ai', 'open-source', 'productivity'],
      stats: { likes: 1890, comments: 156, shares: 298, views: 12400 },
      trendingScore: 95,
      timePosted: '6 hours ago',
      growth: '+234%',
    },
    {
      id: 3,
      type: 'video' as const,
      title: 'Building a Full-Stack App in 10 Minutes',
      author: 'speed_coder',
      authorAvatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50',
      preview: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=300',
      content: 'Watch me build a complete full-stack application from scratch in just 10 minutes.',
      tags: ['tutorial', 'fullstack', 'speed-coding'],
      stats: { likes: 3245, comments: 267, shares: 445, views: 28900 },
      trendingScore: 92,
      timePosted: '8 hours ago',
      growth: '+189%',
    },
    {
      id: 4,
      type: 'image' as const,
      title: 'The Ultimate Developer Setup 2024',
      author: 'setup_master',
      authorAvatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50',
      preview: 'https://images.pexels.com/photos/3184302/pexels-photo-3184302.jpeg?auto=compress&cs=tinysrgb&w=300',
      content: 'My productivity-focused developer setup that increased my coding efficiency by 300%.',
      tags: ['setup', 'productivity', 'workspace'],
      stats: { likes: 1567, comments: 89, shares: 156, views: 8900 },
      trendingScore: 88,
      timePosted: '12 hours ago',
      growth: '+123%',
    },
    {
      id: 5,
      type: 'code' as const,
      title: 'CSS Grid Layout Tricks You Didn\'t Know',
      author: 'css_ninja',
      authorAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50',
      preview: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=300',
      content: 'Advanced CSS Grid techniques that will revolutionize your layout game.',
      tags: ['css', 'grid', 'layout'],
      stats: { likes: 1234, comments: 78, shares: 134, views: 7800 },
      trendingScore: 85,
      timePosted: '1 day ago',
      growth: '+98%',
    },
    {
      id: 6,
      type: 'project' as const,
      title: 'Real-time Collaborative Code Editor',
      author: 'collab_dev',
      authorAvatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50',
      preview: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=300',
      content: 'A real-time collaborative code editor built with WebRTC and operational transforms.',
      tags: ['collaboration', 'webrtc', 'editor'],
      stats: { likes: 987, comments: 67, shares: 89, views: 5600 },
      trendingScore: 82,
      timePosted: '1 day ago',
      growth: '+76%',
    }
  ];

  const trendingTags = [
    { tag: 'react', posts: 1234, growth: '+23%' },
    { tag: 'javascript', posts: 2345, growth: '+18%' },
    { tag: 'python', posts: 1567, growth: '+34%' },
    { tag: 'ai', posts: 890, growth: '+67%' },
    { tag: 'webdev', posts: 1890, growth: '+12%' },
    { tag: 'typescript', posts: 1123, growth: '+29%' },
    { tag: 'nextjs', posts: 678, growth: '+45%' },
    { tag: 'nodejs', posts: 1345, growth: '+15%' },
  ];

  const trendingDevelopers = [
    {
      username: 'react_wizard',
      avatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50',
      followers: 15600,
      growth: '+234%',
      specialty: 'React Expert',
    },
    {
      username: 'ai_developer',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50',
      followers: 12400,
      growth: '+189%',
      specialty: 'AI/ML Engineer',
    },
    {
      username: 'speed_coder',
      avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=50',
      followers: 28900,
      growth: '+156%',
      specialty: 'Full-Stack Dev',
    },
    {
      username: 'css_ninja',
      avatar: 'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=50',
      followers: 8900,
      growth: '+123%',
      specialty: 'CSS Master',
    },
  ];

  const filteredPosts = trendingPosts.filter(post => 
    activeCategory === 'all' || post.type === activeCategory
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'code': return <Code className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'project': return <FolderOpen className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
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
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center">
          <Flame className="w-8 h-8 text-orange-500 mr-3" />
          Trending
        </h1>
        <p className="text-gray-400">Discover what's hot in the developer community right now</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Time Period Tabs */}
          <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-6">
            {[
              { key: 'today', label: 'Today', icon: Clock },
              { key: 'week', label: 'This Week', icon: Calendar },
              { key: 'month', label: 'This Month', icon: Calendar },
              { key: 'year', label: 'This Year', icon: Award }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-md font-medium transition-colors text-sm lg:text-base ${
                  activeTab === key
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: 'all', label: 'All', icon: TrendingUp },
              { key: 'code', label: 'Code', icon: Code },
              { key: 'image', label: 'Images', icon: Image },
              { key: 'video', label: 'Videos', icon: Video },
              { key: 'project', label: 'Projects', icon: FolderOpen }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeCategory === key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Trending Posts */}
          <div className="space-y-6">
            {filteredPosts.map((post, index) => (
              <div
                key={post.id}
                className="bg-gray-800 rounded-xl border border-gray-700 p-4 lg:p-6 hover:border-gray-600 transition-colors cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  {/* Trending Rank */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">#{index + 1}</div>
                  </div>

                  {/* Post Preview */}
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
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

                  {/* Post Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg lg:text-xl font-semibold text-white line-clamp-1">{post.title}</h3>
                      <div className="flex items-center space-x-2 ml-4">
                        <div className="flex items-center space-x-1 text-green-400 text-sm">
                          <TrendingUp className="w-4 h-4" />
                          <span>{post.growth}</span>
                        </div>
                        <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {post.trendingScore}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{post.content}</p>

                    <div className="flex items-center space-x-2 mb-3">
                      <img
                        src={post.authorAvatar}
                        alt={post.author}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-400">{post.author}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{post.timePosted}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-700 text-purple-400 text-xs rounded-md hover:bg-gray-600 cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.stats.likes.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.stats.comments}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Share className="w-4 h-4" />
                          <span>{post.stats.shares}</span>
                        </span>
                        <span className="hidden lg:flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{post.stats.views.toLocaleString()} views</span>
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 capitalize">{post.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 space-y-6">
          {/* Trending Tags */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Hash className="w-5 h-5 text-purple-500 mr-2" />
              Trending Tags
            </h3>
            <div className="space-y-3">
              {trendingTags.map((tag, index) => (
                <div key={tag.tag} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                    <span className="text-purple-400 hover:text-purple-300 cursor-pointer">
                      #{tag.tag}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-500">{tag.posts.toLocaleString()}</span>
                    <span className="text-green-400">{tag.growth}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Developers */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Star className="w-5 h-5 text-yellow-500 mr-2" />
              Trending Developers
            </h3>
            <div className="space-y-4">
              {trendingDevelopers.map((dev, index) => (
                <div key={dev.username} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-400 w-6">#{index + 1}</span>
                  <img
                    src={dev.avatar}
                    alt={dev.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium text-sm">{dev.username}</span>
                      <span className="text-green-400 text-xs">{dev.growth}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">{dev.specialty}</span>
                      <span className="text-gray-500 text-xs">{dev.followers.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Stats */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Trending Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Trending Posts</span>
                <span className="text-white font-medium">2,456</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Engagement</span>
                <span className="text-white font-medium">156K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Growth Rate</span>
                <span className="text-green-400 font-medium">+234%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Trends</span>
                <span className="text-white font-medium">89</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingPage;