interface ErrorLog {
  timestamp: string
  source: string
  error: string
  details?: any
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class ErrorHandler {
  private errorLogs: ErrorLog[] = []
  private readonly maxLogs = 1000

  logError(source: string, error: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      source,
      error: error?.message || String(error),
      details: error?.stack || error,
      severity
    }

    this.errorLogs.push(errorLog)
    
    // Keep only the most recent logs
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogs)
    }

    // Log to console based on severity
    switch (severity) {
      case 'critical':
        console.error(`🚨 CRITICAL ERROR [${source}]:`, error)
        break
      case 'high':
        console.error(`❌ HIGH ERROR [${source}]:`, error)
        break
      case 'medium':
        console.warn(`⚠️ MEDIUM ERROR [${source}]:`, error)
        break
      case 'low':
        console.log(`ℹ️ LOW ERROR [${source}]:`, error)
        break
    }
  }

  async handleAPIError(apiName: string, error: any, attempt: number = 0): Promise<boolean> {
    const errorMessage = error?.message || String(error)
    const statusCode = error?.status || error?.statusCode

    // Determine if error is retryable
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'socket hang up',
      'network timeout'
    ]

    const retryableStatusCodes = [408, 429, 500, 502, 503, 504]

    const isRetryable = 
      retryableErrors.some(err => errorMessage.toLowerCase().includes(err.toLowerCase())) ||
      retryableStatusCodes.includes(statusCode)

    if (statusCode === 429) {
      this.logError(apiName, `Rate limit exceeded: ${errorMessage}`, 'high')
      return true // Should retry after waiting
    }

    if (statusCode === 401 || statusCode === 403) {
      this.logError(apiName, `Authentication/Authorization error: ${errorMessage}`, 'critical')
      return false // Don't retry auth errors
    }

    if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
      this.logError(apiName, `Client error: ${errorMessage}`, 'medium')
      return false // Don't retry client errors (except rate limits)
    }

    if (isRetryable) {
      this.logError(apiName, `Retryable error (attempt ${attempt}): ${errorMessage}`, 'medium')
      return true
    }

    this.logError(apiName, `Non-retryable error: ${errorMessage}`, 'high')
    return false
  }

  getErrorSummary(): { total: number; bySeverity: Record<string, number>; bySource: Record<string, number> } {
    const bySeverity = this.errorLogs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const bySource = this.errorLogs.reduce((acc, log) => {
      acc[log.source] = (acc[log.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: this.errorLogs.length,
      bySeverity,
      bySource
    }
  }

  getRecentErrors(count: number = 10): ErrorLog[] {
    return this.errorLogs.slice(-count)
  }

  clearErrors(): void {
    this.errorLogs = []
  }

  // Specific error handling for different API types
  handleNetworkError(apiName: string, error: any): boolean {
    if (error.code === 'ENOTFOUND') {
      this.logError(apiName, 'DNS resolution failed', 'high')
      return false
    }
    
    if (error.code === 'ECONNREFUSED') {
      this.logError(apiName, 'Connection refused', 'high')
      return true // Might be temporary
    }
    
    if (error.code === 'ETIMEDOUT') {
      this.logError(apiName, 'Request timeout', 'medium')
      return true // Retry with timeout
    }
    
    return this.handleAPIError(apiName, error)
  }

  // Create a standardized error response
  createErrorResponse(source: string, error: any): any {
    return {
      success: false,
      source,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      retryable: this.isRetryableError(error)
    }
  }

  private isRetryableError(error: any): boolean {
    const statusCode = error?.status || error?.statusCode
    const message = error?.message || String(error)

    // Rate limits are retryable
    if (statusCode === 429) return true

    // Server errors are retryable
    if (statusCode >= 500) return true

    // Network errors are retryable
    const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED']
    return networkErrors.some(err => message.includes(err))
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