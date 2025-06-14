import React, { useState } from 'react';
import { Hash, Users, TrendingUp, Code, Flame, Award } from 'lucide-react';

const ExplorePage = () => {
  const [activeTab, setActiveTab] = useState<'trending' | 'forums' | 'challenges'>('trending');

  const trendingPosts = [
    {
      id: 1,
      title: 'The Future of Web Development in 2024',
      author: 'sarah_dev',
      views: '12.5k',
      tags: ['#webdev', '#future', '#trends'],
      type: 'discussion',
    },
    {
      id: 2,
      title: 'Building Scalable React Applications',
      author: 'alex_builds',
      views: '8.3k',
      tags: ['#react', '#scalability', '#architecture'],
      type: 'code',
    },
    {
      id: 3,
      title: 'AI-Powered Code Generation Tools',
      author: 'tech_guru',
      views: '15.2k',
      tags: ['#ai', '#tools', '#productivity'],
      type: 'project',
    },
  ];

  const forums = [
    {
      id: 1,
      name: 'Frontend Development',
      description: 'Discuss React, Vue, Angular and modern frontend technologies',
      members: 15420,
      posts: 1240,
      icon: '🎨',
      color: 'bg-blue-500',
    },
    {
      id: 2,
      name: 'Backend Engineering',
      description: 'Node.js, Python, Java, databases and server-side development',
      members: 12340,
      posts: 980,
      icon: '⚙️',
      color: 'bg-green-500',
    },
    {
      id: 3,
      name: 'DevOps & Cloud',
      description: 'AWS, Docker, Kubernetes, CI/CD and cloud infrastructure',
      members: 8900,
      posts: 760,
      icon: '☁️',
      color: 'bg-orange-500',
    },
    {
      id: 4,
      name: 'Mobile Development',
      description: 'React Native, Flutter, Swift, Kotlin and mobile app development',
      members: 6780,
      posts: 520,
      icon: '📱',
      color: 'bg-purple-500',
    },
    {
      id: 5,
      name: 'Data Science & AI',
      description: 'Machine learning, data analysis, Python, R and AI development',
      members: 9200,
      posts: 890,
      icon: '🤖',
      color: 'bg-pink-500',
    },
    {
      id: 6,
      name: 'Web3 & Blockchain',
      description: 'Smart contracts, DeFi, NFTs and blockchain development',
      members: 5600,
      posts: 430,
      icon: '⛓️',
      color: 'bg-yellow-500',
    },
  ];

  const challenges = [
    {
      id: 1,
      title: '30 Days of Code',
      description: 'Complete daily coding challenges to improve your skills',
      participants: 2400,
      difficulty: 'Beginner',
      reward: '500 XP',
      color: 'bg-green-500',
    },
    {
      id: 2,
      title: 'React Component Challenge',
      description: 'Build reusable React components from scratch',
      participants: 1800,
      difficulty: 'Intermediate',
      reward: '750 XP',
      color: 'bg-blue-500',
    },
    {
      id: 3,
      title: 'Full-Stack Project Challenge',
      description: 'Create a complete web application with frontend and backend',
      participants: 950,
      difficulty: 'Advanced',
      reward: '1000 XP',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Explore</h1>
        <p className="text-gray-400">Discover trending content, join forums, and participate in challenges</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-8">
        <button
          onClick={() => setActiveTab('trending')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'trending'
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Trending</span>
        </button>
        <button
          onClick={() => setActiveTab('forums')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'forums'
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Forums</span>
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'challenges'
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Challenges</span>
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'trending' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Flame className="w-5 h-5 text-orange-500 mr-2" />
              Trending Now
            </h2>
            <div className="grid gap-6">
              {trendingPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white mb-2">{post.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                        <span>by {post.author}</span>
                        <span>{post.views} views</span>
                        <span className="capitalize">{post.type}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-purple-400 text-sm hover:text-purple-300 cursor-pointer"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        {post.type === 'code' && <Code className="w-6 h-6 text-white" />}
                        {post.type === 'discussion' && <Hash className="w-6 h-6 text-white" />}
                        {post.type === 'project' && <TrendingUp className="w-6 h-6 text-white" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'forums' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Hash className="w-5 h-5 text-purple-500 mr-2" />
              Developer Forums
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {forums.map((forum) => (
                <div
                  key={forum.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${forum.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                      {forum.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white mb-2">{forum.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">{forum.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{forum.members.toLocaleString()} members</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Hash className="w-4 h-4" />
                          <span>{forum.posts} posts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors">
                      Join Forum
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Award className="w-5 h-5 text-yellow-500 mr-2" />
              Coding Challenges
            </h2>
            <div className="grid gap-6">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-10 h-10 ${challenge.color} rounded-lg flex items-center justify-center`}>
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-white">{challenge.title}</h3>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              challenge.difficulty === 'Beginner'
                                ? 'bg-green-900 text-green-300'
                                : challenge.difficulty === 'Intermediate'
                                ? 'bg-yellow-900 text-yellow-300'
                                : 'bg-red-900 text-red-300'
                            }`}>
                              {challenge.difficulty}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-purple-400">{challenge.reward}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-400 mb-4">{challenge.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {challenge.participants.toLocaleString()} participants
                        </span>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                          Join Challenge
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;