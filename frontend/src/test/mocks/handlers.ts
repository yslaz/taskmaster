import { http, HttpResponse } from 'msw'
import type { Task, User, TaskStats } from '../../types/index'

const mockUser: User = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

// Store for current user during test session
let currentUser = mockUser

// Function to reset user state for tests
export const resetUserState = () => {
  currentUser = mockUser
}

// Function to reset tasks state for tests
export const resetTasksState = () => {
  mockTasks.length = 0
  mockTasks.push(...initialMockTasks)
}

const initialMockTasks: Task[] = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Test Description 1',
    status: 'todo',
    priority: 'high',
    tag: 'work',
    due_date: '2024-12-31T23:59:59Z',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    user_id: '1'
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Test Description 2',
    status: 'doing',
    priority: 'med',
    tag: 'personal',
    due_date: '2024-12-31T23:59:59Z',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    user_id: '1'
  }
]

let mockTasks = [...initialMockTasks]

const mockStats: TaskStats = {
  total_tasks: 10,
  tasks_by_status: { todo: 4, doing: 3, done: 3 },
  tasks_by_priority: { low: 2, med: 5, high: 3 },
  completion_rate: 0.3,
  period_summary: {
    period: 'week',
    from_date: '2023-01-01',
    to_date: '2023-01-07',
    tasks_created: 5,
    tasks_completed: 3,
    tasks_updated: 8
  },
  time_series: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    created: [1, 2, 0, 1, 1],
    completed: [0, 1, 1, 0, 1],
    updated: [2, 3, 1, 1, 1]
  },
  overdue_tasks: 2,
  due_today: 1,
  due_this_week: 3
}

const API_BASE_URL = 'http://192.168.200.4:8000/api/v1'

export const handlers = [
  // Auth handlers
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const { username, password } = await request.json() as { username: string; password: string }
    
    if (username === 'testuser' && password === 'testpass') {
      currentUser = mockUser // Reset to default user for login
      return HttpResponse.json({
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: currentUser
        }
      })
    }
    
    return HttpResponse.json(
      { success: false, error: { message: 'Invalid credentials' } },
      { status: 401 }
    )
  }),

  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const userData = await request.json() as any
    
    const newUser = {
      id: '2',
      username: userData.username,
      email: userData.email,
      full_name: userData.full_name || userData.username,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    currentUser = newUser // Update current user for registration
    return HttpResponse.json({
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: newUser
      }
    })
  }),

  http.get(`${API_BASE_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Check for invalid token
    if (token === 'invalid-token') {
      return HttpResponse.json(
        { success: false, error: { message: 'Invalid token' } },
        { status: 401 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: currentUser
    })
  }),

  // Tasks handlers
  http.get(`${API_BASE_URL}/tasks`, ({ request }) => {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')

    let filteredTasks = [...mockTasks]

    // Apply status filter
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status)
    }

    // Apply search filter
    if (search) {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    const total = filteredTasks.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex)

    return HttpResponse.json({
      success: true,
      data: {
        tasks: paginatedTasks,
        total,
        page,
        total_pages: Math.ceil(total / limit)
      }
    })
  }),

  http.get(`${API_BASE_URL}/tasks/:id`, ({ params }) => {
    const task = mockTasks.find(t => t.id === params.id)
    
    if (!task) {
      return HttpResponse.json(
        { success: false, error: { message: 'Task not found' } },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: task
    })
  }),

  http.post(`${API_BASE_URL}/tasks`, async ({ request }) => {
    const taskData = await request.json() as any
    
    const newTask: Task = {
      id: String(mockTasks.length + 1),
      ...taskData,
      user_id: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    mockTasks.push(newTask)
    
    return HttpResponse.json({
      success: true,
      data: newTask
    }, { status: 201 })
  }),

  http.put(`${API_BASE_URL}/tasks/:id`, async ({ params, request }) => {
    const taskIndex = mockTasks.findIndex(t => t.id === params.id)
    
    if (taskIndex === -1) {
      return HttpResponse.json(
        { success: false, error: { message: 'Task not found' } },
        { status: 404 }
      )
    }
    
    const text = await request.text()
    let updateData: any = {}
    
    if (text) {
      try {
        updateData = JSON.parse(text)
      } catch {
        // Handle malformed JSON
      }
    }
    
    const updatedTask = {
      ...mockTasks[taskIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    }
    
    mockTasks[taskIndex] = updatedTask
    
    return HttpResponse.json({
      success: true,
      data: updatedTask
    })
  }),

  http.delete(`${API_BASE_URL}/tasks/:id`, ({ params }) => {
    const taskIndex = mockTasks.findIndex(t => t.id === params.id)
    
    if (taskIndex === -1) {
      return HttpResponse.json(
        { success: false, error: { message: 'Task not found' } },
        { status: 404 }
      )
    }
    
    mockTasks.splice(taskIndex, 1)
    
    return HttpResponse.json({
      success: true,
      data: { deleted: true }
    })
  }),

  // Statistics handlers
  http.get(`${API_BASE_URL}/statistics`, ({ request }) => {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const period = url.searchParams.get('period') || 'week'
    
    return HttpResponse.json({
      success: true,
      data: {
        ...mockStats,
        period_summary: {
          ...mockStats.period_summary,
          period
        }
      }
    })
  }),

  // Notifications handlers
  http.get(`${API_BASE_URL}/notifications`, ({ request }) => {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    
    const mockNotifications = [
      {
        id: 1,
        notification_type: 'task_due_soon',
        title: 'Task Due Soon',
        message: 'Task "Test Task 1" is due soon',
        read_at: null,
        created_at: new Date().toISOString(),
        metadata: { task_id: '1' }
      }
    ]
    
    return HttpResponse.json({
      success: true,
      data: mockNotifications.slice(0, limit)
    })
  }),

  http.get(`${API_BASE_URL}/notifications/unread-count`, ({ request }) => {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      success: true,
      data: { unread_count: 3 }
    })
  }),

  http.post(`${API_BASE_URL}/notifications/mark-read`, async ({ request }) => {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const text = await request.text()
    let notification_ids: number[] = []
    
    if (text) {
      try {
        const data = JSON.parse(text)
        notification_ids = data.notification_ids || []
      } catch {
        // Handle malformed JSON
      }
    }
    
    return HttpResponse.json({
      success: true,
      data: { marked: notification_ids.length }
    })
  }),

  // Fallback handler for unmatched requests
  http.all('*', ({ request }) => {
    console.log(`🔍 MSW: Unhandled ${request.method} request to ${request.url}`)
    console.log(`🔍 MSW: Expected base URL: ${API_BASE_URL}`)
    return HttpResponse.json(
      { success: false, error: { message: 'Not found' } },
      { status: 404 }
    )
  })
]