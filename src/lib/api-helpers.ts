import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from './supabase'
import { DatabaseError, createErrorResponse, createSuccessResponse } from './database'

// API response utilities
export function createAPIResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse {
  return NextResponse.json(
    createSuccessResponse(data, message),
    { status }
  )
}

export function createAPIErrorResponse(
  error: string | DatabaseError,
  status: number = 500,
  data: any = null
): NextResponse {
  return NextResponse.json(
    createErrorResponse(error, data),
    { status }
  )
}

// Request validation utilities
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json()
    const validatedData = schema.parse(body)
    return { data: validatedData, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: createAPIErrorResponse(
          `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          400
        ),
      }
    }
    return {
      data: null,
      error: createAPIErrorResponse('Invalid request body', 400),
    }
  }
}

export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  try {
    const params = Object.fromEntries(searchParams.entries())
    
    // Convert string values to appropriate types for common parameters
    const processedParams = Object.entries(params).reduce((acc, [key, value]) => {
      // Handle numeric parameters
      if (['page', 'limit', 'min_monetization_score', 'max_monetization_score', 'min_market_size', 'max_market_size'].includes(key)) {
        const numValue = parseInt(value, 10)
        acc[key] = isNaN(numValue) ? value : numValue
      }
      // Handle boolean parameters
      else if (['is_active', 'include_inactive'].includes(key)) {
        acc[key] = value === 'true'
      }
      // Handle array parameters (comma-separated)
      else if (['categories', 'competition_level', 'technical_difficulty', 'countries', 'age_groups'].includes(key)) {
        acc[key] = value.split(',').filter(Boolean)
      }
      else {
        acc[key] = value
      }
      return acc
    }, {} as any)

    const validatedData = schema.parse(processedParams)
    return { data: validatedData, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: createAPIErrorResponse(
          `Query parameter validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          400
        ),
      }
    }
    return {
      data: null,
      error: createAPIErrorResponse('Invalid query parameters', 400),
    }
  }
}

// Authentication utilities
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: createAPIErrorResponse('Missing or invalid authorization header', 401) }
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { user: null, error: createAPIErrorResponse('Invalid or expired token', 401) }
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: createAPIErrorResponse('Authentication failed', 401) }
  }
}

export async function requireAuthentication(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser(request)
  if (error) {
    return { user: null, error }
  }
  return { user, error: null }
}

// Rate limiting utilities (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }

  const current = rateLimitMap.get(identifier)
  
  if (!current || current.resetTime < now) {
    // First request in window or window has reset
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    }
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    }
  }

  current.count++
  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime,
  }
}

export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    maxRequests?: number
    windowMs?: number
    keyGenerator?: (request: NextRequest) => string
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const {
      maxRequests = 100,
      windowMs = 60 * 1000,
      keyGenerator = (req) => req.ip || 'anonymous',
    } = options

    const identifier = keyGenerator(request)
    const { allowed, remaining, resetTime } = checkRateLimit(identifier, maxRequests, windowMs)

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          resetTime: new Date(resetTime).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
          },
        }
      )
    }

    const response = await handler(request)
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString())

    return response
  }
}

// CORS utilities
export function withCORS(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const {
      origin = '*',
      methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers = ['Content-Type', 'Authorization'],
    } = options

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin,
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': headers.join(', '),
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const response = await handler(request)

    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', Array.isArray(origin) ? origin.join(', ') : origin)
    response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', headers.join(', '))

    return response
  }
}

// Error handling wrapper
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request)
    } catch (error) {
      console.error('API Error:', error)
      
      if (error instanceof DatabaseError) {
        return createAPIErrorResponse(error, 500)
      }
      
      if (error instanceof z.ZodError) {
        return createAPIErrorResponse(
          `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          400
        )
      }

      return createAPIErrorResponse('Internal server error', 500)
    }
  }
}

// Combine multiple middleware
export function withMiddleware(
  handler: (request: NextRequest) => Promise<NextResponse>,
  ...middlewares: Array<(handler: (request: NextRequest) => Promise<NextResponse>) => (request: NextRequest) => Promise<NextResponse>>
) {
  return middlewares.reduce((acc, middleware) => middleware(acc), handler)
}

// Subscription tier checking
export async function checkSubscriptionTier(
  userId: string,
  requiredTier: 'free' | 'basic' | 'pro'
): Promise<{ allowed: boolean; userTier: string | null }> {
  try {
    const supabase = createServerSupabaseClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return { allowed: false, userTier: null }
    }

    const tierHierarchy = { free: 0, basic: 1, pro: 2 }
    const userTierLevel = tierHierarchy[user.subscription_tier as keyof typeof tierHierarchy] ?? 0
    const requiredTierLevel = tierHierarchy[requiredTier]

    return {
      allowed: userTierLevel >= requiredTierLevel,
      userTier: user.subscription_tier,
    }
  } catch (error) {
    return { allowed: false, userTier: null }
  }
}

export function requireSubscriptionTier(requiredTier: 'free' | 'basic' | 'pro') {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      const { user, error } = await requireAuthentication(request)
      if (error) return error

      const { allowed, userTier } = await checkSubscriptionTier(user!.id, requiredTier)
      
      if (!allowed) {
        return createAPIErrorResponse(
          `This feature requires ${requiredTier} subscription or higher. Current tier: ${userTier || 'unknown'}`,
          403
        )
      }

      return handler(request)
    }
  }
}

// Logging utilities
export function logAPIRequest(request: NextRequest, response?: NextResponse) {
  const timestamp = new Date().toISOString()
  const method = request.method
  const url = request.url
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const ip = request.ip || 'unknown'
  const status = response?.status || 'pending'

  console.log(`[${timestamp}] ${method} ${url} - ${status} - ${ip} - ${userAgent}`)
}

export function withLogging(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    logAPIRequest(request)
    const response = await handler(request)
    logAPIRequest(request, response)
    return response
  }
}