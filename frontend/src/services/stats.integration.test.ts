import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import statsService from './stats'
import { authService } from './auth'
import { tasksService } from './tasks'
import type { StatsQuery, TaskStats, RegisterRequest, CreateTaskRequest } from '../types/index'

// Real backend integration tests for Stats Service
describe('Stats Service Real Integration Tests', () => {
  let testToken: string
  let testUser: any
  let createdTaskIds: string[] = []

  beforeEach(async () => {
    // Clear localStorage before each test
    localStorage.clear()
    
    // Create a test user and authenticate
    const userData: RegisterRequest = {
      email: `statstest_${Date.now()}@example.com`,
      password: 'StatsTest123!',
      name: 'Stats Test User'
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
    
    // Clean up
    authService.logout()
    localStorage.clear()
  })

  describe('getGeneralStats - Real Backend Tests', () => {
    it('should fetch general statistics successfully', async () => {
      // Create some test tasks to have data for statistics
      const task1 = await tasksService.createTask({
        title: 'Stats Test Task 1',
        status: 'todo',
        priority: 'high'
      })
      const task2 = await tasksService.createTask({
        title: 'Stats Test Task 2',
        status: 'done',
        priority: 'med'
      })
      
      createdTaskIds.push(task1.id, task2.id)

      const stats = await statsService.getGeneralStats()

      expect(stats).toBeDefined()
      expect(typeof stats.total_tasks).toBe('number')
      expect(stats.total_tasks).toBeGreaterThanOrEqual(2) // At least our test tasks
      
      expect(stats.tasks_by_status).toBeDefined()
      expect(typeof stats.tasks_by_status).toBe('object')
      
      expect(stats.tasks_by_priority).toBeDefined()
      expect(typeof stats.tasks_by_priority).toBe('object')
      
      expect(typeof stats.completion_rate).toBe('number')
      expect(stats.completion_rate).toBeGreaterThanOrEqual(0)
      expect(stats.completion_rate).toBeLessThanOrEqual(1)
      
      expect(stats.period_summary).toBeDefined()
      expect(typeof stats.period_summary.period).toBe('string')
      expect(typeof stats.period_summary.tasks_created).toBe('number')
      expect(typeof stats.period_summary.tasks_completed).toBe('number')
      
      expect(stats.time_series).toBeDefined()
      expect(Array.isArray(stats.time_series.labels)).toBe(true)
      expect(Array.isArray(stats.time_series.created)).toBe(true)
      expect(Array.isArray(stats.time_series.completed)).toBe(true)
      expect(Array.isArray(stats.time_series.updated)).toBe(true)
    })

    it('should handle empty user scenario', async () => {
      // For a new user, stats should still work but with zero values
      const stats = await statsService.getGeneralStats()

      expect(stats).toBeDefined()
      expect(stats.total_tasks).toBeGreaterThanOrEqual(0)
      expect(stats.completion_rate).toBeGreaterThanOrEqual(0)
      expect(stats.completion_rate).toBeLessThanOrEqual(1)
    })

    it('should validate data structure correctness', async () => {
      const stats = await statsService.getGeneralStats()

      // Verify time series data consistency
      expect(stats.time_series.labels.length).toBe(stats.time_series.created.length)
      expect(stats.time_series.labels.length).toBe(stats.time_series.completed.length)
      expect(stats.time_series.labels.length).toBe(stats.time_series.updated.length)
      
      // All counts should be non-negative
      expect(stats.total_tasks).toBeGreaterThanOrEqual(0)
      Object.values(stats.tasks_by_status).forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0)
      })
      Object.values(stats.tasks_by_priority).forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('getAnalyticsStats - Real Backend Tests', () => {
    it('should fetch analytics with default parameters', async () => {
      const params: StatsQuery = {}
      const stats = await statsService.getAnalyticsStats(params)

      expect(stats).toBeDefined()
      expect(stats.period_summary).toBeDefined()
      expect(typeof stats.period_summary.period).toBe('string')
    })

    it('should fetch analytics for specific periods', async () => {
      const periods: Array<'day' | 'week' | 'month' | 'year'> = ['day', 'week', 'month', 'year']

      for (const period of periods) {
        const params: StatsQuery = { period }
        const stats = await statsService.getAnalyticsStats(params)

        expect(stats).toBeDefined()
        expect(stats.period_summary.period).toBe(period)
        expect(stats.total_tasks).toBeGreaterThanOrEqual(0)
      }
    })

    it('should handle date range parameters', async () => {
      const params: StatsQuery = {
        from_date: '2025-01-01',
        to_date: '2025-12-31'
      }
      
      const stats = await statsService.getAnalyticsStats(params)

      expect(stats).toBeDefined()
      expect(stats.period_summary).toBeDefined()
    })

    it('should handle complex query parameters', async () => {
      const params: StatsQuery = {
        period: 'month',
        from_date: '2025-01-01',
        to_date: '2025-03-31'
      }

      const stats = await statsService.getAnalyticsStats(params)

      expect(stats).toBeDefined()
      expect(stats.period_summary.period).toBe('month')
    })
  })

  describe('Data Consistency - Real Backend Tests', () => {
    it('should return consistent data structure across calls', async () => {
      const stats1 = await statsService.getGeneralStats()
      const stats2 = await statsService.getGeneralStats()

      // Structure should be identical
      expect(Object.keys(stats1)).toEqual(Object.keys(stats2))
      expect(Object.keys(stats1.tasks_by_status)).toEqual(Object.keys(stats2.tasks_by_status))
      expect(Object.keys(stats1.tasks_by_priority)).toEqual(Object.keys(stats2.tasks_by_priority))
    })

    it('should maintain data integrity between general and analytics stats', async () => {
      const generalStats = await statsService.getGeneralStats()
      const analyticsStats = await statsService.getAnalyticsStats({ period: 'week' })

      // Both should have the same data structure
      expect(typeof generalStats.total_tasks).toBe('number')
      expect(typeof analyticsStats.total_tasks).toBe('number')
      expect(typeof generalStats.completion_rate).toBe('number')
      expect(typeof analyticsStats.completion_rate).toBe('number')
    })
  })

  describe('Time Series Data - Real Backend Tests', () => {
    it('should provide valid time series data structure', async () => {
      const stats = await statsService.getGeneralStats()
      const { time_series } = stats

      // Verify arrays are same length
      expect(time_series.labels.length).toBe(time_series.created.length)
      expect(time_series.labels.length).toBe(time_series.completed.length)
      expect(time_series.labels.length).toBe(time_series.updated.length)

      // Verify data types
      time_series.labels.forEach(label => expect(typeof label).toBe('string'))
      time_series.created.forEach(count => expect(typeof count).toBe('number'))
      time_series.completed.forEach(count => expect(typeof count).toBe('number'))
      time_series.updated.forEach(count => expect(typeof count).toBe('number'))

      // Verify non-negative values
      time_series.created.forEach(count => expect(count).toBeGreaterThanOrEqual(0))
      time_series.completed.forEach(count => expect(count).toBeGreaterThanOrEqual(0))
      time_series.updated.forEach(count => expect(count).toBeGreaterThanOrEqual(0))
    })
  })

  describe('Statistical Calculations - Real Backend Tests', () => {
    it('should provide meaningful completion statistics', async () => {
      // Create some tasks with different statuses
      const todoTask = await tasksService.createTask({
        title: 'Completion Test TODO',
        status: 'todo'
      })
      const doneTask = await tasksService.createTask({
        title: 'Completion Test DONE',
        status: 'done'
      })
      
      createdTaskIds.push(todoTask.id, doneTask.id)

      const stats = await statsService.getGeneralStats()

      expect(stats.completion_rate).toBeGreaterThanOrEqual(0)
      expect(stats.completion_rate).toBeLessThanOrEqual(1)
      
      // Should have at least our test tasks in the counts
      expect(stats.total_tasks).toBeGreaterThanOrEqual(2)
      expect(stats.tasks_by_status.todo).toBeGreaterThanOrEqual(1)
      expect(stats.tasks_by_status.done).toBeGreaterThanOrEqual(1)
    })

    it('should provide due date statistics', async () => {
      const stats = await statsService.getGeneralStats()

      expect(typeof stats.overdue_tasks).toBe('number')
      expect(typeof stats.due_today).toBe('number')
      expect(typeof stats.due_this_week).toBe('number')
      
      expect(stats.overdue_tasks).toBeGreaterThanOrEqual(0)
      expect(stats.due_today).toBeGreaterThanOrEqual(0)
      expect(stats.due_this_week).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error Handling - Real Backend Tests', () => {
    it('should handle authentication errors', async () => {
      localStorage.removeItem('token')

      await expect(statsService.getGeneralStats()).rejects.toThrow()
      
      // Restore token
      localStorage.setItem('token', testToken)
    })

    it('should handle invalid date parameters', async () => {
      const params: StatsQuery = {
        from_date: 'invalid-date-format',
        to_date: 'also-invalid'
      }

      // Backend should handle invalid dates gracefully or reject them
      try {
        const result = await statsService.getAnalyticsStats(params)
        expect(result).toBeDefined()
      } catch (error) {
        // If backend rejects invalid dates, that's also acceptable
        expect(error).toBeDefined()
      }
    })
  })

  describe('Performance - Real Backend Tests', () => {
    it('should handle concurrent requests correctly', async () => {
      const requests = [
        statsService.getGeneralStats(),
        statsService.getAnalyticsStats({ period: 'week' }),
        statsService.getAnalyticsStats({ period: 'month' })
      ]

      const startTime = Date.now()
      const results = await Promise.all(requests)
      const endTime = Date.now()

      expect(results).toHaveLength(3)
      results.forEach(stats => {
        expect(stats).toBeDefined()
        expect(stats.total_tasks).toBeGreaterThanOrEqual(0)
      })
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(15000) // 15 seconds
    })

    it('should handle multiple successive calls efficiently', async () => {
      const calls = []
      for (let i = 0; i < 3; i++) {
        calls.push(statsService.getGeneralStats())
      }

      const startTime = Date.now()
      const results = await Promise.all(calls)
      const endTime = Date.now()
      
      expect(results).toHaveLength(3)
      expect(endTime - startTime).toBeLessThan(10000) // 10 seconds
      
      // All results should have the same structure
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(typeof result.total_tasks).toBe('number')
      })
    })
  })

  describe('Real-world Usage Scenarios - Real Backend Tests', () => {
    it('should support dashboard analytics workflow', async () => {
      // 1. Get general overview
      const overview = await statsService.getGeneralStats()
      expect(overview.total_tasks).toBeGreaterThanOrEqual(0)
      expect(overview.period_summary).toBeDefined()

      // 2. Get weekly analytics
      const weeklyAnalytics = await statsService.getAnalyticsStats({ period: 'week' })
      expect(weeklyAnalytics.time_series.labels).toBeDefined()
      expect(weeklyAnalytics.period_summary.period).toBe('week')

      // 3. Get monthly analytics for comparison
      const monthlyAnalytics = await statsService.getAnalyticsStats({ period: 'month' })
      expect(monthlyAnalytics.period_summary.period).toBe('month')
    })

    it('should support user-specific statistics', async () => {
      // Create tasks for this specific user
      const userTask1 = await tasksService.createTask({
        title: 'User Specific Stats Test 1',
        status: 'todo',
        priority: 'high'
      })
      const userTask2 = await tasksService.createTask({
        title: 'User Specific Stats Test 2',
        status: 'done',
        priority: 'med'
      })
      
      createdTaskIds.push(userTask1.id, userTask2.id)

      const stats = await statsService.getGeneralStats()

      // Stats should reflect this user's tasks
      expect(stats.total_tasks).toBeGreaterThanOrEqual(2)
      expect(stats.tasks_by_priority.high).toBeGreaterThanOrEqual(1)
      expect(stats.tasks_by_priority.med).toBeGreaterThanOrEqual(1)
      expect(stats.tasks_by_status.todo).toBeGreaterThanOrEqual(1)
      expect(stats.tasks_by_status.done).toBeGreaterThanOrEqual(1)
    })
  })
})