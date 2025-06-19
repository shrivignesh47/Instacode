import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, ShoppingBag, Settings, LogOut, Code, Menu, MessageCircle, Bot, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TaurusAIChat from './TaurusAIChat';
import UserSearchModal from './UserSearchModal';
import NotificationsModal from './NotificationsModal';
import { supabase } from '../lib/supabaseClient';

interface TopNavigationProps {
  onMobileSidebarToggle?: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ 
  onMobileSidebarToggle
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTaurusChat, setShowTaurusChat] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch unread notification count on component mount and real-time updates
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread notifications:', error);
      } else {
        setUnreadNotificationCount(count || 0);
      }
    };

    fetchUnreadCount();

    // Real-time subscription for new notifications
    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          setUnreadNotificationCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          // If a notification is marked as read, decrement count
          if (payload.old.is_read === false && payload.new.is_read === true) {
            setUnreadNotificationCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUserSelect = (selectedUser: any) => {
    navigate(`/profile/${selectedUser.username}`);
  };

  const handleStartConversation = (selectedUser: any) => {
    navigate(`/messages?user=${selectedUser.username}`);
  };

  const handleMarkAsRead = () => {
    setUnreadNotificationCount(prev => Math.max(0, prev - 1));
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
                onClick={() => setShowUserSearch(true)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
                readOnly
              />
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            <button className="hidden sm:block p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700">
              <ShoppingBag className="w-5 h-5" />
            </button>
            
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotificationsModal(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700 relative"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center -mt-1 -mr-1">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
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
            <Link
              to="/messages"
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
            >
              <MessageCircle className="w-5 h-5" />
            </Link>

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

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onUserSelect={handleUserSelect}
        onStartConversation={handleStartConversation}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        onMarkAsRead={handleMarkAsRead}
      />
    </>
  );
};

export default TopNavigation;