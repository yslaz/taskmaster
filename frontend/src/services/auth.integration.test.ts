import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { authService } from './auth'
import type { LoginRequest, RegisterRequest } from '../types/index'

// Real backend integration tests for Auth Service
describe('Auth Service Real Integration Tests', () => {
  let testUserEmail: string
  let testUserPassword: string
  let createdUserIds: string[] = []

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    
    // Generate unique test user data
    const timestamp = Date.now()
    testUserEmail = `authtest_${timestamp}@example.com`
    testUserPassword = 'TestAuth123!'
  })

  afterEach(async () => {
    // Clean up: logout and clear localStorage
    authService.logout()
    localStorage.clear()
    
    // Note: In a real app, you might want to clean up test users from the database
    // but for integration tests, we'll let them persist to avoid affecting other tests
    createdUserIds = []
  })

  describe('register - Real Backend Tests', () => {
    it('should register new user successfully', async () => {
      const userData: RegisterRequest = {
        email: testUserEmail,
        password: testUserPassword,
        name: 'Auth Test User'
      }

      const response = await authService.register(userData)

      expect(response).toBeDefined()
      expect(response.token).toBeTruthy()
      expect(response.user).toBeDefined()
      expect(response.user.email).toBe(testUserEmail)
      expect(response.user.name).toBe('Auth Test User')
      expect(response.user.id).toBeTruthy()

      // Verify token and user are stored in localStorage
      expect(localStorage.getItem('token')).toBe(response.token)
      expect(localStorage.getItem('user')).toBeTruthy()
      
      const storedUser = JSON.parse(localStorage.getItem('user')!)
      expect(storedUser.email).toBe(testUserEmail)
      
      createdUserIds.push(response.user.id)
    })

    it('should handle registration validation errors', async () => {
      const invalidUserData: RegisterRequest = {
        email: 'invalid-email',
        password: '123', // Too short
        name: ''
      }

      await expect(authService.register(invalidUserData)).rejects.toThrow()
    })

    it('should reject duplicate email registration', async () => {
      // First, create a user
      const userData: RegisterRequest = {
        email: testUserEmail,
        password: testUserPassword,
        name: 'First User'
      }

      const firstResponse = await authService.register(userData)
      createdUserIds.push(firstResponse.user.id)

      // Try to register with same email
      const duplicateUserData: RegisterRequest = {
        email: testUserEmail, // Same email
        password: 'DifferentPassword123!',
        name: 'Second User'
      }

      await expect(authService.register(duplicateUserData)).rejects.toThrow()
    })
  })

  describe('login - Real Backend Tests', () => {
    it('should login successfully with valid credentials', async () => {
      // First register a user
      const userData: RegisterRequest = {
        email: testUserEmail,
        password: testUserPassword,
        name: 'Login Test User'
      }

      const registerResponse = await authService.register(userData)
      createdUserIds.push(registerResponse.user.id)
      
      // Clear localStorage to test fresh login
      localStorage.clear()

      // Now login with those credentials
      const credentials: LoginRequest = {
        email: testUserEmail,
        password: testUserPassword
      }

      const response = await authService.login(credentials)

      expect(response).toBeDefined()
      expect(response.token).toBeTruthy()
      expect(response.user).toBeDefined()
      expect(response.user.email).toBe(testUserEmail)
      expect(response.user.id).toBe(registerResponse.user.id)

      // Verify token and user are stored in localStorage
      expect(localStorage.getItem('token')).toBe(response.token)
      expect(localStorage.getItem('user')).toBeTruthy()
    })

    it('should reject login with invalid credentials', async () => {
      const credentials: LoginRequest = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }

      await expect(authService.login(credentials)).rejects.toThrow()

      // Verify no data is stored on failed login
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })

    it('should reject login with invalid email format', async () => {
      const credentials: LoginRequest = {
        email: 'invalid-email-format',
        password: testUserPassword
      }

      await expect(authService.login(credentials)).rejects.toThrow()
    })

    it('should reject login with empty credentials', async () => {
      const credentials: LoginRequest = {
        email: '',
        password: ''
      }

      await expect(authService.login(credentials)).rejects.toThrow()
    })
  })

  describe('me - Real Backend Tests', () => {
    it('should fetch current user when authenticated', async () => {
      // First register and login a user
      const userData: RegisterRequest = {
        email: testUserEmail,
        password: testUserPassword,
        name: 'Me Test User'
      }

      const registerResponse = await authService.register(userData)
      createdUserIds.push(registerResponse.user.id)

      const user = await authService.me()

      expect(user).toBeDefined()
      expect(user.id).toBe(registerResponse.user.id)
      expect(user.email).toBe(testUserEmail)
      expect(user.name).toBe('Me Test User')
    })

    it('should throw error when not authenticated', async () => {
      // Clear localStorage to simulate unauthenticated state
      localStorage.clear()

      await expect(authService.me()).rejects.toThrow()
    })

    it('should throw error with invalid token', async () => {
      // Set invalid token
      localStorage.setItem('token', 'invalid-token-12345')

      await expect(authService.me()).rejects.toThrow()
    })
  })

  describe('logout - Real Backend Tests', () => {
    it('should clear stored authentication data', async () => {
      // First register a user to have something to logout
      const userData: RegisterRequest = {
        email: testUserEmail,
        password: testUserPassword,
        name: 'Logout Test User'
      }

      const response = await authService.register(userData)
      createdUserIds.push(response.user.id)

      // Verify data is stored
      expect(localStorage.getItem('token')).toBeTruthy()
      expect(localStorage.getItem('user')).toBeTruthy()

      // Logout
      authService.logout()

      // Verify data is cleared
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })

    it('should handle logout when no data is stored', () => {
      // Clear localStorage first
      localStorage.clear()

      // Should not throw errors
      expect(() => authService.logout()).not.toThrow()
      
      // Call multiple times
      authService.logout()
      authService.logout()
    })
  })

  describe('localStorage Helper Methods - Real Tests', () => {
    it('should return stored user data', async () => {
      const userData: RegisterRequest = {
        email: testUserEmail,
        password: testUserPassword,
        name: 'Storage Test User'
      }

      const response = await authService.register(userData)
      createdUserIds.push(response.user.id)

      const storedUser = authService.getStoredUser()

      expect(storedUser).toBeDefined()
      expect(storedUser!.id).toBe(response.user.id)
      expect(storedUser!.email).toBe(testUserEmail)
    })

    it('should return null when no user is stored', () => {
      localStorage.clear()

      const user = authService.getStoredUser()

      expect(user).toBeNull()
    })

    it('should handle corrupted user data', () => {
      localStorage.setItem('user', 'invalid-json-data')

      expect(() => authService.getStoredUser()).toThrow()
    })

    it('should return stored token', async () => {
      const userData: RegisterRequest = {
        email: testUserEmail,
        password: testUserPassword,
        name: 'Token Test User'
      }

      const response = await authService.register(userData)
      createdUserIds.push(response.user.id)

      const token = authService.getToken()

      expect(token).toBe(response.token)
    })

    it('should return null when no token is stored', () => {
      localStorage.clear()

      const token = authService.getToken()

      expect(token).toBeNull()
    })
  })

  describe('isAuthenticated - Real Tests', () => {
    it('should return true when token exists', async () => {
      const userData: RegisterRequest = {
        email: testUserEmail,
        password: testUserPassword,
        name: 'Auth Check User'
      }

      const response = await authService.register(userData)
      createdUserIds.push(response.user.id)

      const isAuth = authService.isAuthenticated()

      expect(isAuth).toBe(true)
    })

    it('should return false when no token exists', () => {
      localStorage.clear()

      const isAuth = authService.isAuthenticated()

      expect(isAuth).toBe(false)
    })

    it('should return false when token is empty string', () => {
      localStorage.setItem('token', '')

      const isAuth = authService.isAuthenticated()

      expect(isAuth).toBe(false)
    })
  })

  describe('Complete Authentication Flow - Real Backend Tests', () => {
    it('should complete full registration and login flow', async () => {
      // 1. Initially not authenticated
      expect(authService.isAuthenticated()).toBe(false)
      expect(authService.getStoredUser()).toBeNull()

      // 2. Register new user
      const userData: RegisterRequest = {
        email: testUserEmail,
        password: testUserPassword,
        name: 'Flow Test User'
      }

      const registerResponse = await authService.register(userData)
      createdUserIds.push(registerResponse.user.id)

      // 3. Verify registered and authenticated
      expect(authService.isAuthenticated()).toBe(true)
      expect(authService.getStoredUser()?.email).toBe(testUserEmail)
      expect(authService.getToken()).toBe(registerResponse.token)

      // 4. Fetch current user
      const currentUser = await authService.me()
      expect(currentUser.email).toBe(testUserEmail)

      // 5. Logout
      authService.logout()

      // 6. Verify logged out state
      expect(authService.isAuthenticated()).toBe(false)
      expect(authService.getStoredUser()).toBeNull()
      expect(authService.getToken()).toBeNull()

      // 7. Login again with same credentials
      const credentials: LoginRequest = {
        email: testUserEmail,
        password: testUserPassword
      }

      const loginResponse = await authService.login(credentials)

      // 8. Verify logged in again
      expect(authService.isAuthenticated()).toBe(true)
      expect(loginResponse.user.id).toBe(registerResponse.user.id)
    })
  })
})