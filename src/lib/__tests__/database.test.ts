import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { 
  userOperations, 
  themeOperations, 
  trendDataOperations,
  userAlertOperations,
  subscriptionOperations,
  competitorAnalysisOperations,
  databaseHealth,
  realtimeHelpers,
  batchOperations,
  DatabaseError,
  handleDatabaseError,
  createSuccessResponse,
  createErrorResponse,
  validatePaginationParams
} from '../database'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ 
          data: { id: '1', email: 'test@example.com', subscription_tier: 'free' }, 
          error: null 
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({
            data: [{ id: '1', email: 'test@example.com' }],
            error: null
          }))
        }))
      })),
      gte: jest.fn(() => ({
        lte: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({
              data: [{ id: '1', title: 'Test Theme' }],
              error: null,
              count: 1
            }))
          }))
        }))
      })),
      order: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({
          data: [{ id: '1', title: 'Test Theme' }],
          error: null
        })),
        range: jest.fn(() => Promise.resolve({
          data: [{ id: '1', title: 'Test Theme' }],
          error: null,
          count: 1
        }))
      })),
      limit: jest.fn(() => Promise.resolve({
        data: [{ id: '1' }],
        error: null
      })),
      in: jest.fn(() => ({
        delete: jest.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ 
          data: { id: '1', email: 'test@example.com', created_at: new Date().toISOString() }, 
          error: null 
        }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { id: '1', email: 'updated@example.com', updated_at: new Date().toISOString() }, 
            error: null 
          }))
        }))
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null }))
    }))
  })),
  channel: jest.fn(() => ({
    on: jest.fn(() => ({
      subscribe: jest.fn(() => ({}))
    }))
  })),
  removeChannel: jest.fn(),
  auth: {
    getUser: jest.fn(() => Promise.resolve({
      data: { user: { id: '1', email: 'test@example.com' } },
      error: null
    }))
  }
}

jest.mock('../supabase', () => ({
  supabase: mockSupabaseClient,
  createServerSupabaseClient: () => mockSupabaseClient
}))

describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Error Handling', () => {
    it('should create DatabaseError correctly', () => {
      const error = new DatabaseError('Test error', 'TEST_CODE', { detail: 'test' })
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error.details).toEqual({ detail: 'test' })
      expect(error.name).toBe('DatabaseError')
    })

    it('should handle database errors correctly', () => {
      const supabaseError = { code: 'PGRST116', message: 'Not found', details: null }
      const dbError = handleDatabaseError(supabaseError)
      expect(dbError).toBeInstanceOf(DatabaseError)
      expect(dbError.code).toBe('PGRST116')
      expect(dbError.message).toBe('Not found')
    })

    it('should create success response', () => {
      const response = createSuccessResponse({ id: '1' }, 'Success')
      expect(response.data).toEqual({ id: '1' })
      expect(response.error).toBeNull()
      expect(response.message).toBe('Success')
      expect(response.timestamp).toBeDefined()
    })

    it('should create error response', () => {
      const response = createErrorResponse('Test error')
      expect(response.data).toBeNull()
      expect(response.error).toBe('Test error')
      expect(response.timestamp).toBeDefined()
    })
  })

  describe('Validation Utilities', () => {
    it('should validate pagination parameters', () => {
      const result = validatePaginationParams(2, 50)
      expect(result.page).toBe(2)
      expect(result.limit).toBe(50)
      expect(result.offset).toBe(50)
    })

    it('should handle invalid pagination parameters', () => {
      const result = validatePaginationParams(-1, 200)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(100)
      expect(result.offset).toBe(0)
    })
  })

  describe('User Operations', () => {
    it('should get user by id successfully', async () => {
      const response = await userOperations.getUser('1')
      expect(response.data).toBeTruthy()
      expect(response.data?.id).toBe('1')
      expect(response.error).toBeNull()
    })

    it('should return error for missing user id', async () => {
      const response = await userOperations.getUser('')
      expect(response.data).toBeNull()
      expect(response.error).toBe('User ID is required')
    })

    it('should create a new user successfully', async () => {
      const response = await userOperations.createUser({
        email: 'test@example.com',
        subscription_tier: 'free'
      })
      expect(response.data).toBeTruthy()
      expect(response.data?.email).toBe('test@example.com')
      expect(response.error).toBeNull()
      expect(response.message).toBe('User created successfully')
    })

    it('should return error for missing email', async () => {
      const response = await userOperations.createUser({
        email: '',
        subscription_tier: 'free'
      })
      expect(response.data).toBeNull()
      expect(response.error).toBe('Email is required')
    })

    it('should update user successfully', async () => {
      const response = await userOperations.updateUser('1', {
        email: 'updated@example.com'
      })
      expect(response.data).toBeTruthy()
      expect(response.data?.email).toBe('updated@example.com')
      expect(response.error).toBeNull()
      expect(response.message).toBe('User updated successfully')
    })

    it('should delete user successfully', async () => {
      const response = await userOperations.deleteUser('1')
      expect(response.data).toBeNull()
      expect(response.error).toBeNull()
      expect(response.message).toBe('User deleted successfully')
    })

    it('should get user by email successfully', async () => {
      const response = await userOperations.getUserByEmail('test@example.com')
      expect(response.data).toBeTruthy()
      expect(response.error).toBeNull()
    })
  })

  describe('Theme Operations', () => {
    it('should get themes with filters', async () => {
      const response = await themeOperations.getThemes({
        category: 'productivity',
        page: 1,
        limit: 10
      })
      expect(response.data).toBeInstanceOf(Array)
      expect(response.pagination).toBeDefined()
      expect(response.pagination.page).toBe(1)
      expect(response.pagination.limit).toBe(10)
      expect(response.error).toBeNull()
    })

    it('should get single theme by id', async () => {
      const response = await themeOperations.getTheme('1')
      expect(response.data).toBeTruthy()
      expect(response.error).toBeNull()
    })

    it('should return error for missing theme id', async () => {
      const response = await themeOperations.getTheme('')
      expect(response.data).toBeNull()
      expect(response.error).toBe('Theme ID is required')
    })

    it('should create theme successfully', async () => {
      const response = await themeOperations.createTheme({
        title: 'Test Theme',
        description: 'Test description',
        category: 'productivity'
      })
      expect(response.data).toBeTruthy()
      expect(response.error).toBeNull()
      expect(response.message).toBe('Theme created successfully')
    })

    it('should get trending themes', async () => {
      const response = await themeOperations.getTrendingThemes(5)
      expect(response.data).toBeInstanceOf(Array)
      expect(response.error).toBeNull()
    })
  })

  describe('Trend Data Operations', () => {
    it('should get trend data for theme', async () => {
      const response = await trendDataOperations.getTrendDataForTheme('1', {
        limit: 10,
        source: 'google_trends'
      })
      expect(response.data).toBeInstanceOf(Array)
      expect(response.error).toBeNull()
    })

    it('should create trend data successfully', async () => {
      const response = await trendDataOperations.createTrendData({
        theme_id: '1',
        source: 'google_trends',
        search_volume: 1000,
        growth_rate: 5.5
      })
      expect(response.data).toBeTruthy()
      expect(response.error).toBeNull()
      expect(response.message).toBe('Trend data created successfully')
    })

    it('should bulk create trend data', async () => {
      const trendDataArray = [
        { theme_id: '1', source: 'google_trends', search_volume: 1000, growth_rate: 5.5 },
        { theme_id: '1', source: 'reddit', search_volume: 500, growth_rate: 3.2 }
      ]
      const response = await trendDataOperations.bulkCreateTrendData(trendDataArray)
      expect(response.data).toBeInstanceOf(Array)
      expect(response.error).toBeNull()
    })

    it('should get trend data stats', async () => {
      const response = await trendDataOperations.getTrendDataStats('1')
      expect(response.data).toBeTruthy()
      expect(response.data?.totalRecords).toBeDefined()
      expect(response.data?.sources).toBeInstanceOf(Array)
      expect(response.error).toBeNull()
    })
  })

  describe('User Alert Operations', () => {
    it('should get user alerts', async () => {
      const response = await userAlertOperations.getUserAlerts('1')
      expect(response.data).toBeInstanceOf(Array)
      expect(response.error).toBeNull()
    })

    it('should create alert successfully', async () => {
      const response = await userAlertOperations.createAlert({
        user_id: '1',
        theme_id: '1',
        alert_type: 'score_change',
        threshold_value: 80
      })
      expect(response.data).toBeTruthy()
      expect(response.error).toBeNull()
      expect(response.message).toBe('Alert created successfully')
    })

    it('should toggle alert successfully', async () => {
      // Mock the current alert state
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { is_active: true },
        error: null
      })

      const response = await userAlertOperations.toggleAlert('1')
      expect(response.data).toBeTruthy()
      expect(response.error).toBeNull()
    })
  })

  describe('Subscription Operations', () => {
    it('should get user subscription', async () => {
      const response = await subscriptionOperations.getUserSubscription('1')
      expect(response.data).toBeTruthy()
      expect(response.error).toBeNull()
    })

    it('should create subscription successfully', async () => {
      const response = await subscriptionOperations.createSubscription({
        user_id: '1',
        plan_name: 'basic',
        status: 'active',
        stripe_subscription_id: 'sub_123'
      })
      expect(response.data).toBeTruthy()
      expect(response.error).toBeNull()
      expect(response.message).toBe('Subscription created successfully')
    })

    it('should cancel subscription successfully', async () => {
      const response = await subscriptionOperations.cancelSubscription('1')
      expect(response.data).toBeTruthy()
      expect(response.error).toBeNull()
      expect(response.message).toBe('Subscription canceled successfully')
    })
  })

  describe('Competitor Analysis Operations', () => {
    it('should get competitors for theme', async () => {
      const response = await competitorAnalysisOperations.getCompetitorsForTheme('1')
      expect(response.data).toBeInstanceOf(Array)
      expect(response.error).toBeNull()
    })

    it('should create competitor analysis', async () => {
      const response = await competitorAnalysisOperations.createCompetitorAnalysis({
        theme_id: '1',
        competitor_name: 'Competitor A',
        competitor_url: 'https://competitor.com',
        estimated_revenue: 50000
      })
      expect(response.data).toBeTruthy()
      expect(response.error).toBeNull()
      expect(response.message).toBe('Competitor analysis created successfully')
    })
  })

  describe('Database Health', () => {
    it('should check database connection', async () => {
      const response = await databaseHealth.checkConnection()
      expect(response.data).toBe(true)
      expect(response.error).toBeNull()
    })

    it('should get table counts', async () => {
      const response = await databaseHealth.getTableCounts()
      expect(response.data).toBeTruthy()
      expect(typeof response.data).toBe('object')
      expect(response.error).toBeNull()
    })

    it('should get system stats', async () => {
      // Mock the Promise.all results
      const mockStats = [
        { count: 10, error: null },
        { count: 5, error: null },
        { count: 100, error: null },
        { count: 3, error: null },
        { count: 8, error: null },
        { data: { timestamp: new Date().toISOString() }, error: null }
      ]
      
      jest.spyOn(Promise, 'all').mockResolvedValueOnce(mockStats)

      const response = await databaseHealth.getSystemStats()
      expect(response.data).toBeTruthy()
      expect(response.data?.totalUsers).toBeDefined()
      expect(response.data?.totalThemes).toBeDefined()
      expect(response.error).toBeNull()
    })
  })

  describe('Batch Operations', () => {
    it('should bulk update themes', async () => {
      const updates = [
        { id: '1', updates: { title: 'Updated Theme 1' } },
        { id: '2', updates: { title: 'Updated Theme 2' } }
      ]
      const response = await batchOperations.bulkUpdateThemes(updates)
      expect(response.data).toBeInstanceOf(Array)
      expect(response.error).toBeNull()
    })

    it('should bulk delete alerts', async () => {
      const response = await batchOperations.bulkDeleteAlerts(['1', '2', '3'])
      expect(response.data).toBeNull()
      expect(response.error).toBeNull()
      expect(response.message).toBe('3 alerts deleted successfully')
    })
  })

  describe('Real-time Helpers', () => {
    it('should subscribe to theme updates', () => {
      const callback = jest.fn()
      const subscription = realtimeHelpers.subscribeToThemeUpdates(callback)
      expect(subscription).toBeDefined()
      expect(subscription.unsubscribe).toBeInstanceOf(Function)
    })

    it('should subscribe to new trend data', () => {
      const callback = jest.fn()
      const subscription = realtimeHelpers.subscribeToNewTrendData('1', callback)
      expect(subscription).toBeDefined()
      expect(subscription.unsubscribe).toBeInstanceOf(Function)
    })

    it('should subscribe to user alerts', () => {
      const callback = jest.fn()
      const subscription = realtimeHelpers.subscribeToUserAlerts('1', callback)
      expect(subscription).toBeDefined()
      expect(subscription.unsubscribe).toBeInstanceOf(Function)
    })
  })
})