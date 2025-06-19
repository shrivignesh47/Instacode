import React from 'react';
import { ChevronRight, X, Users, MessageCircle } from 'lucide-react';
import DailyChallengeCard from './DailyChallengeCard';

interface RightSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  onClose?: () => void;
  screenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobile,
  onClose,
  screenSize
}) => {
  if (isCollapsed) {
    return null;
  }

  const sidebarWidth = screenSize === '2xl' ? 'w-96' : 'w-80';

  return (
    <aside className={`h-[calc(100vh-4rem)] ${sidebarWidth} bg-gray-800 border-l border-gray-700 overflow-y-auto`}>
      {/* Mobile Close Button */}
      {isMobile && onClose && (
        <div className="flex justify-end p-4 border-b border-gray-700">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Daily Challenges */}
        <DailyChallengeCard />

        {/* Suggested Connections */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Suggested Connections</h3>
            <button className="text-gray-400 hover:text-white text-xs">See All</button>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={`https://images.pexels.com/photos/2379${i}04/pexels-photo-2379${i}04.jpeg?auto=compress&cs=tinysrgb&w=50`}
                      alt={`Developer ${i}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-sm font-medium text-white">dev_ninja_{i}</div>
                      <div className="text-xs text-gray-400">Full-stack Developer</div>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trending Topics */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Trending Topics</h3>
            <button className="text-gray-400 hover:text-white text-xs">See All</button>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {['react', 'typescript', 'nextjs', 'tailwind', 'ai'].map((tag, i) => (
                <div key={tag} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-xs">#{i + 1}</span>
                    <span className="text-purple-400 hover:text-purple-300 cursor-pointer">#{tag}</span>
                  </div>
                  <span className="text-xs text-gray-500">{(Math.random() * 1000).toFixed(0)} posts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Communities */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Active Communities</h3>
            <button className="text-gray-400 hover:text-white text-xs">See All</button>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {[
                { name: 'React Developers', members: 15420, color: 'bg-blue-500' },
                { name: 'TypeScript Enthusiasts', members: 8900, color: 'bg-blue-600' },
                { name: 'Web3 Builders', members: 5600, color: 'bg-purple-500' }
              ].map((community) => (
                <div key={community.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${community.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                      {community.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm text-white">{community.name}</div>
                      <div className="flex items-center text-xs text-gray-400">
                        <Users className="w-3 h-3 mr-1" />
                        <span>{community.members.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Forum Topics */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-700 border-b border-gray-600 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Recent Forum Topics</h3>
            <button className="text-gray-400 hover:text-white text-xs">See All</button>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {[
                'Best practices for React state management',
                'TypeScript generics explained',
                'Optimizing API calls in Next.js'
              ].map((topic) => (
                <div key={topic} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-white line-clamp-1">{topic}</div>
                    <div className="flex items-center text-xs text-gray-400">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      <span>{(Math.random() * 100).toFixed(0)} replies</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;