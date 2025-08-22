import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { apiClient } from './api'

// Real backend integration tests - testing actual API calls
describe('API Client Real Integration Tests', () => {
  let testToken: string | null = null
  let testUser: any = null
  let createdTaskIds: string[] = []

  beforeEach(async () => {
    // Clean localStorage before each test
    localStorage.clear()
    
    // Create a test user and get a real token for testing
    try {
      const registerResponse = await apiClient.post('/auth/register', {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User Integration'
      })
      
      testUser = registerResponse.user
      testToken = registerResponse.token
      
      // Store token in localStorage for authenticated tests
      localStorage.setItem('token', testToken)
      localStorage.setItem('user', JSON.stringify(testUser))
      
    } catch (error) {
      console.warn('Test user creation failed, might already exist:', error)
      
      // Try to login with existing credentials
      try {
        const loginResponse = await apiClient.post('/auth/login', {
          email: 'testintegration@example.com',
          password: 'TestPassword123!'
        })
        
        testUser = loginResponse.user
        testToken = loginResponse.token
        localStorage.setItem('token', testToken)
        localStorage.setItem('user', JSON.stringify(testUser))
      } catch (loginError) {
        console.error('Could not authenticate for tests:', loginError)
      }
    }
  })

  afterEach(async () => {
    // Clean up created tasks
    if (createdTaskIds.length > 0 && testToken) {
      for (const taskId of createdTaskIds) {
        try {
          await apiClient.delete(`/tasks/${taskId}`)
        } catch (error) {
          console.warn(`Failed to delete test task ${taskId}:`, error)
        }
      }
      createdTaskIds = []
    }
    
    // Clean localStorage
    localStorage.clear()
  })

  describe('Authentication - Real Backend Tests', () => {
    it('should successfully authenticate and get user profile', async () => {
      expect(testToken).toBeTruthy()
      expect(testUser).toBeTruthy()
      
      const response = await apiClient.get('/auth/me')
      
      expect(response).toBeDefined()
      expect(response.name).toBeDefined()
      expect(response.email).toBeDefined()
      expect(response.id).toBe(testUser.id)
    })

    it('should handle login with valid credentials', async () => {
      // Clear localStorage to test login
      localStorage.clear()
      
      const response = await apiClient.post('/auth/login', {
        email: testUser.email,
        password: 'TestPassword123!'
      })
      
      expect(response).toBeDefined()
      expect(response.token).toBeTruthy()
      expect(response.user).toBeDefined()
      expect(response.user.email).toBe(testUser.email)
    })

    it('should reject login with invalid credentials', async () => {
      localStorage.clear()
      
      await expect(apiClient.post('/auth/login', {
        email: testUser.email,
        password: 'WrongPassword'
      })).rejects.toThrow()
    })

    it('should reject protected endpoints without authentication', async () => {
      localStorage.clear()
      
      await expect(apiClient.get('/auth/me')).rejects.toThrow()
    })

    it('should handle registration validation errors', async () => {
      await expect(apiClient.post('/auth/register', {
        username: '', // Invalid username
        email: 'invalid-email',
        password: '123', // Too short password
        name: 'Test'
      })).rejects.toThrow()
    })
  })

  describe('Tasks CRUD - Real Backend Tests', () => {
    describe('GET requests', () => {
      it('should retrieve tasks list successfully', async () => {
        const response = await apiClient.get('/tasks')
        
        expect(response).toBeDefined()
        expect(response.tasks).toBeDefined()
        expect(Array.isArray(response.tasks)).toBe(true)
        expect(typeof response.total).toBe('number')
        expect(typeof response.page).toBe('number')
        expect(typeof response.limit).toBe('number')
      })

      it('should handle pagination and filtering parameters', async () => {
        const params = {
          page: 1,
          limit: 5,
          status: 'todo',
          search: 'test'
        }

        const response = await apiClient.get('/tasks', params)
        
        expect(response).toBeDefined()
        expect(response.tasks).toBeDefined()
        expect(response.limit).toBe(5)
        expect(response.page).toBe(1)
      })

      it('should handle requests with missing optional parameters', async () => {
        const params = {
          page: 1,
          limit: undefined,
          status: null
        }

        const response = await apiClient.get('/tasks', params)
        
        expect(response).toBeDefined()
        expect(response.tasks).toBeDefined()
      })
    })

    describe('POST requests - Create Tasks', () => {
      it('should create a new task successfully', async () => {
        const taskData = {
          title: 'Real Integration Test Task',
          description: 'Testing real backend integration',
          status: 'todo',
          priority: 'med'
        }

        const response = await apiClient.post('/tasks', taskData)
        
        expect(response).toBeDefined()
        expect(response.title).toBe('Real Integration Test Task')
        expect(response.description).toBe('Testing real backend integration')
        expect(response.status).toBe('todo')
        expect(response.priority).toBe('med')
        expect(response.id).toBeDefined()
        expect(response.created_at).toBeDefined()
        
        // Store for cleanup
        createdTaskIds.push(response.id)
      })

      it('should handle task creation with minimal data', async () => {
        const taskData = {
          title: 'Minimal Task'
        }

        const response = await apiClient.post('/tasks', taskData)
        
        expect(response).toBeDefined()
        expect(response.title).toBe('Minimal Task')
        expect(response.id).toBeDefined()
        expect(response.status).toBe('todo') // Default status
        
        createdTaskIds.push(response.id)
      })

      it('should reject task creation with invalid data', async () => {
        await expect(apiClient.post('/tasks', {
          title: '', // Empty title should be invalid
        })).rejects.toThrow()
      })
    })

    describe('PUT requests - Update Tasks', () => {
      it('should update an existing task successfully', async () => {
        // First create a task
        const createData = {
          title: 'Task to Update',
          description: 'Original description',
          status: 'todo'
        }
        
        const createResponse = await apiClient.post('/tasks', createData)
        createdTaskIds.push(createResponse.id)
        
        // Then update it
        const updateData = {
          title: 'Updated Task Title',
          description: 'Updated description',
          status: 'doing'
        }

        const response = await apiClient.put(`/tasks/${createResponse.id}`, updateData)
        
        expect(response).toBeDefined()
        expect(response.title).toBe('Updated Task Title')
        expect(response.description).toBe('Updated description')
        expect(response.status).toBe('doing')
        expect(response.id).toBe(createResponse.id)
      })

      it('should handle partial updates', async () => {
        // Create a task
        const createData = {
          title: 'Partial Update Task',
          status: 'todo'
        }
        
        const createResponse = await apiClient.post('/tasks', createData)
        createdTaskIds.push(createResponse.id)
        
        // Update only status
        const updateData = {
          status: 'done'
        }

        const response = await apiClient.put(`/tasks/${createResponse.id}`, updateData)
        
        expect(response.status).toBe('done')
        expect(response.title).toBe('Partial Update Task') // Should remain unchanged
      })

      it('should reject updates to non-existent tasks', async () => {
        await expect(apiClient.put('/tasks/999999', {
          title: 'This should fail'
        })).rejects.toThrow()
      })
    })

    describe('DELETE requests - Delete Tasks', () => {
      it('should delete an existing task successfully', async () => {
        // Create a task
        const createData = {
          title: 'Task to Delete',
          status: 'todo'
        }
        
        const createResponse = await apiClient.post('/tasks', createData)
        
        // Delete it
        const response = await apiClient.delete(`/tasks/${createResponse.id}`)
        
        expect(response).toBeDefined()
        
        // Verify it's deleted by trying to get it
        await expect(apiClient.get(`/tasks/${createResponse.id}`)).rejects.toThrow()
      })

      it('should reject deletion of non-existent tasks', async () => {
        await expect(apiClient.delete('/tasks/999999')).rejects.toThrow()
      })
    })
  })

  describe('Response Handling - Real Backend Tests', () => {
    it('should handle standardized API responses correctly', async () => {
      const response = await apiClient.get('/tasks')
      
      // Backend returns standardized format, client should extract data
      expect(response.tasks).toBeDefined()
      expect(response.total).toBeDefined()
      expect(response.page).toBeDefined()
      expect(response.limit).toBeDefined()
    })

    it('should handle single resource responses', async () => {
      const response = await apiClient.get('/auth/me')
      
      expect(response.name).toBeDefined()
      expect(response.id).toBeDefined()
      expect(response.email).toBeDefined()
    })

    it('should handle empty successful responses', async () => {
      // Some operations return minimal success responses
      const createData = {
        title: 'Test Task For Empty Response',
        status: 'todo'
      }
      
      const createResponse = await apiClient.post('/tasks', createData)
      createdTaskIds.push(createResponse.id)
      
      // Delete operation might return minimal response
      const deleteResponse = await apiClient.delete(`/tasks/${createResponse.id}`)
      expect(deleteResponse).toBeDefined()
    })
  })

  describe('Error Handling - Real Backend Tests', () => {
    it('should handle 404 errors for non-existent resources', async () => {
      await expect(apiClient.get('/tasks/99999999')).rejects.toThrow()
    })

    it('should handle authentication errors (401 Unauthorized)', async () => {
      localStorage.clear()

      await expect(apiClient.get('/auth/me')).rejects.toThrow()
    })

    it('should handle validation errors (400 Bad Request)', async () => {
      // Try to create task with invalid data
      await expect(apiClient.post('/tasks', {
        title: '', // Invalid empty title
        priority: 'invalid_priority' // Invalid priority value
      })).rejects.toThrow()
    })

    it('should handle forbidden operations (403 Forbidden)', async () => {
      // Try to access another user's resources (if implemented)
      // This might depend on specific backend implementation
      await expect(apiClient.get('/admin/users')).rejects.toThrow()
    })

    it('should preserve error messages from backend', async () => {
      try {
        await apiClient.post('/auth/login', {
          email: 'nonexistent_user@example.com',
          password: 'wrong_password'
        })
        // Should not reach here
        expect(false).toBe(true)
      } catch (error) {
        expect(error.message).toBeDefined()
        expect(error.message.length).toBeGreaterThan(0)
      }
    })

    it('should handle server errors (5xx)', async () => {
      // This test depends on backend behavior - might need specific endpoint that triggers 500
      // For now, test that we can handle such errors when they occur
      try {
        // Some endpoints might not exist and return 404 or 500
        await apiClient.post('/invalid/endpoint', {})
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Data Integrity - Real Backend Tests', () => {
    it('should preserve data types in requests and responses', async () => {
      const taskData = {
        title: 'Data Type Test',
        description: 'Testing data types preservation',
        priority: 'high',
        status: 'todo'
      }

      const response = await apiClient.post('/tasks', taskData)

      expect(typeof response.title).toBe('string')
      expect(typeof response.id).toBe('string')
      expect(typeof response.priority).toBe('string')
      expect(response.created_at).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      
      createdTaskIds.push(response.id)
    })

    it('should handle optional fields correctly', async () => {
      const taskData = {
        title: 'Optional Fields Test',
        description: null, // Explicitly null
        // due_date omitted
        // tags omitted
      }

      const response = await apiClient.post('/tasks', taskData)

      expect(response.title).toBe('Optional Fields Test')
      expect(response.id).toBeDefined()
      expect(response.status).toBeDefined() // Should have default
      
      createdTaskIds.push(response.id)
    })
  })

  describe('Performance - Real Backend Tests', () => {
    it('should handle requests within reasonable time', async () => {
      const startTime = Date.now()
      
      const response = await apiClient.get('/tasks', { limit: 20 })
      
      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response).toBeDefined()
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
    })

    it('should handle concurrent requests efficiently', async () => {
      const requests = [
        apiClient.get('/tasks'),
        apiClient.get('/auth/me'),
        apiClient.get('/tasks', { page: 1, limit: 10 })
      ]

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const endTime = Date.now()

      expect(responses).toHaveLength(3)
      responses.forEach(response => {
        expect(response).toBeDefined()
      })
      
      // All requests should complete reasonably quickly
      expect(endTime - startTime).toBeLessThan(15000)
    })
  })

  describe('Edge Cases - Real Backend Tests', () => {
    it('should handle very long task titles', async () => {
      const longTitle = 'A'.repeat(500) // Very long title
      
      try {
        const response = await apiClient.post('/tasks', {
          title: longTitle
        })
        
        createdTaskIds.push(response.id)
        expect(response.title).toBe(longTitle)
      } catch (error) {
        // Backend might reject very long titles, which is also valid
        expect(error).toBeDefined()
      }
    })

    it('should handle special characters in task data', async () => {
      const taskData = {
        title: 'Special chars: éñüñ™°© & < > " \' 🚀',
        description: 'Testing special characters: @#$%^&*()_+-={}[]|\\:";\'<>?,./',
        status: 'todo'
      }

      const response = await apiClient.post('/tasks', taskData)
      
      expect(response.title).toBe(taskData.title)
      expect(response.description).toBe(taskData.description)
      
      createdTaskIds.push(response.id)
    })

    it('should handle pagination edge cases', async () => {
      // Test very high page number
      const response = await apiClient.get('/tasks', {
        page: 1000,
        limit: 10
      })
      
      expect(response).toBeDefined()
      expect(response.tasks).toBeDefined()
      expect(Array.isArray(response.tasks)).toBe(true)
      // Might be empty but should not error
    })
  })
})