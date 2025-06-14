import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, ShoppingBag, Settings, LogOut, Code, Menu, MessageCircle, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TaurusAIChat from './TaurusAIChat';

interface TopNavigationProps {
  onMobileSidebarToggle?: () => void;
  onMobileRightSidebarToggle?: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ 
  onMobileSidebarToggle, 
  onMobileRightSidebarToggle 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTaurusChat, setShowTaurusChat] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 z-40">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Mobile Menu Button */}
            <button
              onClick={onMobileSidebarToggle}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/home" className="flex items-center space-x-2">
              <Code className="w-8 h-8 text-purple-500" />
              <span className="text-xl font-bold text-white hidden sm:block">InstaCode</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/home"
                className="text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-gray-700"
              >
                Home
              </Link>
              <Link
                to="/explore"
                className="text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-gray-700"
              >
                Explore
              </Link>
              <Link
                to="/create"
                className="text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-gray-700"
              >
                Create
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-lg mx-4 lg:mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users, posts, code..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            <button className="hidden sm:block p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700">
              <ShoppingBag className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Taurus AI Chat Button */}
            <button 
              onClick={() => setShowTaurusChat(true)}
              className="p-2 text-gray-400 hover:text-purple-400 transition-colors rounded-full hover:bg-gray-700 relative"
              title="Talk with Taurus AI"
            >
              <Bot className="w-5 h-5" />
            </button>
            
            <Link
              to="/settings"
              className="hidden sm:block p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* Mobile Messages Button */}
            <button
              onClick={onMobileRightSidebarToggle}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
            >
              <MessageCircle className="w-5 h-5" />
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-700 transition-colors"
              >
                <img
                  src={user?.avatar}
                  alt={user?.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-2">
                  <Link
                    to={`/profile/${user?.username}`}
                    className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    View Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    Settings
                  </Link>
                  <hr className="border-gray-700 my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Taurus AI Chat Modal */}
      <TaurusAIChat 
        isOpen={showTaurusChat}
        onClose={() => setShowTaurusChat(false)}
      />
    </>
  );
};

export default TopNavigation;