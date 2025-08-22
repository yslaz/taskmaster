import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { tasksService } from './tasks'
import { authService } from './auth'
import type { CreateTaskRequest, UpdateTaskRequest, TaskFilters, RegisterRequest } from '../types/index'

// Real backend integration tests for Tasks Service
describe('Tasks Service Real Integration Tests', () => {
  let testToken: string
  let testUser: any
  let createdTaskIds: string[] = []

  beforeEach(async () => {
    // Clear localStorage before each test
    localStorage.clear()
    
    // Create a test user and authenticate
    const userData: RegisterRequest = {
      email: `taskstest_${Date.now()}@example.com`,
      password: 'TasksTest123!',
      name: 'Tasks Test User'
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

  describe('getTasks - Real Backend Tests', () => {
    it('should fetch tasks successfully', async () => {
      const response = await tasksService.getTasks()
      
      expect(response).toBeDefined()
      expect(response.tasks).toBeDefined()
      expect(Array.isArray(response.tasks)).toBe(true)
      expect(typeof response.total).toBe('number')
      expect(typeof response.page).toBe('number')
      expect(typeof response.limit).toBe('number')
    })

    it('should handle pagination correctly', async () => {
      // First create some tasks to test pagination
      const task1 = await tasksService.createTask({
        title: 'Pagination Test Task 1',
        status: 'todo'
      })
      const task2 = await tasksService.createTask({
        title: 'Pagination Test Task 2', 
        status: 'todo'
      })
      
      createdTaskIds.push(task1.id, task2.id)

      const filters: TaskFilters = { page: 1, limit: 1 }
      const response = await tasksService.getTasks(filters)
      
      expect(response.tasks).toHaveLength(1)
      expect(response.limit).toBe(1)
      expect(response.page).toBe(1)
      expect(response.total).toBeGreaterThanOrEqual(2)
    })

    it('should filter tasks by status', async () => {
      // Create tasks with different statuses
      const todoTask = await tasksService.createTask({
        title: 'TODO Status Test',
        status: 'todo'
      })
      const doingTask = await tasksService.createTask({
        title: 'DOING Status Test',
        status: 'doing'
      })
      
      createdTaskIds.push(todoTask.id, doingTask.id)

      const filters: TaskFilters = { status: 'todo' }
      const response = await tasksService.getTasks(filters)
      
      expect(response.tasks).toBeDefined()
      // All returned tasks should have status 'todo'
      response.tasks.forEach(task => {
        expect(task.status).toBe('todo')
      })
    })

    it('should search tasks by title', async () => {
      const uniqueTitle = `Unique Search Task ${Date.now()}`
      const searchTask = await tasksService.createTask({
        title: uniqueTitle,
        status: 'todo'
      })
      
      createdTaskIds.push(searchTask.id)

      const filters: TaskFilters = { search: uniqueTitle }
      const response = await tasksService.getTasks(filters)
      
      expect(response.tasks.length).toBeGreaterThanOrEqual(1)
      const foundTask = response.tasks.find(task => task.title === uniqueTitle)
      expect(foundTask).toBeDefined()
      expect(foundTask!.id).toBe(searchTask.id)
    })

    it('should handle empty results gracefully', async () => {
      const filters: TaskFilters = { search: `nonexistent_${Date.now()}` }
      const response = await tasksService.getTasks(filters)
      
      expect(response.tasks).toHaveLength(0)
      expect(response.total).toBe(0)
    })

    it('should handle multiple filters', async () => {
      const filters: TaskFilters = { 
        status: 'todo',
        page: 1,
        limit: 5
      }
      const response = await tasksService.getTasks(filters)
      
      expect(response).toBeDefined()
      expect(response.limit).toBe(5)
      expect(response.page).toBe(1)
    })
  })

  describe('getTask - Real Backend Tests', () => {
    it('should fetch a specific task by id', async () => {
      // First create a task to get
      const taskData: CreateTaskRequest = {
        title: 'Get Task Test',
        description: 'Testing getTask functionality',
        status: 'todo',
        priority: 'med'
      }

      const createdTask = await tasksService.createTask(taskData)
      createdTaskIds.push(createdTask.id)

      const fetchedTask = await tasksService.getTask(createdTask.id)
      
      expect(fetchedTask).toBeDefined()
      expect(fetchedTask.id).toBe(createdTask.id)
      expect(fetchedTask.title).toBe('Get Task Test')
      expect(fetchedTask.description).toBe('Testing getTask functionality')
      expect(fetchedTask.status).toBe('todo')
      expect(fetchedTask.priority).toBe('med')
    })

    it('should throw error for non-existent task', async () => {
      await expect(tasksService.getTask('99999999-9999-9999-9999-999999999999')).rejects.toThrow()
    })
  })

  describe('createTask - Real Backend Tests', () => {
    it('should create a new task successfully', async () => {
      const newTaskData: CreateTaskRequest = {
        title: 'Real Backend Test Task',
        description: 'Testing real backend integration',
        status: 'todo',
        priority: 'high'
      }

      const createdTask = await tasksService.createTask(newTaskData)
      createdTaskIds.push(createdTask.id)
      
      expect(createdTask).toBeDefined()
      expect(createdTask.id).toBeTruthy()
      expect(createdTask.title).toBe('Real Backend Test Task')
      expect(createdTask.description).toBe('Testing real backend integration')
      expect(createdTask.status).toBe('todo')
      expect(createdTask.priority).toBe('high')
      expect(createdTask.created_at).toBeDefined()
      expect(createdTask.updated_at).toBeDefined()
    })

    it('should create task with minimal data', async () => {
      const minimalTaskData: CreateTaskRequest = {
        title: 'Minimal Task Real Test'
      }

      const createdTask = await tasksService.createTask(minimalTaskData)
      createdTaskIds.push(createdTask.id)
      
      expect(createdTask.title).toBe('Minimal Task Real Test')
      expect(createdTask.status).toBe('todo') // Should have default status
      expect(createdTask.id).toBeTruthy()
    })

    it('should reject task creation with invalid data', async () => {
      const invalidTaskData: CreateTaskRequest = {
        title: '' // Empty title should be invalid
      }

      await expect(tasksService.createTask(invalidTaskData)).rejects.toThrow()
    })

    it('should handle special characters in task data', async () => {
      const taskData: CreateTaskRequest = {
        title: 'Task with special chars: éñüáí 🚀',
        description: 'Description with "quotes" and \'apostrophes\'',
        status: 'todo'
      }

      const createdTask = await tasksService.createTask(taskData)
      createdTaskIds.push(createdTask.id)
      
      expect(createdTask.title).toBe(taskData.title)
      expect(createdTask.description).toBe(taskData.description)
    })
  })

  describe('updateTask - Real Backend Tests', () => {
    it('should update an existing task', async () => {
      // First create a task to update
      const originalTask = await tasksService.createTask({
        title: 'Original Title',
        description: 'Original description',
        status: 'todo',
        priority: 'low'
      })
      createdTaskIds.push(originalTask.id)

      const updateData: UpdateTaskRequest = {
        title: 'Updated Task Title',
        status: 'doing',
        priority: 'high'
      }

      const updatedTask = await tasksService.updateTask(originalTask.id, updateData)
      
      expect(updatedTask.id).toBe(originalTask.id)
      expect(updatedTask.title).toBe('Updated Task Title')
      expect(updatedTask.status).toBe('doing')
      expect(updatedTask.priority).toBe('high')
      expect(new Date(updatedTask.updated_at).getTime()).toBeGreaterThan(
        new Date(originalTask.updated_at).getTime()
      )
    })

    it('should partially update task fields', async () => {
      const originalTask = await tasksService.createTask({
        title: 'Partial Update Test',
        status: 'todo',
        priority: 'med'
      })
      createdTaskIds.push(originalTask.id)

      const updateData: UpdateTaskRequest = {
        status: 'done'
      }

      const updatedTask = await tasksService.updateTask(originalTask.id, updateData)
      
      expect(updatedTask.status).toBe('done')
      expect(updatedTask.title).toBe('Partial Update Test') // Should keep original title
      expect(updatedTask.priority).toBe('med') // Should keep original priority
    })

    it('should throw error when updating non-existent task', async () => {
      const updateData: UpdateTaskRequest = { status: 'done' }
      
      await expect(tasksService.updateTask('99999999-9999-9999-9999-999999999999', updateData)).rejects.toThrow()
    })
  })

  describe('deleteTask - Real Backend Tests', () => {
    it('should delete an existing task', async () => {
      // Create a task to delete
      const taskToDelete = await tasksService.createTask({
        title: 'Task to Delete',
        status: 'todo'
      })

      const result = await tasksService.deleteTask(taskToDelete.id)
      
      expect(result).toBeDefined()
      
      // Verify the task is actually deleted
      await expect(tasksService.getTask(taskToDelete.id)).rejects.toThrow()
    })

    it('should throw error when deleting non-existent task', async () => {
      await expect(tasksService.deleteTask('99999999-9999-9999-9999-999999999999')).rejects.toThrow()
    })
  })

  describe('Error Handling - Real Backend Tests', () => {
    it('should handle authentication errors', async () => {
      // Clear token to simulate unauthenticated state
      localStorage.removeItem('token')
      
      await expect(tasksService.getTasks()).rejects.toThrow()
      
      // Restore token for other tests
      localStorage.setItem('token', testToken)
    })

    it('should handle invalid task IDs', async () => {
      await expect(tasksService.getTask('invalid-id-format')).rejects.toThrow()
    })
  })

  describe('Data Integrity - Real Backend Tests', () => {
    it('should preserve task data integrity', async () => {
      const taskData: CreateTaskRequest = {
        title: 'Data Integrity Test',
        description: 'Testing data preservation',
        status: 'todo',
        priority: 'high'
      }

      const createdTask = await tasksService.createTask(taskData)
      createdTaskIds.push(createdTask.id)

      const fetchedTask = await tasksService.getTask(createdTask.id)
      
      // Verify all expected fields are present
      expect(fetchedTask).toHaveProperty('id')
      expect(fetchedTask).toHaveProperty('title')
      expect(fetchedTask).toHaveProperty('status')
      expect(fetchedTask).toHaveProperty('created_at')
      expect(fetchedTask).toHaveProperty('updated_at')
      
      // Verify date formats are valid ISO strings
      expect(new Date(fetchedTask.created_at)).toBeInstanceOf(Date)
      expect(new Date(fetchedTask.updated_at)).toBeInstanceOf(Date)
      expect(fetchedTask.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(fetchedTask.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should maintain task ownership', async () => {
      const taskData: CreateTaskRequest = {
        title: 'Ownership Test Task',
        status: 'todo'
      }

      const createdTask = await tasksService.createTask(taskData)
      createdTaskIds.push(createdTask.id)

      // The created task should belong to the current test user
      expect(createdTask.user_id).toBe(testUser.id)

      // Verify through getTasks that this task appears in user's tasks
      const tasksResponse = await tasksService.getTasks()
      const userTask = tasksResponse.tasks.find(task => task.id === createdTask.id)
      expect(userTask).toBeDefined()
      expect(userTask!.user_id).toBe(testUser.id)
    })
  })
})