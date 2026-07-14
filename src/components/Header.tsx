import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../store/database';
import { Notification } from '../types';
import { Logo } from './Logo';

function NotificationDrawer({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkAllRead 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  notifications: Notification[];
  onMarkAllRead: () => void;
}) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50" 
        onClick={onClose} 
      />
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-[#121212] z-50 shadow-2xl flex flex-col animate-slide-in">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-surface-800">
          <h2 className="text-lg font-bold text-white">Notifications</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 border-b border-surface-800">
            <button 
              onClick={onMarkAllRead}
              className="text-sm font-medium text-[#FFC107] hover:text-[#FFD54F] transition-colors"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface-600 mb-3">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p className="text-surface-400 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-800">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`px-4 py-3 ${!notification.is_read ? 'bg-[#FFC107]/5 border-l-2 border-l-[#FFC107]' : ''}`}
                >
                  <p className={`text-sm ${!notification.is_read ? 'text-white font-medium' : 'text-surface-400'}`}>
                    {notification.message}
                  </p>
                  <p className="text-[10px] text-surface-500 mt-1">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Header() {
  const { currentUser, logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [, setTick] = useState(0);

  const userId = currentUser?.id ?? '';
  const notifications = db.getNotificationsByUserId(userId);
  const unreadCount = db.getUnreadNotificationCount(userId);

  const handleMarkAllRead = () => {
    db.markNotificationsAsRead(userId);
    setTick(t => t + 1);
  };

  const handleOpenDrawer = () => {
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-900/95 backdrop-blur-xl border-b border-surface-800">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-white">{currentUser?.full_name}</p>
              <p className="text-[10px] text-surface-400 capitalize">{currentUser?.role === 'business' ? 'Employer' : 'Worker'}</p>
            </div>
            {/* Bell Icon */}
            <button
              onClick={handleOpenDrawer}
              className="relative w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 hover:bg-surface-700 hover:text-[#FFC107] transition-colors"
              title="Notifications"
              data-testid="notification-bell"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#FFC107] text-[#121212] text-[10px] font-bold flex items-center justify-center px-1"
                  data-testid="notification-badge"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {/* Logout */}
            <button
              onClick={logout}
              className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 hover:bg-surface-700 hover:text-white transition-colors"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
      <NotificationDrawer 
        isOpen={drawerOpen} 
        onClose={handleCloseDrawer} 
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
      />
    </>
  );
}
