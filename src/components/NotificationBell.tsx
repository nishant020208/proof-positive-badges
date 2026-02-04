import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Award, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { subscribeToNotifications, markNotificationRead, Notification } from '@/lib/firestore';
import { collection, query, where, orderBy, limit, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

const TYPE_ICONS = {
  info: Bell,
  success: CheckCircle,
  warning: Bell,
  badge: Award,
  score: TrendingUp,
};

const TYPE_COLORS = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-amber-500',
  badge: 'text-purple-500',
  score: 'text-primary',
};

export function NotificationBell() {
  const { user } = useFirebaseAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Subscribe to realtime notifications
    const unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter((n) => !n.isRead).length);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const promises = notifications
      .filter((n) => !n.isRead)
      .map((n) => markNotificationRead(n.id));
    
    await Promise.all(promises);
    
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
    setUnreadCount(0);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 max-h-[400px] overflow-hidden"
      >
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = TYPE_ICONS[notification.type as keyof typeof TYPE_ICONS] || Bell;
              const colorClass = TYPE_COLORS[notification.type as keyof typeof TYPE_COLORS] || 'text-muted-foreground';

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 p-3 border-b border-border/50 transition-colors cursor-pointer hover:bg-accent/50',
                    !notification.isRead && 'bg-primary/5'
                  )}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className={cn('mt-0.5', colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium',
                      !notification.isRead && 'text-foreground'
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
