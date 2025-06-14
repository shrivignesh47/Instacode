import React, { useState } from 'react';
import { Users, Plus, Search, TrendingUp, Star, MapPin, Calendar, Hash, Crown, Shield, Award } from 'lucide-react';

const CommunitiesPage = () => {
  const [activeTab, setActiveTab] = useState<'discover' | 'joined' | 'created'>('discover');
  const [searchQuery, setSearchQuery] = useState('');

  const communities = [
    {
      id: 1,
      name: 'React Developers',
      description: 'A community for React developers to share knowledge, discuss best practices, and collaborate on projects.',
      image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400',
      members: 15420,
      posts: 1240,
      category: 'Frontend',
      isJoined: true,
      isVerified: true,
      tags: ['react', 'javascript', 'frontend'],
      location: 'Global',
      created: '2 years ago',
      moderators: ['sarah_dev', 'react_master'],
      recentActivity: '2 minutes ago',
    },
    {
      id: 2,
      name: 'Python Enthusiasts',
      description: 'Everything Python - from web development to data science, machine learning, and automation.',
      image: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=400',
      members: 12340,
      posts: 980,
      category: 'Backend',
      isJoined: false,
      isVerified: true,
      tags: ['python', 'data-science', 'backend'],
      location: 'Global',
      created: '3 years ago',
      moderators: ['python_guru', 'data_scientist'],
      recentActivity: '5 minutes ago',
    },
    {
      id: 3,
      name: 'DevOps Engineers',
      description: 'Share DevOps practices, tools, and experiences. Discuss CI/CD, containerization, and cloud technologies.',
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400',
      members: 8900,
      posts: 760,
      category: 'DevOps',
      isJoined: true,
      isVerified: false,
      tags: ['devops', 'docker', 'kubernetes'],
      location: 'Global',
      created: '1 year ago',
      moderators: ['devops_pro'],
      recentActivity: '10 minutes ago',
    },
    {
      id: 4,
      name: 'Mobile App Developers',
      description: 'Cross-platform mobile development community. React Native, Flutter, Swift, Kotlin, and more.',
      image: 'https://images.pexels.com/photos/3184302/pexels-photo-3184302.jpeg?auto=compress&cs=tinysrgb&w=400',
      members: 6780,
      posts: 520,
      category: 'Mobile',
      isJoined: false,
      isVerified: true,
      tags: ['mobile', 'react-native', 'flutter'],
      location: 'Global',
      created: '1.5 years ago',
      moderators: ['mobile_guru', 'flutter_dev'],
      recentActivity: '15 minutes ago',
    },
    {
      id: 5,
      name: 'AI & Machine Learning',
      description: 'Explore the world of artificial intelligence and machine learning. Share research, projects, and insights.',
      image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400',
      members: 9200,
      posts: 890,
      category: 'AI/ML',
      isJoined: true,
      isVerified: true,
      tags: ['ai', 'machine-learning', 'deep-learning'],
      location: 'Global',
      created: '2.5 years ago',
      moderators: ['ai_researcher', 'ml_expert'],
      recentActivity: '20 minutes ago',
    },
    {
      id: 6,
      name: 'Web3 Builders',
      description: 'Building the decentralized web. Discuss blockchain, smart contracts, DeFi, and Web3 technologies.',
      image: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=400',
      members: 5600,
      posts: 430,
      category: 'Web3',
      isJoined: false,
      isVerified: false,
      tags: ['web3', 'blockchain', 'solidity'],
      location: 'Global',
      created: '8 months ago',
      moderators: ['blockchain_dev'],
      recentActivity: '30 minutes ago',
    },
  ];

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         community.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === 'joined') {
      return matchesSearch && community.isJoined;
    }
    if (activeTab === 'created') {
      return matchesSearch && false; // No created communities in mock data
    }
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Communities</h1>
        <p className="text-gray-400">Join communities, connect with like-minded developers, and grow together</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-4 sm:mb-0">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-md font-medium transition-colors text-sm lg:text-base ${
              activeTab === 'discover'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`px-4 py-2 rounded-md font-medium transition-colors text-sm lg:text-base ${
              activeTab === 'joined'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Joined
          </button>
          <button
            onClick={() => setActiveTab('created')}
            className={`px-4 py-2 rounded-md font-medium transition-colors text-sm lg:text-base ${
              activeTab === 'created'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Created
          </button>
        </div>

        <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center space-x-2 text-sm lg:text-base">
          <Plus className="w-4 h-4" />
          <span>Create Community</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Popular</span>
            </button>
            <button className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm">
              <Star className="w-4 h-4" />
              <span>Featured</span>
            </button>
          </div>
        </div>
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCommunities.map((community) => (
          <div
            key={community.id}
            className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
          >
            {/* Community Header */}
            <div className="relative h-32 lg:h-40">
              <img
                src={community.image}
                alt={community.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-4 right-4 flex space-x-2">
                {community.isVerified && (
                  <div className="bg-blue-600 p-1 rounded-full">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="bg-gray-800 bg-opacity-80 px-2 py-1 rounded-full">
                  <span className="text-xs text-white">{community.category}</span>
                </div>
              </div>
            </div>

            {/* Community Content */}
            <div className="p-4 lg:p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg lg:text-xl font-semibold text-white">{community.name}</h3>
                {community.isJoined ? (
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm transition-colors">
                    Joined
                  </button>
                ) : (
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm transition-colors">
                    Join
                  </button>
                )}
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {community.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {community.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-700 text-purple-400 text-xs rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{community.members.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Hash className="w-4 h-4" />
                    <span>{community.posts}</span>
                  </div>
                </div>
                <span>{community.recentActivity}</span>
              </div>

              {/* Community Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-700">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{community.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Created {community.created}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State for Created Communities */}
      {activeTab === 'created' && filteredCommunities.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">No communities created yet</h3>
          <p className="text-gray-500 mb-6">Start building your own community and connect with developers</p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg font-medium transition-colors">
            Create Your First Community
          </button>
        </div>
      )}

      {/* Load More */}
      {filteredCommunities.length > 0 && (
        <div className="text-center mt-8">
          <button className="px-4 lg:px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm lg:text-base">
            Load More Communities
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunitiesPage;