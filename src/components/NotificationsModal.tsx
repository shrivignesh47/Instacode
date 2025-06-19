import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle, Loader2, User, MessageCircle, Heart, MessageSquare, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  type: string;
  entity_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
  profiles?: { 
    username: string; 
    avatar_url: string | null;
    display_name: string | null;
  } | null;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: () => void; // Callback to update parent's unread count
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, onMarkAsRead }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }

    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select(`
            *,
            profiles!notifications_sender_id_fkey(username, avatar_url, display_name)
          `)
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50); // Limit to recent notifications

        if (fetchError) {
          throw fetchError;
        }

        setNotifications(data || []);
      } catch (err: any) {
        console.error('Error fetching notifications:', err);
        setError(err.message || 'Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Real-time listener for new notifications
    const channel = supabase
      .channel('notifications_modal_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          // Fetch the new notification with profile data
          supabase
            .from('notifications')
            .select(`*, profiles!notifications_sender_id_fkey(username, avatar_url, display_name)`)
            .eq('id', payload.new.id)
            .single()
            .then(({ data, error }) => {
              if (data && !error) {
                setNotifications(prev => [data as Notification, ...prev]);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('recipient_id', user?.id); // Ensure only recipient can mark as read

      if (updateError) {
        throw updateError;
      }

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      onMarkAsRead(); // Call parent callback
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user?.id)
        .eq('is_read', false);

      if (updateError) {
        throw updateError;
      }

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      // Update parent's count to 0
      const unreadCount = notifications.filter(n => !n.is_read).length;
      for (let i = 0; i < unreadCount; i++) {
        onMarkAsRead();
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'follow' && notification.sender_id) {
      // Get username of follower
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', notification.sender_id)
        .single();
      
      if (data?.username) {
        navigate(`/profile/${data.username}`);
      }
    } 
    else if (notification.type === 'message' && notification.entity_id) {
      navigate(`/messages`);
    }
    else if ((notification.type === 'post_like' || notification.type === 'post_comment' || notification.type === 'new_post_from_followed') && notification.entity_id) {
      // Navigate to the post
      navigate(`/post/${notification.entity_id}`);
    }

    onClose();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-green-400" />;
      case 'post_like':
        return <Heart className="w-4 h-4 text-red-400" />;
      case 'post_comment':
        return <MessageSquare className="w-4 h-4 text-yellow-400" />;
      case 'new_post_from_followed':
        return <Bell className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-4 flex justify-end">
          <button
            onClick={markAllAsRead}
            className="text-purple-400 hover:text-purple-300 text-sm"
            disabled={notifications.filter(n => !n.is_read).length === 0}
          >
            Mark all as read
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500 mr-2" />
              <span className="text-gray-400">Loading notifications...</span>
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Bell className="w-12 h-12 text-gray-500 mb-3" />
              <span className="text-gray-400 text-center">No notifications yet.</span>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                    notification.is_read ? 'bg-gray-700' : 'bg-gray-700/50 hover:bg-gray-600'
                  }`}
                >
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-3"></div>
                  )}
                  <div className="flex-shrink-0 relative">
                    {notification.profiles?.avatar_url ? (
                      <img
                        src={notification.profiles.avatar_url}
                        alt={notification.profiles.username || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{notification.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-gray-400 text-xs">{formatTimeAgo(notification.created_at)}</span>
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-1 text-gray-400 hover:text-purple-400 transition-colors flex-shrink-0 text-xs"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;