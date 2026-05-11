import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Notification } from '../types';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.id) setCurrentUserId(userData.user.id);
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (full_name, avatar_url)
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n: any) => !n.read).length);
    } catch (err) {
      console.error('Erreur notifications:', err);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications-' + Math.random().toString(36).substr(2, 9))
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: any) => {
          if (payload.new.user_id === currentUserId) {
            setNotifications((prev) => [payload.new, ...prev]);
            setUnreadCount((prev) => prev + 1);
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
    audio.play().catch(() => {});
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const getNotificationMessage = (notif: any) => {
    const actionMap: Record<string, string> = {
      like: ' a aimé votre post',
      comment: ' a commenté votre post',
      message: ' vous a envoyé un message',
      follow: ' vous suit maintenant',
    };
    return `${notif.actor?.full_name || 'Quelqu\'un'}${actionMap[notif.type] || ' vous a notifié'}`;
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      like: '❤️',
      comment: '💬',
      message: '💌',
      follow: '👤',
    };
    return icons[type] || '🔔';
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 hover:bg-slate-100 rounded-full transition"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 max-h-96 overflow-y-auto z-50">
          <div className="p-4 border-b border-slate-200 sticky top-0 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() =>
                    notifications
                      .filter((n) => !n.read)
                      .forEach((n) => markAsRead(n.id))
                  }
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Marquer tout comme lu
                </button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-center text-slate-400">
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition ${
                    !notif.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={notif.actor?.avatar_url || 'https://via.placeholder.com/32'}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">
                        <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                        {' '}
                        <span className="font-bold">{getNotificationMessage(notif)}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="text-slate-400 hover:text-red-500 text-lg"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
