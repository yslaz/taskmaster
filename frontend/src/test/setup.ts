import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { server } from './mocks/server'
import { resetUserState, resetTasksState } from './mocks/handlers'

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn'
  })
})

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers()
  resetUserState()
  resetTasksState()
})

// Clean up after the tests are finished
afterAll(() => server.close())

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(public url: string) {
    // Simulate connection opening after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 100)
  }

  send(data: string) {
    // Mock sending data
    console.log('Mock WebSocket send:', data)
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'))
    }
  }
}

Object.defineProperty(window, 'WebSocket', {
  value: MockWebSocket,
})

// Mock fetch if not already mocked by MSW
if (!global.fetch) {
  global.fetch = vi.fn()
}

// Mock URL constructor for tests
Object.defineProperty(global, 'URL', {
  value: URL,
  writable: true,
})

// Mock environment variables
vi.stubEnv('VITE_API_BASE_URL', 'http://192.168.200.4:8000/api/v1')

// Mock console methods to reduce noise in tests (but keep log for debugging)
global.console = {
  ...console,
  warn: console.warn, // Keep warnings for MSW debugging
  error: vi.fn(),
}