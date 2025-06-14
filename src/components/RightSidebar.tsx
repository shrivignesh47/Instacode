import React, { useState } from 'react';
import { Hash, Plus, Search, X, Users, Award, Trophy, Target } from 'lucide-react';

interface RightSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  screenSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const RightSidebar: React.FC<RightSidebarProps> = ({ 
  isMobile, 
  onClose, 
  isCollapsed = false, 
  onToggleCollapse,
  screenSize = 'lg'
}) => {
  const [activeTab, setActiveTab] = useState<'forums' | 'communities'>('forums');
  const [searchQuery, setSearchQuery] = useState('');

  const forums = [
    {
      id: 1,
      name: 'Frontend Development',
      members: 15420,
      description: 'Discuss React, Vue, Angular and more',
      color: 'bg-blue-500',
      isJoined: true,
    },
    {
      id: 2,
      name: 'Backend Engineering',
      members: 12340,
      description: 'Node.js, Python, Java discussions',
      color: 'bg-green-500',
      isJoined: false,
    },
    {
      id: 3,
      name: 'DevOps & Cloud',
      members: 8900,
      description: 'AWS, Docker, Kubernetes and CI/CD',
      color: 'bg-orange-500',
      isJoined: true,
    },
    {
      id: 4,
      name: 'Mobile Development',
      members: 6780,
      description: 'React Native, Flutter, Swift, Kotlin',
      color: 'bg-purple-500',
      isJoined: false,
    },
  ];

  const communities = [
    {
      id: 1,
      name: 'React Developers',
      members: 25600,
      description: 'Share React tips, tricks, and projects',
      image: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=50',
      isJoined: true,
      activity: 'Very Active',
    },
    {
      id: 2,
      name: 'Python Enthusiasts',
      members: 18900,
      description: 'Python programming community',
      image: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=50',
      isJoined: false,
      activity: 'Active',
    },
    {
      id: 3,
      name: 'AI & Machine Learning',
      members: 14200,
      description: 'Explore AI and ML together',
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=50',
      isJoined: true,
      activity: 'Very Active',
    },
    {
      id: 4,
      name: 'Web3 Builders',
      members: 9800,
      description: 'Building the decentralized web',
      image: 'https://images.pexels.com/photos/3184302/pexels-photo-3184302.jpeg?auto=compress&cs=tinysrgb&w=50',
      isJoined: false,
      activity: 'Moderate',
    },
  ];

  // Collapsed state for desktop
  if (isCollapsed && !isMobile) {
    return (
      <aside className="w-16 h-screen bg-gray-800 border-l border-gray-700 flex flex-col items-center py-4 overflow-hidden">
        <div className="flex flex-col space-y-3">
          <div 
            className="p-2 bg-blue-500 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors group relative" 
            title="Forums"
            onClick={() => onToggleCollapse?.()}
          >
            <Hash className="w-6 h-6 text-white" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Forums
            </div>
          </div>
          <div 
            className="p-2 bg-green-500 rounded-lg cursor-pointer hover:bg-green-600 transition-colors group relative" 
            title="Communities"
            onClick={() => onToggleCollapse?.()}
          >
            <Users className="w-6 h-6 text-white" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Communities
            </div>
          </div>
          <div 
            className="p-2 bg-purple-500 rounded-lg cursor-pointer hover:bg-purple-600 transition-colors group relative" 
            title="Challenges"
            onClick={() => onToggleCollapse?.()}
          >
            <Trophy className="w-6 h-6 text-white" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Challenges
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const sidebarWidth = screenSize === '2xl' ? 'w-96' : 'w-80';
  const sidebarHeight = isMobile ? 'h-full' : 'h-screen';

  return (
    <aside className={`${sidebarWidth} ${sidebarHeight} bg-gray-800 border-l border-gray-700 flex flex-col transition-all duration-300 overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Discover</h2>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('forums')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'forums'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Hash className="w-4 h-4 mr-2" />
            <span>Forums</span>
          </button>
          <button
            onClick={() => setActiveTab('communities')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'communities'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            <span>Communities</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'forums' ? (
          <div className="p-4 space-y-3">
            {forums.map((forum) => (
              <div
                key={forum.id}
                className="p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 ${forum.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Hash className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-white truncate">{forum.name}</h4>
                      {forum.isJoined && (
                        <span className="text-xs text-green-400 flex-shrink-0">Joined</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">{forum.description}</p>
                    <p className="text-xs text-gray-500">
                      {forum.members.toLocaleString()} members
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {communities.map((community) => (
              <div
                key={community.id}
                className="p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={community.image}
                    alt={community.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-white truncate">{community.name}</h4>
                      {community.isJoined && (
                        <span className="text-xs text-green-400 flex-shrink-0">Joined</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">{community.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {community.members.toLocaleString()} members
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                        community.activity === 'Very Active' ? 'bg-green-900 text-green-300' :
                        community.activity === 'Active' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {community.activity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Challenge Button */}
      <div className="p-4 border-t border-gray-700 flex-shrink-0">
        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center text-sm">
          <Trophy className="w-4 h-4 mr-2" />
          <span>Create Challenge</span>
        </button>
      </div>
    </aside>
  );
};

export default RightSidebar;