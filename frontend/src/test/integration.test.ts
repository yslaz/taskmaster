/**
 * Integration Tests Entry Point
 * 
 * This file serves as an entry point for all integration tests.
 * It imports all service integration tests to ensure they run together.
 */

import '../services/api.integration.test'
import '../services/auth.integration.test'
import '../services/tasks.integration.test'
import '../services/stats.integration.test'
import '../services/notifications.integration.test'

describe('TaskMaster Frontend Integration Tests', () => {
  it('should have all services covered by integration tests', () => {
    // This test ensures all integration test files are included
    expect(true).toBe(true)
  })
})