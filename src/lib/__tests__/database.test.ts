import { describe, it, expect, beforeAll } from '@jest/globals'
import { databaseHealth, userOperations, themeOperations } from '../database'

// Note: These tests require a Supabase connection
// They should be run with proper environment variables set

describe('Database Operations', () => {
  beforeAll(async () => {
    // Check if we can connect to the database
    const isConnected = await databaseHealth.checkConnection()
    if (!isConnected) {
      console.warn('Database connection failed - skipping tests')
    }
  })

  describe('Database Health', () => {
    it('should check database connection', async () => {
      const isConnected = await databaseHealth.checkConnection()
      expect(typeof isConnected).toBe('boolean')
    })

    it('should get table counts', async () => {
      const counts = await databaseHealth.getTableCounts()
      expect(typeof counts).toBe('object')
      expect(counts).toHaveProperty('users')
      expect(counts).toHaveProperty('themes')
      expect(counts).toHaveProperty('trend_data')
      expect(counts).toHaveProperty('competitor_analysis')
      expect(counts).toHaveProperty('user_alerts')
      expect(counts).toHaveProperty('subscriptions')
    })
  })

  describe('Theme Operations', () => {
    it('should fetch themes with filters', async () => {
      const themes = await themeOperations.getThemes({
        limit: 10,
        offset: 0
      })
      expect(Array.isArray(themes)).toBe(true)
    })

    it('should handle theme filters correctly', async () => {
      const themes = await themeOperations.getThemes({
        category: 'productivity',
        competition_level: 'low',
        technical_difficulty: 'beginner',
        limit: 5
      })
      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBeLessThanOrEqual(5)
    })
  })

  describe('User Operations', () => {
    it('should handle user operations gracefully', async () => {
      // Test with a non-existent user ID
      const user = await userOperations.getUser('00000000-0000-0000-0000-000000000000')
      expect(user).toBeNull()
    })
  })
})

// Integration test for database schema validation
describe('Database Schema Validation', () => {
  it('should have all required tables', async () => {
    const counts = await databaseHealth.getTableCounts()
    const requiredTables = [
      'users',
      'themes', 
      'trend_data',
      'competitor_analysis',
      'user_alerts',
      'subscriptions'
    ]

    for (const table of requiredTables) {
      expect(counts).toHaveProperty(table)
      expect(typeof counts[table]).toBe('number')
    }
  })
})