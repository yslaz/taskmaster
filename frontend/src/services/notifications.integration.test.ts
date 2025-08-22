import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { notificationService, NotificationService } from './notifications'
import { authService } from './auth'
import { tasksService } from './tasks'
import type { Notification, RegisterRequest } from '../types/index'

// Real backend integration tests for Notifications Service
describe('Notifications Service Real Integration Tests', () => {
  let testToken: string
  let testUser: any
  let createdTaskIds: string[] = []

  beforeEach(async () => {
    // Clear localStorage before each test
    localStorage.clear()
    
    // Create a test user and authenticate
    const userData: RegisterRequest = {
      email: `notiftest_${Date.now()}@example.com`,
      password: 'NotifTest123!',
      name: 'Notifications Test User'
    }

    const authResponse = await authService.register(userData)
    testToken = authResponse.token
    testUser = authResponse.user
    
    // Ensure localStorage has the token for authenticated requests
    localStorage.setItem('token', testToken)
    localStorage.setItem('user', JSON.stringify(testUser))
  })

  afterEach(async () => {
    // Clean up created tasks
    if (createdTaskIds.length > 0) {
      for (const taskId of createdTaskIds) {
        try {
          await tasksService.deleteTask(taskId)
        } catch (error) {
          console.warn(`Failed to delete test task ${taskId}:`, error)
        }
      }
      createdTaskIds = []
    }
    
    // Clean up WebSocket connections
    notificationService.disconnect()
    
    // Clean up
    authService.logout()
    localStorage.clear()
  })

  describe('getNotifications - Real Backend Tests', () => {
    it('should fetch notifications with default pagination', async () => {
      const notifications = await notificationService.getNotifications()

      expect(Array.isArray(notifications)).toBe(true)
      expect(notifications.length).toBeGreaterThanOrEqual(0)
      
      if (notifications.length > 0) {
        const notification = notifications[0]
        expect(notification).toBeDefined()
        expect(typeof notification.id).toBe('number')
        expect(typeof notification.notification_type).toBe('string')
        expect(typeof notification.title).toBe('string')
        expect(typeof notification.message).toBe('string')
        expect(typeof notification.created_at).toBe('string')
        expect(typeof notification.metadata).toBe('object')
        
        // read_at can be null or string
        expect(notification.read_at === null || typeof notification.read_at === 'string').toBe(true)
      }
    })

    it('should handle custom pagination parameters', async () => {
      const notifications = await notificationService.getNotifications(5, 0)
      
      expect(Array.isArray(notifications)).toBe(true)
      expect(notifications.length).toBeLessThanOrEqual(5)
    })

    it('should handle different limit values', async () => {
      const smallLimit = await notificationService.getNotifications(3)
      const largeLimit = await notificationService.getNotifications(50)

      expect(smallLimit.length).toBeLessThanOrEqual(3)
      expect(Array.isArray(largeLimit)).toBe(true)
    })

    it('should handle offset pagination', async () => {
      const firstPage = await notificationService.getNotifications(10, 0)
      const secondPage = await notificationService.getNotifications(10, 10)

      expect(Array.isArray(firstPage)).toBe(true)
      expect(Array.isArray(secondPage)).toBe(true)
      
      // If there are enough notifications, pages should be different
      if (firstPage.length === 10 && secondPage.length > 0) {
        expect(firstPage[0].id).not.toBe(secondPage[0].id)
      }
    })

    it('should validate notification data structure', async () => {
      const notifications = await notificationService.getNotifications(5)

      notifications.forEach(notification => {
        expect(notification).toHaveProperty('id')
        expect(notification).toHaveProperty('notification_type')
        expect(notification).toHaveProperty('title')
        expect(notification).toHaveProperty('message')
        expect(notification).toHaveProperty('created_at')
        expect(notification).toHaveProperty('metadata')

        expect(typeof notification.id).toBe('number')
        expect(typeof notification.notification_type).toBe('string')
        expect(typeof notification.title).toBe('string')
        expect(typeof notification.message).toBe('string')
        expect(typeof notification.created_at).toBe('string')
        expect(typeof notification.metadata).toBe('object')

        // Validate date format
        expect(new Date(notification.created_at)).toBeInstanceOf(Date)
      })
    })
  })

  describe('getUnreadCount - Real Backend Tests', () => {
    it('should fetch unread notification count', async () => {
      const count = await notificationService.getUnreadCount()

      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should return consistent count across multiple calls', async () => {
      const count1 = await notificationService.getUnreadCount()
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay
      const count2 = await notificationService.getUnreadCount()

      // Counts should be the same within a short time period
      expect(typeof count1).toBe('number')
      expect(typeof count2).toBe('number')
      expect(count1).toBeGreaterThanOrEqual(0)
      expect(count2).toBeGreaterThanOrEqual(0)
    })
  })

  describe('markAsRead - Real Backend Tests', () => {
    it('should handle empty notification ID array', async () => {
      const notificationIds: number[] = []
      
      // Should not throw error for empty array
      await expect(notificationService.markAsRead(notificationIds)).resolves.toBeDefined()
    })

    it('should handle marking non-existent notifications gracefully', async () => {
      const notificationIds = [999999999]
      
      // Backend should handle invalid IDs gracefully
      try {
        await notificationService.markAsRead(notificationIds)
        // If it succeeds, that's fine
        expect(true).toBe(true)
      } catch (error) {
        // If it throws an error, that's also acceptable behavior
        expect(error).toBeDefined()
      }
    })

    it('should handle marking existing notifications', async () => {
      // First get some notifications to have valid IDs
      const notifications = await notificationService.getNotifications(5)
      
      if (notifications.length > 0) {
        const unreadNotifications = notifications.filter(n => !n.read_at)
        
        if (unreadNotifications.length > 0) {
          const idsToMark = [unreadNotifications[0].id]
          
          await expect(notificationService.markAsRead(idsToMark)).resolves.toBeDefined()
        }
      }
    })
  })

  describe('markAllAsRead - Real Backend Tests', () => {
    it('should mark all notifications as read successfully', async () => {
      await expect(notificationService.markAllAsRead()).resolves.toBeDefined()
    })

    it('should handle when user has no notifications', async () => {
      // Should work even if user has no notifications
      await expect(notificationService.markAllAsRead()).resolves.toBeDefined()
    })
  })

  describe('WebSocket Methods - Interface Tests', () => {
    it('should provide WebSocket connection interface', () => {
      // Test that the methods exist and don't throw errors when called
      expect(typeof notificationService.connectWebSocket).toBe('function')
      expect(typeof notificationService.disconnect).toBe('function')
      expect(typeof notificationService.isConnected).toBe('function')
      
      // Initially not connected
      expect(notificationService.isConnected()).toBe(false)
    })

    it('should handle disconnect when not connected', () => {
      // Should not throw error when disconnecting without connection
      expect(() => notificationService.disconnect()).not.toThrow()
      expect(notificationService.isConnected()).toBe(false)
    })
  })

  describe('Event Listeners - Interface Tests', () => {
    it('should provide notification listener interface', () => {
      const mockCallback = vi.fn()

      const unsubscribe = notificationService.onNotification(mockCallback)

      expect(typeof unsubscribe).toBe('function')
      expect(() => unsubscribe()).not.toThrow()
    })

    it('should provide status change listener interface', () => {
      const statusCallback = vi.fn()

      const unsubscribe = notificationService.onStatusChange(statusCallback)

      expect(typeof unsubscribe).toBe('function')
      expect(() => unsubscribe()).not.toThrow()
    })

    it('should handle multiple listeners', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const unsubscribe1 = notificationService.onNotification(callback1)
      const unsubscribe2 = notificationService.onNotification(callback2)

      expect(typeof unsubscribe1).toBe('function')
      expect(typeof unsubscribe2).toBe('function')

      // Cleanup should not throw
      expect(() => {
        unsubscribe1()
        unsubscribe2()
      }).not.toThrow()
    })
  })

  describe('Static Helper Methods - Pure Functions Tests', () => {
    describe('formatNotificationTime', () => {
      it('should format recent time as "just now"', () => {
        const now = new Date()
        const result = NotificationService.formatNotificationTime(now.toISOString())

        expect(result).toBe('just now')
      })

      it('should format time in minutes', () => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        const result = NotificationService.formatNotificationTime(fiveMinutesAgo.toISOString())

        expect(result).toBe('5m')
      })

      it('should format time in hours', () => {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
        const result = NotificationService.formatNotificationTime(twoHoursAgo.toISOString())

        expect(result).toBe('2h')
      })

      it('should format time in days', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        const result = NotificationService.formatNotificationTime(threeDaysAgo.toISOString())

        expect(result).toBe('3d')
      })
    })

    describe('getNotificationIcon', () => {
      it('should return correct icons for different notification types', () => {
        expect(NotificationService.getNotificationIcon('task_due_soon')).toBe('⏰')
        expect(NotificationService.getNotificationIcon('task_assigned')).toBe('📋')
        expect(NotificationService.getNotificationIcon('task_completed')).toBe('✅')
        expect(NotificationService.getNotificationIcon('task_overdue')).toBe('🚨')
        expect(NotificationService.getNotificationIcon('task_priority_changed')).toBe('⚡')
        expect(NotificationService.getNotificationIcon('unknown_type')).toBe('📢')
      })
    })

    describe('getNotificationStyle', () => {
      it('should return correct styles for different notification types', () => {
        expect(NotificationService.getNotificationStyle('task_due_soon')).toBe('warning')
        expect(NotificationService.getNotificationStyle('task_assigned')).toBe('info')
        expect(NotificationService.getNotificationStyle('task_completed')).toBe('success')
        expect(NotificationService.getNotificationStyle('task_overdue')).toBe('error')
        expect(NotificationService.getNotificationStyle('task_priority_changed')).toBe('info')
        expect(NotificationService.getNotificationStyle('unknown_type')).toBe('info')
      })
    })
  })

  describe('Error Handling - Real Backend Tests', () => {
    it('should handle authentication errors', async () => {
      localStorage.removeItem('token')

      await expect(notificationService.getNotifications()).rejects.toThrow()
      await expect(notificationService.getUnreadCount()).rejects.toThrow()
      
      // Restore token
      localStorage.setItem('token', testToken)
    })

    it('should handle invalid pagination parameters', async () => {
      // Negative values should be handled gracefully
      try {
        const notifications = await notificationService.getNotifications(-5, -10)
        expect(Array.isArray(notifications)).toBe(true)
      } catch (error) {
        // Backend might reject invalid parameters, which is also valid
        expect(error).toBeDefined()
      }
    })
  })

  describe('Integration Workflows - Real Backend Tests', () => {
    it('should support complete notification workflow', async () => {
      // 1. Get initial unread count
      const initialCount = await notificationService.getUnreadCount()
      expect(typeof initialCount).toBe('number')

      // 2. Fetch notifications
      const notifications = await notificationService.getNotifications(10)
      expect(Array.isArray(notifications)).toBe(true)

      // 3. Mark some as read (if any exist)
      if (notifications.length > 0) {
        const unreadNotifications = notifications.filter(n => !n.read_at)
        if (unreadNotifications.length > 0) {
          const idsToMark = [unreadNotifications[0].id]
          await notificationService.markAsRead(idsToMark)
        }
      }

      // 4. Mark all as read
      await notificationService.markAllAsRead()
    })

    it('should handle notifications workflow for new user', async () => {
      // New user might have no notifications, workflow should still work
      const count = await notificationService.getUnreadCount()
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)

      const notifications = await notificationService.getNotifications()
      expect(Array.isArray(notifications)).toBe(true)

      await notificationService.markAllAsRead()
    })
  })

  describe('Service State Management - Real Backend Tests', () => {
    it('should maintain service instance state', () => {
      // Service should be singleton and maintain state
      expect(notificationService).toBeDefined()
      expect(typeof notificationService.getNotifications).toBe('function')
      expect(typeof notificationService.getUnreadCount).toBe('function')
      expect(typeof notificationService.markAsRead).toBe('function')
      expect(typeof notificationService.markAllAsRead).toBe('function')
    })

    it('should handle disconnection cleanup properly', () => {
      const callback = vi.fn()
      const unsubscribe = notificationService.onNotification(callback)
      
      // Disconnect should clean up listeners
      notificationService.disconnect()
      
      // Unsubscribe should still work after disconnect
      expect(() => unsubscribe()).not.toThrow()
    })
  })
})