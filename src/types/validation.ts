import { z } from 'zod'
import type { ValidationError, APIError } from './index'

/**
 * Validation utility functions for runtime type checking
 */

/**
 * Validates data against a Zod schema and returns formatted validation errors
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: ValidationError[] = error.errors.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }))
      return { success: false, errors: validationErrors }
    }
    
    // Handle unexpected errors
    return {
      success: false,
      errors: [
        {
          field: 'unknown',
          message: 'An unexpected validation error occurred',
          code: 'unknown_error',
        },
      ],
    }
  }
}

/**
 * Safely parses data with a Zod schema, returning null if validation fails
 */
export function safeParseData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | null {
  try {
    return schema.parse(data)
  } catch {
    return null
  }
}

/**
 * Creates a standardized API error response
 */
export function createAPIError(
  code: string,
  message: string,
  details?: ValidationError[]
): APIError {
  return {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  }
}

/**
 * Validates and transforms API request data
 */
export function validateAPIRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const validation = validateData(schema, data)
  
  if (!validation.success) {
    throw createAPIError(
      'VALIDATION_ERROR',
      'Request validation failed',
      validation.errors
    )
  }
  
  return validation.data
}

/**
 * Type guard functions for runtime type checking
 */

export function isThemeCategory(value: string): value is import('./index').ThemeCategory {
  return ['productivity', 'entertainment', 'education', 'health', 'finance', 'social'].includes(value)
}

export function isCompetitionLevel(value: string): value is import('./index').CompetitionLevel {
  return ['low', 'medium', 'high'].includes(value)
}

export function isTechnicalDifficulty(value: string): value is import('./index').TechnicalDifficulty {
  return ['beginner', 'intermediate', 'advanced'].includes(value)
}

export function isSubscriptionTier(value: string): value is import('./index').SubscriptionTier {
  return ['free', 'basic', 'pro'].includes(value)
}

export function isAgeGroup(value: string): value is import('./index').AgeGroup {
  return ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].includes(value)
}

export function isGender(value: string): value is import('./index').Gender {
  return ['male', 'female', 'other', 'prefer_not_to_say'].includes(value)
}

export function isIncomeLevel(value: string): value is import('./index').IncomeLevel {
  return ['low', 'middle', 'high', 'premium'].includes(value)
}

export function isDataSourceType(value: string): value is import('./index').DataSourceType {
  return ['google_trends', 'reddit', 'twitter', 'product_hunt', 'github'].includes(value)
}

/**
 * Utility function to check if a value is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Utility function to check if a value is a valid ISO datetime string
 */
export function isValidISODateTime(value: string): boolean {
  try {
    const date = new Date(value)
    return date.toISOString() === value
  } catch {
    return false
  }
}

/**
 * Utility function to sanitize and validate email addresses
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.toLowerCase().trim())
}

/**
 * Utility function to validate URL strings
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Utility function to validate country codes (ISO 3166-1 alpha-2 or alpha-3)
 */
export function isValidCountryCode(code: string): boolean {
  return code.length >= 2 && code.length <= 3 && /^[A-Z]+$/.test(code.toUpperCase())
}

/**
 * Utility function to validate score values (0-100)
 */
export function isValidScore(score: number): boolean {
  return typeof score === 'number' && score >= 0 && score <= 100 && !isNaN(score)
}

/**
 * Utility function to validate positive numbers
 */
export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && value >= 0 && !isNaN(value)
}

/**
 * Utility function to validate pagination parameters
 */
export function validatePaginationParams(page?: number, limit?: number): {
  page: number
  limit: number
} {
  const validatedPage = page && page > 0 ? Math.floor(page) : 1
  const validatedLimit = limit && limit > 0 && limit <= 100 ? Math.floor(limit) : 20
  
  return {
    page: validatedPage,
    limit: validatedLimit,
  }
}

/**
 * Utility function to create safe database queries with proper escaping
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[%_\\]/g, '\\$&') // Escape SQL wildcards
    .replace(/'/g, "''") // Escape single quotes
    .substring(0, 255) // Limit length
}

/**
 * Utility function to validate and normalize theme titles
 */
export function normalizeThemeTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .substring(0, 255) // Limit length
}

/**
 * Utility function to validate and normalize descriptions
 */
export function normalizeDescription(description: string): string {
  return description
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .substring(0, 1000) // Limit length
}