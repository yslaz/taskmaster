import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'

// Setup for real integration tests - NO MOCKS

beforeAll(() => {
  console.log('🔧 Setting up real integration tests...')
  console.log('📡 Backend URL:', import.meta.env.VITE_API_BASE_URL || 'http://192.168.200.4:8000/api/v1')
})

afterEach(() => {
  // Clean localStorage after each test to avoid state leakage
  localStorage.clear()
})

afterAll(() => {
  console.log('✅ Integration tests cleanup complete')
})

// Simple localStorage implementation for integration tests
const storage: Record<string, string> = {}

const realLocalStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => { storage[key] = value },
  removeItem: (key: string) => { delete storage[key] },
  clear: () => { Object.keys(storage).forEach(key => delete storage[key]) },
  length: 0,
  key: (index: number) => Object.keys(storage)[index] || null
}

// Ensure localStorage is available
Object.defineProperty(global, 'localStorage', {
  value: realLocalStorage,
  writable: true
})

Object.defineProperty(window, 'localStorage', {
  value: realLocalStorage,
  writable: true
})

// Real fetch - no mocking for integration tests
if (!global.fetch) {
  global.fetch = fetch
}

// Environment variables for integration tests
vi.stubEnv('VITE_API_BASE_URL', 'http://192.168.200.4:8000/api/v1')

// Reduce console noise but keep important logs
global.console = {
  ...console,
  log: console.log, // Keep for debugging
  warn: console.warn, // Keep warnings
  error: console.error // Keep errors
}

// URL constructor for real integration tests
if (typeof global.URL === 'undefined') {
  global.URL = URL
}