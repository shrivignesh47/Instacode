import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Plus, MessageCircle, User, Search, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import UserSearchModal from './UserSearchModal';
import NotificationsModal from './NotificationsModal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const MobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Fetch unread notification count
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

    // Real-time subscription for notifications
    const channel = supabase
      .channel('mobile_notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        () => {
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

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Plus, label: 'Create', path: '/create' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profile', path: `/profile/${user?.username}` },
  ];

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
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-50 safe-area-pb">
        <div className="flex items-center justify-around py-1 px-1">
          {/* Search Button */}
          <button
            onClick={() => setShowUserSearch(true)}
            className="flex flex-col items-center py-2 px-2 rounded-lg transition-colors min-w-0 flex-1 text-gray-400 hover:text-white"
          >
            <Search className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs mt-1 truncate">Search</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => setShowNotificationsModal(true)}
            className="flex flex-col items-center py-2 px-2 rounded-lg transition-colors min-w-0 flex-1 text-gray-400 hover:text-white relative"
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1/4 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
            <span className="text-xs mt-1 truncate">Alerts</span>
          </button>

          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors min-w-0 flex-1 ${
                  isActive
                    ? 'text-purple-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs mt-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

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

export default MobileNavigation;