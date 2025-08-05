import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts"
import { RateLimitManager } from '../utils/rate-limit-manager.ts'
import { ErrorHandler } from '../utils/error-handler.ts'
import { GoogleTrendsCollector } from '../collectors/google-trends.ts'
import { RedditCollector } from '../collectors/reddit.ts'
import { TwitterCollector } from '../collectors/twitter.ts'
import { ProductHuntCollector } from '../collectors/product-hunt.ts'
import { GitHubCollector } from '../collectors/github.ts'

Deno.test("RateLimitManager - should initialize with default limits", () => {
  const rateLimitManager = new RateLimitManager()
  
  assertEquals(rateLimitManager.getRemainingRequests('google-trends'), 100)
  assertEquals(rateLimitManager.getRemainingRequests('reddit'), 60)
  assertEquals(rateLimitManager.getRemainingRequests('twitter'), 300)
})

Deno.test("RateLimitManager - should track request counts", async () => {
  const rateLimitManager = new RateLimitManager()
  
  const canMakeRequest = await rateLimitManager.checkRateLimit('google-trends')
  assertEquals(canMakeRequest, true)
  
  rateLimitManager.incrementRequestCount('google-trends')
  assertEquals(rateLimitManager.getRemainingRequests('google-trends'), 99)
})

Deno.test("RateLimitManager - should handle exponential backoff", async () => {
  const rateLimitManager = new RateLimitManager()
  
  const startTime = Date.now()
  await rateLimitManager.exponentialBackoff(0, 3)
  const endTime = Date.now()
  
  // Should wait at least 1 second for first attempt
  assertEquals(endTime - startTime >= 1000, true)
})

Deno.test("ErrorHandler - should log errors with severity", () => {
  const errorHandler = new ErrorHandler()
  
  errorHandler.logError('test-source', new Error('Test error'), 'high')
  
  const summary = errorHandler.getErrorSummary()
  assertEquals(summary.total, 1)
  assertEquals(summary.bySeverity.high, 1)
  assertEquals(summary.bySource['test-source'], 1)
})

Deno.test("ErrorHandler - should identify retryable errors", async () => {
  const errorHandler = new ErrorHandler()
  
  // Rate limit error should be retryable
  const rateLimitError = { status: 429, message: 'Rate limit exceeded' }
  const shouldRetry = await errorHandler.handleAPIError('test-api', rateLimitError)
  assertEquals(shouldRetry, true)
  
  // Auth error should not be retryable
  const authError = { status: 401, message: 'Unauthorized' }
  const shouldNotRetry = await errorHandler.handleAPIError('test-api', authError)
  assertEquals(shouldNotRetry, false)
})

Deno.test("GoogleTrendsCollector - should initialize correctly", () => {
  const rateLimitManager = new RateLimitManager()
  const errorHandler = new ErrorHandler()
  const collector = new GoogleTrendsCollector(rateLimitManager, errorHandler)
  
  assertExists(collector)
})

Deno.test("RedditCollector - should initialize correctly", () => {
  const rateLimitManager = new RateLimitManager()
  const errorHandler = new ErrorHandler()
  const collector = new RedditCollector(rateLimitManager, errorHandler)
  
  assertExists(collector)
})

Deno.test("TwitterCollector - should initialize correctly", () => {
  const rateLimitManager = new RateLimitManager()
  const errorHandler = new ErrorHandler()
  const collector = new TwitterCollector(rateLimitManager, errorHandler)
  
  assertExists(collector)
})

Deno.test("ProductHuntCollector - should initialize correctly", () => {
  const rateLimitManager = new RateLimitManager()
  const errorHandler = new ErrorHandler()
  const collector = new ProductHuntCollector(rateLimitManager, errorHandler)
  
  assertExists(collector)
})

Deno.test("GitHubCollector - should initialize correctly", () => {
  const rateLimitManager = new RateLimitManager()
  const errorHandler = new ErrorHandler()
  const collector = new GitHubCollector(rateLimitManager, errorHandler)
  
  assertExists(collector)
})

// Integration test for Google Trends collector (using mock data)
Deno.test("GoogleTrendsCollector - should collect mock data", async () => {
  const rateLimitManager = new RateLimitManager()
  const errorHandler = new ErrorHandler()
  const collector = new GoogleTrendsCollector(rateLimitManager, errorHandler)
  
  const data = await collector.collectData({
    themes: ['test-theme'],
    region: 'US',
    forceRefresh: false
  })
  
  assertEquals(data.length, 1)
  assertEquals(data[0].source, 'google-trends')
  assertExists(data[0].search_volume)
  assertExists(data[0].growth_rate)
  assertExists(data[0].geographic_data)
  assertExists(data[0].demographic_data)
})

// Test error handling in collectors
Deno.test("Collectors - should handle errors gracefully", async () => {
  const rateLimitManager = new RateLimitManager()
  const errorHandler = new ErrorHandler()
  
  // Test with empty themes array
  const collector = new GoogleTrendsCollector(rateLimitManager, errorHandler)
  const data = await collector.collectData({
    themes: [],
    region: 'US',
    forceRefresh: false
  })
  
  assertEquals(data.length, 0)
})