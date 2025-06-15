
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Plus, MessageCircle, User, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import UserSearchModal from './UserSearchModal';
import { useNavigate } from 'react-router-dom';

const MobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showUserSearch, setShowUserSearch] = useState(false);

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
    </>
  );
};

export default MobileNavigation;