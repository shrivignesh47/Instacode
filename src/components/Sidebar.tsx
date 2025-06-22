import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Plus, 
  Users, 
  MessageCircle, 
  Hash, 
  User, 
  Bookmark, 
  TrendingUp,
  X,
  Settings,
  Code2,
  Zap,
  Award,
  Trophy,
  FileCode
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  isMobile?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
  screenSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, 
  isMobile, 
  onClose, 
}) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Plus, label: 'Create', path: '/create' },
    { icon: FileCode, label: 'Problems', path: '/problems' },
    { icon: Trophy, label: 'Challenges', path: '/challenges' },
    { icon: Code2, label: 'Playground', path: '/playground' },
    { icon: Zap, label: 'CodeAnalyser', path: '/code-analyser' },
    { icon: Award, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Users, label: 'Communities', path: '/communities' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Hash, label: 'Forums', path: '/forums' },
    { icon: User, label: 'Profile', path: `/profile/${user?.username}` },
    { icon: Bookmark, label: 'Saved', path: '/saved' },
    { icon: TrendingUp, label: 'Trending', path: '/trending' },
  ];

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const sidebarWidth = isCollapsed && !isMobile ? 'w-16' : 'w-64';
  const sidebarHeight = isMobile ? 'h-full' : 'h-screen';

  return (
    <aside className={`${sidebarWidth} ${sidebarHeight} bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col`}>
      {/* Mobile Close Button */}
      {isMobile && (
        <div className="flex justify-end p-4 border-b border-gray-700">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Navigation Items */}
      <nav className={`flex-1 px-2 space-y-1 ${isMobile ? 'py-4' : 'py-6'}`}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group relative ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              } ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
              title={isCollapsed && !isMobile ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(!isCollapsed || isMobile) && (
                <span className="ml-3 truncate">{item.label}</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && !isMobile && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {(!isCollapsed || isMobile) && (
        <>
          {/* Settings Link */}
          <div className="px-4 py-3 border-t border-gray-700">
            <Link
              to="/settings"
              onClick={handleLinkClick}
              className={`flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors ${
                location.pathname === '/settings'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="truncate">Settings</span>
            </Link>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;