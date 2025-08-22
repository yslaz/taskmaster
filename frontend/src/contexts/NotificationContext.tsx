import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService, type Notification } from '../services/notifications';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  loading: boolean;
  markAsRead: (notificationIds: number[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [notificationsData, count] = await Promise.all([
        notificationService.getNotifications(50, 0),
        notificationService.getUnreadCount()
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: number[]) => {
    try {
      await notificationService.markAsRead(notificationIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      // Update unread count
      const readCount = notifications.filter(n => 
        notificationIds.includes(n.id) && !n.read_at
      ).length;
      setUnreadCount(prev => Math.max(0, prev - readCount));
      
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }, [notifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          read_at: notification.read_at || new Date().toISOString()
        }))
      );
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  // Add new notification (from WebSocket)
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    if (!notification.read_at) {
      setUnreadCount(prev => prev + 1);
    }

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: `notification-${notification.id}`,
      });
    }
  }, []);

  // Setup WebSocket connection and listeners
  useEffect(() => {
    if (!user) {
      notificationService.disconnect();
      setIsConnected(false);
      return;
    }

    // Connect WebSocket
    notificationService.connectWebSocket(parseInt(user.id));

    // Setup listeners
    const unsubscribeNotification = notificationService.onNotification(addNotification);
    const unsubscribeStatus = notificationService.onStatusChange(setIsConnected);

    // Load initial data
    loadNotifications();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup on unmount
    return () => {
      unsubscribeNotification();
      unsubscribeStatus();
    };
  }, [user, addNotification, loadNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      notificationService.disconnect();
    };
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
