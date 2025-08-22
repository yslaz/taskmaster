import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock AuthContext
const mockAuthContext = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
  register: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn().mockResolvedValue(undefined)
}

// Mock NotificationContext
const mockNotificationContext = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn()
}

// Create a wrapper component with all providers
function AllTheProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Helper functions for tests
export const createMockQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0
    },
    mutations: {
      retry: false
    }
  }
})

export const waitForLoadingToFinish = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock localStorage helpers
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Reset localStorage mock
export const resetLocalStorageMock = () => {
  mockLocalStorage.getItem.mockReset()
  mockLocalStorage.setItem.mockReset()
  mockLocalStorage.removeItem.mockReset()
  mockLocalStorage.clear.mockReset()
}

// Setup authentication mock
export const setupAuthMock = (isAuthenticated = true, token = 'mock-jwt-token') => {
  mockLocalStorage.getItem.mockImplementation((key: string) => {
    if (key === 'token') return isAuthenticated ? token : null
    if (key === 'user') return isAuthenticated ? JSON.stringify(mockAuthContext.user) : null
    return null
  })
}

export { mockAuthContext, mockNotificationContext }