import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createAPIResponse,
  createAPIErrorResponse,
  validateRequestBody,
  validateQueryParams,
  getAuthenticatedUser,
  requireAuthentication,
  checkRateLimit,
  withRateLimit,
  withCORS,
  withErrorHandling,
  withMiddleware,
  checkSubscriptionTier,
  requireSubscriptionTier,
  withLogging
} from '../api-helpers'

// Mock Next.js
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: data,
      status: options?.status || 200,
      headers: new Map()
    }))
  }
}))

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}

jest.mock('../supabase', () => ({
  createServerSupabaseClient: () => mockSupabaseClient
}))

describe('API Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Response Utilities', () => {
    it('should create API success response', () => {
      const response = createAPIResponse({ id: '1' }, 200, 'Success')
      expect(response.json.data).toEqual({ id: '1' })
      expect(response.json.error).toBeNull()
      expect(response.json.message).toBe('Success')
      expect(response.status).toBe(200)
    })

    it('should create API error response', () => {
      const response = createAPIErrorResponse('Test error', 400)
      expect(response.json.data).toBeNull()
      expect(response.json.error).toBe('Test error')
      expect(response.status).toBe(400)
    })
  })

  describe('Request Validation', () => {
    const testSchema = z.object({
      name: z.string(),
      age: z.number()
    })

    it('should validate request body successfully', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: 'John', age: 30 })
      } as unknown as NextRequest

      const result = await validateRequestBody(mockRequest, testSchema)
      expect(result.error).toBeNull()
      expect(result.data).toEqual({ name: 'John', age: 30 })
    })

    it('should return validation error for invalid request body', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: 'John', age: 'invalid' })
      } as unknown as NextRequest

      const result = await validateRequestBody(mockRequest, testSchema)
      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should validate query parameters successfully', () => {
      const searchParams = new URLSearchParams('page=1&limit=10')
      const schema = z.object({
        page: z.number(),
        limit: z.number()
      })

      const result = validateQueryParams(searchParams, schema)
      expect(result.error).toBeNull()
      expect(result.data).toEqual({ page: 1, limit: 10 })
    })

    it('should handle boolean query parameters', () => {
      const searchParams = new URLSearchParams('is_active=true')
      const schema = z.object({
        is_active: z.boolean()
      })

      const result = validateQueryParams(searchParams, schema)
      expect(result.error).toBeNull()
      expect(result.data).toEqual({ is_active: true })
    })

    it('should handle array query parameters', () => {
      const searchParams = new URLSearchParams('categories=productivity,health,finance')
      const schema = z.object({
        categories: z.array(z.string())
      })

      const result = validateQueryParams(searchParams, schema)
      expect(result.error).toBeNull()
      expect(result.data).toEqual({ categories: ['productivity', 'health', 'finance'] })
    })
  })

  describe('Authentication', () => {
    it('should authenticate user successfully', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer valid-token')
        }
      } as unknown as NextRequest

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: '1', email: 'test@example.com' } },
        error: null
      })

      const result = await getAuthenticatedUser(mockRequest)
      expect(result.user).toBeTruthy()
      expect(result.error).toBeNull()
    })

    it('should return error for missing authorization header', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null)
        }
      } as unknown as NextRequest

      const result = await getAuthenticatedUser(mockRequest)
      expect(result.user).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should return error for invalid token', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer invalid-token')
        }
      } as unknown as NextRequest

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      })

      const result = await getAuthenticatedUser(mockRequest)
      expect(result.user).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const result = checkRateLimit('test-user', 10, 60000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
    })

    it('should block requests exceeding rate limit', () => {
      // Exhaust the rate limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit('test-user-2', 10, 60000)
      }
      
      const result = checkRateLimit('test-user-2', 10, 60000)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset rate limit after window expires', () => {
      // Use a very short window for testing
      checkRateLimit('test-user-3', 1, 1) // 1ms window
      
      // Wait for window to expire
      setTimeout(() => {
        const result = checkRateLimit('test-user-3', 1, 1)
        expect(result.allowed).toBe(true)
      }, 2)
    })
  })

  describe('Subscription Tier Checking', () => {
    it('should allow access for sufficient subscription tier', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { subscription_tier: 'pro' },
        error: null
      })

      const result = await checkSubscriptionTier('user-1', 'basic')
      expect(result.allowed).toBe(true)
      expect(result.userTier).toBe('pro')
    })

    it('should deny access for insufficient subscription tier', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: { subscription_tier: 'free' },
        error: null
      })

      const result = await checkSubscriptionTier('user-1', 'pro')
      expect(result.allowed).toBe(false)
      expect(result.userTier).toBe('free')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      })

      const result = await checkSubscriptionTier('user-1', 'basic')
      expect(result.allowed).toBe(false)
      expect(result.userTier).toBeNull()
    })
  })

  describe('Middleware Composition', () => {
    it('should compose multiple middleware functions', async () => {
      const mockHandler = jest.fn().mockResolvedValue(new NextResponse())
      const middleware1 = jest.fn((handler) => handler)
      const middleware2 = jest.fn((handler) => handler)
      
      const composedHandler = withMiddleware(mockHandler, middleware1, middleware2)
      
      expect(middleware1).toHaveBeenCalled()
      expect(middleware2).toHaveBeenCalled()
    })

    it('should handle errors in error handling middleware', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Test error'))
      const mockRequest = {} as NextRequest
      
      const wrappedHandler = withErrorHandling(mockHandler)
      const response = await wrappedHandler(mockRequest)
      
      expect(response.json.error).toBe('Internal server error')
    })
  })

  describe('CORS Middleware', () => {
    it('should handle preflight OPTIONS requests', async () => {
      const mockHandler = jest.fn()
      const mockRequest = { method: 'OPTIONS' } as NextRequest
      
      const corsHandler = withCORS(mockHandler)
      const response = await corsHandler(mockRequest)
      
      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('should add CORS headers to regular requests', async () => {
      const mockResponse = {
        headers: {
          set: jest.fn()
        }
      } as unknown as NextResponse
      
      const mockHandler = jest.fn().mockResolvedValue(mockResponse)
      const mockRequest = { method: 'GET' } as NextRequest
      
      const corsHandler = withCORS(mockHandler)
      await corsHandler(mockRequest)
      
      expect(mockResponse.headers.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
    })
  })

  describe('Logging Middleware', () => {
    it('should log API requests', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const mockHandler = jest.fn().mockResolvedValue(new NextResponse())
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: {
          get: jest.fn().mockReturnValue('test-agent')
        },
        ip: '127.0.0.1'
      } as unknown as NextRequest
      
      const loggingHandler = withLogging(mockHandler)
      await loggingHandler(mockRequest)
      
      expect(consoleSpy).toHaveBeenCalledTimes(2) // Before and after request
      consoleSpy.mockRestore()
    })
  })
})