import { apiClient } from './api';

export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
  metadata: Record<string, any>;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

export interface WebSocketMessage {
  type: 'notification' | 'notification_read' | 'ping' | 'pong' | 'authenticated';
  notification?: Notification;
  notification_id?: number;
  status?: string;
}

class NotificationService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private listeners: ((notification: Notification) => void)[] = [];
  private statusListeners: ((connected: boolean) => void)[] = [];

  // Get notifications with pagination
  async getNotifications(limit = 50, offset = 0): Promise<Notification[]> {
    return apiClient.get<Notification[]>(`/notifications?limit=${limit}&offset=${offset}`);
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ unread_count: number }>('/notifications/unread-count');
    return response.unread_count;
  }

  // Mark notifications as read
  async markAsRead(notificationIds: number[]): Promise<void> {
    await apiClient.post('/notifications/mark-read', {
      notification_ids: notificationIds
    });
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    const notifications = await this.getNotifications();
    const unreadIds = notifications
      .filter(n => !n.read_at)
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      await this.markAsRead(unreadIds);
    }
  }

  // WebSocket connection management
  connectWebSocket(userId: number): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_API_BASE_URL?.replace(/^https?:\/\//, '') || 'localhost:8000';
    const wsUrl = `${protocol}//${host}/ws/notifications`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Authenticate with user ID
      this.ws?.send(JSON.stringify({ user_id: userId }));
      
      // Notify status listeners
      this.statusListeners.forEach(listener => listener(true));
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'notification':
            if (message.notification) {
              this.listeners.forEach(listener => listener(message.notification!));
            }
            break;
          case 'authenticated':
            console.log('WebSocket authenticated successfully');
            break;
          case 'ping':
            this.ws?.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.statusListeners.forEach(listener => listener(false));
      this.attemptReconnect(userId);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect(userId: number): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connectWebSocket(userId);
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.ws) {
      // Notify status listeners before closing
      this.statusListeners.forEach(listener => listener(false));
      this.ws.close();
      this.ws = null;
    }
    this.listeners = [];
    this.statusListeners = [];
  }

  // Add notification listener
  onNotification(callback: (notification: Notification) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Add connection status listener
  onStatusChange(callback: (connected: boolean) => void): () => void {
    this.statusListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.statusListeners = this.statusListeners.filter(listener => listener !== callback);
    };
  }

  // Get WebSocket connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Helper method to format notification time
  static formatNotificationTime(createdAt: string): string {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffMs = now.getTime() - notificationTime.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      return `${diffDays}d`;
    }
  }

  // Helper method to get notification icon based on type
  static getNotificationIcon(type: string): string {
    switch (type) {
      case 'task_due_soon':
        return '⏰';
      case 'task_assigned':
        return '📋';
      case 'task_completed':
        return '✅';
      case 'task_overdue':
        return '🚨';
      case 'task_priority_changed':
        return '⚡';
      default:
        return '📢';
    }
  }

  // Helper method to get notification style class based on type
  static getNotificationStyle(type: string): string {
    switch (type) {
      case 'task_due_soon':
        return 'warning';
      case 'task_assigned':
        return 'info';
      case 'task_completed':
        return 'success';
      case 'task_overdue':
        return 'error';
      case 'task_priority_changed':
        return 'info';
      default:
        return 'info';
    }
  }
}

export const notificationService = new NotificationService();
export { NotificationService };
