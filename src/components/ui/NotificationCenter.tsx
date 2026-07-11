'use client';

import { useState, useMemo } from 'react';
import { Bell, Check, X, Clock, UserCheck, UserX, FileCheck, FileX, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  booking_approved: UserCheck,
  booking_rejected: UserX,
  booking_cancelled: Clock,
  booking_completed: Check,
  coach_approved: FileCheck,
  coach_rejected: FileX,
  system: Info,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  booking_approved: 'bg-success/20 text-status-success',
  booking_rejected: 'bg-danger/20 text-danger',
  booking_cancelled: 'bg-warning/20 text-status-warning',
  booking_completed: 'bg-success/20 text-status-success',
  coach_approved: 'bg-success/20 text-status-success',
  coach_rejected: 'bg-danger/20 text-danger',
  system: 'bg-info/20 text-status-info',
};

export default function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const { notifications, currentUser, markNotificationRead, markAllNotificationsRead, deleteNotification } = useApp();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    const filtered = notifications.filter((n) => n.userId === currentUser.id);
    return filter === 'unread' ? filtered.filter((n) => !n.read) : filtered;
  }, [notifications, currentUser, filter]);

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  const handleNotificationClick = (id: string) => {
    markNotificationRead(id);
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-4 top-20 w-96 bg-surface rounded-xl shadow-xl border border-border-light animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border-light">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            <span className="font-semibold text-text-primary">消息通知</span>
            <span className="badge bg-primary text-white">
              {notifications.filter((n) => n.userId === currentUser?.id && !n.read).length}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-bg-warm rounded">
            <X size={16} className="text-text-secondary" />
          </button>
        </div>

        <div className="flex border-b border-border-light">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              filter === 'all' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              filter === 'unread' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            未读
          </button>
        </div>

        <div className="p-3 flex justify-end">
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-primary hover:underline"
          >
            标记全部已读
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {userNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-bg-warm flex items-center justify-center mx-auto mb-3">
                <Bell size={20} className="text-text-tertiary" />
              </div>
              <p className="text-sm text-text-secondary">{filter === 'unread' ? '暂无未读通知' : '暂无通知'}</p>
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {userNotifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                const colorClass = NOTIFICATION_COLORS[notification.type] || 'bg-primary-50 text-primary';
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      notification.read ? 'hover:bg-bg-warm' : 'bg-primary-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${notification.read ? 'text-text-secondary' : 'text-text-primary'}`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                            className="p-1 hover:bg-bg-warm rounded shrink-0"
                          >
                            <X size={12} className="text-text-tertiary" />
                          </button>
                        </div>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{notification.content}</p>
                        <p className="text-xs text-text-tertiary mt-2">
                          {new Date(notification.createdAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}