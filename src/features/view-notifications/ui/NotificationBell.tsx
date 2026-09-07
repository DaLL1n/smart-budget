import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  Info 
} from 'lucide-react';
import { User } from '../../../entities/user';
import { 
  AppNotification, 
  fetchUserNotifications 
} from '../../../entities/notification';

interface NotificationBellProps {
  currentUser: User;
  onFamilyUpdated?: () => void;
}

const READ_NOTIFS_KEY = 'smart_budget_read_notifs';

function getReadNotificationIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_NOTIFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistReadNotificationIds(ids: string[]) {
  try {
    const existing = getReadNotificationIds();
    const merged = Array.from(new Set([...existing, ...ids]));
    localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(merged));
  } catch {}
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  currentUser,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const list = await fetchUserNotifications(currentUser);
      const readIds = getReadNotificationIds();
      const withReadStatus = list.map(n => ({
        ...n,
        isRead: n.isRead || readIds.includes(n.id),
      }));
      setNotifications(withReadStatus);
    } catch (e) {
      console.warn('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === READ_NOTIFS_KEY) {
        loadNotifications();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', loadNotifications);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('smart_budget_sync');
      bc.onmessage = () => {
        loadNotifications();
      };
    } catch {}

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', loadNotifications);
      if (bc) bc.close();
    };
  }, [currentUser.email, currentUser.id]);

  const handleToggleOpen = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);

    if (willOpen) {
      loadNotifications();
    }

    if (willOpen && notifications.length > 0) {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      if (unreadIds.length > 0) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        persistReadNotificationIds(unreadIds);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id="btn-notification-bell"
        onClick={handleToggleOpen}
        className="relative p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
        title="Центр уведомлений"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-[10px] flex items-center justify-center shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          id="notification-popover"
          className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 w-auto rounded-2xl bg-slate-900/95 border border-slate-800/90 shadow-2xl shadow-black/80 backdrop-blur-2xl z-50 overflow-hidden flex flex-col max-h-[calc(100vh-5rem)] sm:max-h-[480px]"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">Центр уведомлений</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {unreadCount} новых
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List */}
          <div className="p-2.5 overflow-y-auto custom-scrollbar space-y-2 flex-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Новых уведомлений нет
              </div>
            ) : (
              notifications.map((n) => {
                return (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border transition-all ${
                      n.type === 'budget_alert'
                        ? 'bg-amber-950/20 border-amber-900/40'
                        : 'bg-slate-950/40 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                        n.type === 'budget_alert'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-teal-500/10 text-teal-400'
                      }`}>
                        {n.type === 'budget_alert' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-100">{n.title}</div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
