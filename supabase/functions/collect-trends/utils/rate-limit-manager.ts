interface RateLimit {
  requests: number
  windowMs: number
  lastReset: number
}

interface APILimits {
  [key: string]: RateLimit
}

export class RateLimitManager {
  private limits: APILimits = {}
  
  // Default rate limits for each API
  private readonly defaultLimits = {
    'google-trends': { requests: 100, windowMs: 60000 }, // 100 requests per minute
    'reddit': { requests: 60, windowMs: 60000 }, // 60 requests per minute
    'twitter': { requests: 300, windowMs: 900000 }, // 300 requests per 15 minutes
    'product-hunt': { requests: 1000, windowMs: 3600000 }, // 1000 requests per hour
    'github': { requests: 5000, windowMs: 3600000 }, // 5000 requests per hour
  }

  constructor() {
    this.initializeLimits()
  }

  private initializeLimits() {
    for (const [api, limit] of Object.entries(this.defaultLimits)) {
      this.limits[api] = {
        requests: 0,
        windowMs: limit.windowMs,
        lastReset: Date.now()
      }
    }
  }

  async checkRateLimit(apiName: string): Promise<boolean> {
    const limit = this.limits[apiName]
    if (!limit) {
      console.warn(`No rate limit configured for API: ${apiName}`)
      return true
    }

    const now = Date.now()
    const defaultLimit = this.defaultLimits[apiName]

    // Reset counter if window has passed
    if (now - limit.lastReset >= limit.windowMs) {
      limit.requests = 0
      limit.lastReset = now
    }

    // Check if we're within limits
    if (limit.requests >= defaultLimit.requests) {
      const waitTime = limit.windowMs - (now - limit.lastReset)
      console.log(`Rate limit exceeded for ${apiName}. Wait ${waitTime}ms`)
      return false
    }

    return true
  }

  async waitForRateLimit(apiName: string): Promise<void> {
    const limit = this.limits[apiName]
    if (!limit) return

    const now = Date.now()
    const waitTime = limit.windowMs - (now - limit.lastReset)
    
    if (waitTime > 0) {
      console.log(`Waiting ${waitTime}ms for ${apiName} rate limit reset`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      
      // Reset after waiting
      limit.requests = 0
      limit.lastReset = Date.now()
    }
  }

  incrementRequestCount(apiName: string): void {
    const limit = this.limits[apiName]
    if (limit) {
      limit.requests++
    }
  }

  getRemainingRequests(apiName: string): number {
    const limit = this.limits[apiName]
    const defaultLimit = this.defaultLimits[apiName]
    
    if (!limit || !defaultLimit) return 0
    
    const now = Date.now()
    
    // Reset if window passed
    if (now - limit.lastReset >= limit.windowMs) {
      return defaultLimit.requests
    }
    
    return Math.max(0, defaultLimit.requests - limit.requests)
  }

  getTimeUntilReset(apiName: string): number {
    const limit = this.limits[apiName]
    if (!limit) return 0
    
    const now = Date.now()
    return Math.max(0, limit.windowMs - (now - limit.lastReset))
  }

  // Exponential backoff for retries
  async exponentialBackoff(attempt: number, maxAttempts: number = 5): Promise<void> {
    if (attempt >= maxAttempts) {
      throw new Error(`Max retry attempts (${maxAttempts}) exceeded`)
    }
    
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000) // Max 30 seconds
    const jitter = Math.random() * 1000 // Add jitter to prevent thundering herd
    
    console.log(`Retrying in ${delay + jitter}ms (attempt ${attempt + 1}/${maxAttempts})`)
    await new Promise(resolve => setTimeout(resolve, delay + jitter))
  }
}