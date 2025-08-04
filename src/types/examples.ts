/**
 * Examples demonstrating how to use the type definitions and validation schemas
 */

import {
  // Types
  Theme,
  User,
  TrendData,
  DemographicData,
  ThemeFilterRequest,
  CreateThemeRequest,
  APIResponse,
  PaginatedResponse,
  
  // Schemas
  ThemeSchema,
  UserSchema,
  TrendDataSchema,
  ThemeFilterRequestSchema,
  CreateThemeRequestSchema,
  APIResponseSchema,
  PaginatedResponseSchema,
  
  // Constants
  ThemeCategory,
  CompetitionLevel,
  TechnicalDifficulty,
  SubscriptionTier,
  AgeGroup,
  Gender,
  IncomeLevel,
  DataSourceType,
} from './index'

import { validateData, safeParseData, validateAPIRequest } from './validation'

// =============================================================================
// EXAMPLE DATA OBJECTS
// =============================================================================

/**
 * Example Theme object
 */
export const exampleTheme: Theme = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'AI-Powered Personal Finance Assistant',
  description: 'A smart personal finance app that uses AI to provide personalized budgeting advice and investment recommendations.',
  category: ThemeCategory.FINANCE,
  monetizationScore: 87,
  marketSize: 2500000,
  competitionLevel: CompetitionLevel.MEDIUM,
  technicalDifficulty: TechnicalDifficulty.INTERMEDIATE,
  estimatedRevenue: {
    min: 10000,
    max: 100000,
  },
  dataSources: [
    {
      source: DataSourceType.GOOGLE_TRENDS,
      searchVolume: 15000,
      growthRate: 23.5,
      timestamp: '2024-01-01T00:00:00.000Z',
      metadata: {
        region: 'US',
        confidence: 0.92,
      },
    },
    {
      source: DataSourceType.REDDIT,
      searchVolume: 8500,
      growthRate: 18.2,
      timestamp: '2024-01-01T00:00:00.000Z',
      metadata: {
        subreddit: 'personalfinance',
        sentiment: 'positive',
      },
    },
  ],
  monetizationFactors: {
    marketSize: 85,
    paymentWillingness: 78,
    competitionLevel: 65,
    revenueModels: 90,
    customerAcquisitionCost: 72,
    customerLifetimeValue: 88,
  },
  revenueProjection: {
    timeframe: 'month',
    scenarios: {
      conservative: 5000,
      realistic: 15000,
      optimistic: 35000,
    },
    assumptions: [
      {
        factor: 'User acquisition rate',
        value: 500,
        confidence: 80,
        source: 'Industry benchmarks',
      },
      {
        factor: 'Conversion rate',
        value: 3.5,
        confidence: 75,
        source: 'Similar apps analysis',
      },
    ],
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

/**
 * Example User object
 */
export const exampleUser: User = {
  id: '456e7890-e89b-12d3-a456-426614174001',
  email: 'developer@example.com',
  subscriptionTier: SubscriptionTier.PRO,
  stripeCustomerId: 'cus_example123',
  preferences: {
    categories: [ThemeCategory.FINANCE, ThemeCategory.PRODUCTIVITY],
    regions: ['US', 'JP', 'UK'],
    notifications: true,
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

/**
 * Example TrendData object
 */
export const exampleTrendData: TrendData = {
  id: '789e0123-e89b-12d3-a456-426614174002',
  themeId: '123e4567-e89b-12d3-a456-426614174000',
  source: DataSourceType.GOOGLE_TRENDS,
  searchVolume: 15000,
  growthRate: 23.5,
  geographicData: {
    US: 45.2,
    JP: 23.1,
    UK: 15.7,
    DE: 10.3,
    CA: 5.7,
  },
  demographicData: {
    country: 'US',
    region: 'California',
    ageGroup: AgeGroup.AGE_25_34,
    gender: Gender.FEMALE,
    ethnicity: 'Asian',
    incomeLevel: IncomeLevel.HIGH,
  },
  timestamp: '2024-01-01T00:00:00.000Z',
  metadata: {
    confidence: 0.92,
    source_url: 'https://trends.google.com',
    keywords: ['personal finance', 'budgeting app', 'AI finance'],
  },
}

/**
 * Example API request objects
 */
export const exampleThemeFilterRequest: ThemeFilterRequest = {
  categories: [ThemeCategory.FINANCE, ThemeCategory.PRODUCTIVITY],
  competitionLevel: [CompetitionLevel.LOW, CompetitionLevel.MEDIUM],
  technicalDifficulty: [TechnicalDifficulty.BEGINNER, TechnicalDifficulty.INTERMEDIATE],
  minMonetizationScore: 70,
  maxMonetizationScore: 100,
  minMarketSize: 100000,
  countries: ['US', 'JP'],
  ageGroups: [AgeGroup.AGE_25_34, AgeGroup.AGE_35_44],
  sortBy: 'monetizationScore',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
}

export const exampleCreateThemeRequest: CreateThemeRequest = {
  title: 'Smart Home Energy Management',
  description: 'An IoT-based system for optimizing home energy consumption using machine learning.',
  category: ThemeCategory.PRODUCTIVITY,
  technicalDifficulty: TechnicalDifficulty.ADVANCED,
  estimatedRevenue: {
    min: 20000,
    max: 200000,
  },
}

/**
 * Example API response objects
 */
export const exampleAPIResponse: APIResponse<Theme> = {
  data: exampleTheme,
  message: 'Theme retrieved successfully',
  timestamp: '2024-01-01T00:00:00.000Z',
}

export const examplePaginatedResponse: PaginatedResponse<Theme> = {
  data: [exampleTheme],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
  message: 'Themes retrieved successfully',
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/**
 * Example: Validating theme data
 */
export function validateThemeExample() {
  // Valid theme validation
  const validResult = validateData(ThemeSchema, exampleTheme)
  if (validResult.success) {
    console.log('Theme is valid:', validResult.data.title)
  }

  // Invalid theme validation
  const invalidTheme = {
    ...exampleTheme,
    monetizationScore: 150, // Invalid: score > 100
    email: 'invalid-email', // Invalid: not an email field
  }

  const invalidResult = validateData(ThemeSchema, invalidTheme)
  if (!invalidResult.success) {
    console.log('Validation errors:', invalidResult.errors)
  }
}

/**
 * Example: Safe parsing with fallback
 */
export function safeParsingExample() {
  const unknownData = {
    id: 'maybe-valid-uuid',
    title: 'Some Theme',
    // ... other fields might be missing or invalid
  }

  const parsedTheme = safeParseData(ThemeSchema, unknownData)
  if (parsedTheme) {
    console.log('Successfully parsed theme:', parsedTheme.title)
  } else {
    console.log('Failed to parse theme, using default values')
    // Handle fallback logic here
  }
}

/**
 * Example: API request validation
 */
export function apiRequestValidationExample() {
  try {
    const requestData = {
      categories: ['finance', 'invalid-category'], // One invalid category
      minMonetizationScore: -10, // Invalid: negative score
      page: 0, // Invalid: page must be >= 1
    }

    const validatedRequest = validateAPIRequest(
      ThemeFilterRequestSchema,
      requestData
    )
    console.log('Request is valid:', validatedRequest)
  } catch (error) {
    console.log('API request validation failed:', error)
  }
}

/**
 * Example: Type-safe database operations
 */
export function typeSafeDatabaseExample() {
  // Type-safe theme creation
  function createTheme(themeData: CreateThemeRequest): Promise<Theme> {
    // Validate input
    const validation = validateData(CreateThemeRequestSchema, themeData)
    if (!validation.success) {
      throw new Error(`Invalid theme data: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    // In a real implementation, this would save to database
    const newTheme: Theme = {
      id: crypto.randomUUID(),
      ...validation.data,
      monetizationScore: 0, // Will be calculated later
      marketSize: 0, // Will be calculated later
      competitionLevel: CompetitionLevel.MEDIUM, // Default value
      dataSources: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return Promise.resolve(newTheme)
  }

  // Usage
  createTheme(exampleCreateThemeRequest)
    .then(theme => console.log('Created theme:', theme.title))
    .catch(error => console.error('Failed to create theme:', error))
}

/**
 * Example: Working with constants and enums
 */
export function constantsExample() {
  // Type-safe category checking
  function isFinanceTheme(theme: Theme): boolean {
    return theme.category === ThemeCategory.FINANCE
  }

  // Type-safe filtering
  function filterThemesByDifficulty(
    themes: Theme[],
    difficulty: TechnicalDifficulty
  ): Theme[] {
    return themes.filter(theme => theme.technicalDifficulty === difficulty)
  }

  // Usage
  const themes = [exampleTheme]
  const financeThemes = themes.filter(isFinanceTheme)
  const beginnerThemes = filterThemesByDifficulty(themes, TechnicalDifficulty.BEGINNER)

  console.log('Finance themes:', financeThemes.length)
  console.log('Beginner themes:', beginnerThemes.length)
}

/**
 * Example: Building API responses
 */
export function apiResponseExample() {
  // Create a type-safe API response
  function createSuccessResponse<T>(data: T, message?: string): APIResponse<T> {
    return {
      data,
      message: message || 'Success',
      timestamp: new Date().toISOString(),
    }
  }

  function createErrorResponse(error: string): APIResponse<null> {
    return {
      data: null,
      error,
      timestamp: new Date().toISOString(),
    }
  }

  // Usage
  const successResponse = createSuccessResponse(exampleTheme, 'Theme retrieved')
  const errorResponse = createErrorResponse('Theme not found')

  console.log('Success response:', successResponse)
  console.log('Error response:', errorResponse)
}

/**
 * Example: Demographic data analysis
 */
export function demographicAnalysisExample() {
  const demographicData: DemographicData = {
    country: 'US',
    region: 'California',
    ageGroup: AgeGroup.AGE_25_34,
    gender: Gender.FEMALE,
    incomeLevel: IncomeLevel.HIGH,
  }

  // Type-safe demographic filtering
  function filterByDemographics(
    trendData: TrendData[],
    targetDemographic: Partial<DemographicData>
  ): TrendData[] {
    return trendData.filter(data => {
      if (!data.demographicData) return false
      
      return Object.entries(targetDemographic).every(([key, value]) => {
        return data.demographicData![key as keyof DemographicData] === value
      })
    })
  }

  // Usage
  const trendDataList = [exampleTrendData]
  const highIncomeData = filterByDemographics(trendDataList, {
    incomeLevel: IncomeLevel.HIGH,
  })

  console.log('High income trend data:', highIncomeData.length)
}

// =============================================================================
// EXPORT ALL EXAMPLES
// =============================================================================

export const examples = {
  validateThemeExample,
  safeParsingExample,
  apiRequestValidationExample,
  typeSafeDatabaseExample,
  constantsExample,
  apiResponseExample,
  demographicAnalysisExample,
}

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('Running type definition examples...\n')
  
  Object.entries(examples).forEach(([name, example]) => {
    console.log(`--- ${name} ---`)
    try {
      example()
    } catch (error) {
      console.error('Example failed:', error)
    }
    console.log('')
  })
}