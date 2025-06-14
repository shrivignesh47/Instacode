import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, ShoppingBag, Settings, LogOut, Code, Menu, MessageCircle, Bot, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TaurusAIChat from './TaurusAIChat';

interface TopNavigationProps {
  onMobileSidebarToggle?: () => void;
  onMobileRightSidebarToggle?: () => void;
}

interface SearchResult {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  verified: boolean;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ 
  onMobileSidebarToggle, 
  onMobileRightSidebarToggle 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTaurusChat, setShowTaurusChat] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const { user, logout, searchUsers } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const users = await searchUsers(query);
      setSearchResults(users.map(user => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        verified: user.verified,
      })));
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleUserSelect = (username: string) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    navigate(`/profile/${username}`);
  };

  const handleStartConversation = (username: string) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    navigate(`/messages?user=${username}`);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
          <div className="hidden sm:flex flex-1 max-w-lg mx-4 lg:mx-8 relative" ref={searchRef}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="p-4 text-center">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <span className="text-gray-400 text-sm">Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="px-4 py-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex items-center space-x-3 flex-1 min-w-0"
                              onClick={() => handleUserSelect(result.username)}
                            >
                              <img
                                src={result.avatar}
                                alt={result.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-white font-medium truncate">{result.username}</span>
                                  {result.verified && (
                                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs">✓</span>
                                    </div>
                                  )}
                                </div>
                                {result.bio && (
                                  <p className="text-gray-400 text-sm truncate">{result.bio}</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartConversation(result.username);
                              }}
                              className="ml-2 p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-600 rounded-full transition-colors"
                              title="Send message"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <User className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <span className="text-gray-400 text-sm">No users found</span>
                    </div>
                  )}
                </div>
              )}
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