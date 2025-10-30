import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export const useNotifications = () => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();

  // Show toast notifications for new unread notifications
  useEffect(() => {
    const unreadNotifications = state.notifications.filter(n => !n.read);
    const latestNotification = unreadNotifications[unreadNotifications.length - 1];

    if (latestNotification) {
      toast({
        title: latestNotification.title,
        description: latestNotification.message,
        variant: latestNotification.type === 'error' ? 'destructive' : 'default',
      });
    }
  }, [state.notifications, toast]);

  const markAsRead = (notificationId: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
  };

  const addNotification = (notification: Omit<import('@/context/AppContext').Notification, 'id' | 'timestamp' | 'read'>) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      }
    });
  };

  return {
    notifications: state.notifications,
    unreadCount: state.notifications.filter(n => !n.read).length,
    markAsRead,
    addNotification,
  };
};