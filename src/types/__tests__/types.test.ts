import {
  ThemeSchema,
  UserSchema,
  TrendDataSchema,
  DemographicDataSchema,
  ThemeFilterRequestSchema,
  CreateThemeRequestSchema,
  UserRegistrationRequestSchema,
  UserLoginRequestSchema,
  CreateAlertRequestSchema,
  APIResponseSchema,
  PaginatedResponseSchema,
  ThemeCategory,
  CompetitionLevel,
  TechnicalDifficulty,
  SubscriptionTier,
  AgeGroup,
  Gender,
  IncomeLevel,
  DataSourceType,
} from '../index'

import {
  validateData,
  safeParseData,
  createAPIError,
  validateAPIRequest,
  isThemeCategory,
  isCompetitionLevel,
  isTechnicalDifficulty,
  isValidUUID,
  isValidEmail,
  isValidURL,
  validatePaginationParams,
  normalizeThemeTitle,
} from '../validation'

describe('Type Definitions and Schemas', () => {
  describe('Theme Schema', () => {
    it('should validate a valid theme object', () => {
      const validTheme = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'AI-Powered Task Manager',
        description: 'A smart task management app with AI recommendations',
        category: 'productivity' as const,
        monetizationScore: 85,
        marketSize: 1000000,
        competitionLevel: 'medium' as const,
        technicalDifficulty: 'intermediate' as const,
        estimatedRevenue: {
          min: 5000,
          max: 50000,
        },
        dataSources: [
          {
            source: 'google_trends' as const,
            searchVolume: 10000,
            growthRate: 15.5,
            timestamp: '2024-01-01T00:00:00.000Z',
          },
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const result = validateData(ThemeSchema, validTheme)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('AI-Powered Task Manager')
        expect(result.data.monetizationScore).toBe(85)
      }
    })

    it('should reject invalid theme object', () => {
      const invalidTheme = {
        id: 'invalid-uuid',
        title: '', // Empty title should fail
        category: 'invalid-category',
        monetizationScore: 150, // Score > 100 should fail
      }

      const result = validateData(ThemeSchema, invalidTheme)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors.some(e => e.field.includes('title'))).toBe(true)
        expect(result.errors.some(e => e.field.includes('monetizationScore'))).toBe(true)
      }
    })
  })

  describe('User Schema', () => {
    it('should validate a valid user object', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        subscriptionTier: 'basic' as const,
        stripeCustomerId: 'cus_test123',
        preferences: {
          categories: ['productivity', 'health'] as const,
          regions: ['US', 'JP'],
          notifications: true,
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const result = validateData(UserSchema, validUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
        expect(result.data.subscriptionTier).toBe('basic')
      }
    })

    it('should reject invalid email', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'invalid-email',
        subscriptionTier: 'basic' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const result = validateData(UserSchema, invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.field === 'email')).toBe(true)
      }
    })
  })

  describe('TrendData Schema', () => {
    it('should validate a valid trend data object', () => {
      const validTrendData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        themeId: '123e4567-e89b-12d3-a456-426614174001',
        source: 'google_trends' as const,
        searchVolume: 5000,
        growthRate: 12.5,
        geographicData: {
          US: 45.2,
          JP: 23.1,
          UK: 15.7,
        },
        demographicData: {
          country: 'US',
          ageGroup: '25-34' as const,
          gender: 'female' as const,
          incomeLevel: 'middle' as const,
        },
        timestamp: '2024-01-01T00:00:00.000Z',
        metadata: {
          confidence: 0.85,
          source_url: 'https://trends.google.com',
        },
      }

      const result = validateData(TrendDataSchema, validTrendData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.source).toBe('google_trends')
        expect(result.data.searchVolume).toBe(5000)
      }
    })
  })

  describe('DemographicData Schema', () => {
    it('should validate a valid demographic data object', () => {
      const validDemographicData = {
        country: 'US',
        region: 'California',
        ageGroup: '25-34' as const,
        gender: 'other' as const,
        ethnicity: 'Asian',
        incomeLevel: 'high' as const,
      }

      const result = validateData(DemographicDataSchema, validDemographicData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.country).toBe('US')
        expect(result.data.ageGroup).toBe('25-34')
      }
    })
  })

  describe('API Request Schemas', () => {
    it('should validate theme filter request', () => {
      const validRequest = {
        categories: ['productivity', 'health'] as const,
        competitionLevel: ['low', 'medium'] as const,
        minMonetizationScore: 70,
        maxMonetizationScore: 100,
        sortBy: 'monetizationScore' as const,
        sortOrder: 'desc' as const,
        page: 1,
        limit: 20,
      }

      const result = validateData(ThemeFilterRequestSchema, validRequest)
      expect(result.success).toBe(true)
    })

    it('should validate create theme request', () => {
      const validRequest = {
        title: 'New Theme',
        description: 'A new theme description',
        category: 'productivity' as const,
        technicalDifficulty: 'beginner' as const,
        estimatedRevenue: {
          min: 1000,
          max: 10000,
        },
      }

      const result = validateData(CreateThemeRequestSchema, validRequest)
      expect(result.success).toBe(true)
    })

    it('should validate user registration request', () => {
      const validRequest = {
        email: 'newuser@example.com',
        password: 'securepassword123',
        preferences: {
          categories: ['productivity'] as const,
          notifications: true,
        },
      }

      const result = validateData(UserRegistrationRequestSchema, validRequest)
      expect(result.success).toBe(true)
    })

    it('should validate user login request', () => {
      const validRequest = {
        email: 'user@example.com',
        password: 'password123',
      }

      const result = validateData(UserLoginRequestSchema, validRequest)
      expect(result.success).toBe(true)
    })

    it('should validate create alert request', () => {
      const validRequest = {
        themeId: '123e4567-e89b-12d3-a456-426614174000',
        alertType: 'score_change' as const,
        thresholdValue: 80,
        conditions: {
          minIncrease: 10,
        },
      }

      const result = validateData(CreateAlertRequestSchema, validRequest)
      expect(result.success).toBe(true)
    })
  })

  describe('API Response Schemas', () => {
    it('should validate API response', () => {
      const ThemeAPIResponseSchema = APIResponseSchema(ThemeSchema)
      const validResponse = {
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Theme',
          description: 'Test description',
          category: 'productivity' as const,
          monetizationScore: 75,
          marketSize: 500000,
          competitionLevel: 'low' as const,
          technicalDifficulty: 'beginner' as const,
          estimatedRevenue: {
            min: 2000,
            max: 20000,
          },
          dataSources: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        message: 'Success',
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      const result = validateData(ThemeAPIResponseSchema, validResponse)
      expect(result.success).toBe(true)
    })

    it('should validate paginated response', () => {
      const ThemePaginatedResponseSchema = PaginatedResponseSchema(ThemeSchema)
      const validResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      }

      const result = validateData(ThemePaginatedResponseSchema, validResponse)
      expect(result.success).toBe(true)
    })
  })
})

describe('Validation Utilities', () => {
  describe('validateData', () => {
    it('should return success for valid data', () => {
      const result = validateData(UserLoginRequestSchema, {
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
      }
    })

    it('should return errors for invalid data', () => {
      const result = validateData(UserLoginRequestSchema, {
        email: 'invalid-email',
        password: '',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })
  })

  describe('safeParseData', () => {
    it('should return parsed data for valid input', () => {
      const result = safeParseData(UserLoginRequestSchema, {
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).not.toBeNull()
      expect(result?.email).toBe('test@example.com')
    })

    it('should return null for invalid input', () => {
      const result = safeParseData(UserLoginRequestSchema, {
        email: 'invalid-email',
      })

      expect(result).toBeNull()
    })
  })

  describe('createAPIError', () => {
    it('should create properly formatted API error', () => {
      const error = createAPIError('VALIDATION_ERROR', 'Test error', [
        { field: 'email', message: 'Invalid email', code: 'invalid_email' },
      ])

      expect(error.error.code).toBe('VALIDATION_ERROR')
      expect(error.error.message).toBe('Test error')
      expect(error.error.details).toHaveLength(1)
      expect(error.error.timestamp).toBeDefined()
    })
  })

  describe('Type Guards', () => {
    it('should correctly identify theme categories', () => {
      expect(isThemeCategory('productivity')).toBe(true)
      expect(isThemeCategory('invalid')).toBe(false)
    })

    it('should correctly identify competition levels', () => {
      expect(isCompetitionLevel('low')).toBe(true)
      expect(isCompetitionLevel('invalid')).toBe(false)
    })

    it('should correctly identify technical difficulties', () => {
      expect(isTechnicalDifficulty('beginner')).toBe(true)
      expect(isTechnicalDifficulty('invalid')).toBe(false)
    })
  })

  describe('Utility Functions', () => {
    it('should validate UUIDs correctly', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(isValidUUID('invalid-uuid')).toBe(false)
    })

    it('should validate emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('invalid-email')).toBe(false)
    })

    it('should validate URLs correctly', () => {
      expect(isValidURL('https://example.com')).toBe(true)
      expect(isValidURL('invalid-url')).toBe(false)
    })

    it('should validate pagination parameters', () => {
      const result = validatePaginationParams(2, 50)
      expect(result.page).toBe(2)
      expect(result.limit).toBe(50)

      const resultWithDefaults = validatePaginationParams()
      expect(resultWithDefaults.page).toBe(1)
      expect(resultWithDefaults.limit).toBe(20)

      const resultWithInvalid = validatePaginationParams(-1, 200)
      expect(resultWithInvalid.page).toBe(1)
      expect(resultWithInvalid.limit).toBe(20)
    })

    it('should normalize theme titles', () => {
      expect(normalizeThemeTitle('  Multiple   Spaces  ')).toBe('Multiple Spaces')
      expect(normalizeThemeTitle('Normal Title')).toBe('Normal Title')
    })
  })
})

describe('Constants and Enums', () => {
  it('should have correct theme categories', () => {
    expect(ThemeCategory.PRODUCTIVITY).toBe('productivity')
    expect(ThemeCategory.ENTERTAINMENT).toBe('entertainment')
    expect(ThemeCategory.EDUCATION).toBe('education')
    expect(ThemeCategory.HEALTH).toBe('health')
    expect(ThemeCategory.FINANCE).toBe('finance')
    expect(ThemeCategory.SOCIAL).toBe('social')
  })

  it('should have correct competition levels', () => {
    expect(CompetitionLevel.LOW).toBe('low')
    expect(CompetitionLevel.MEDIUM).toBe('medium')
    expect(CompetitionLevel.HIGH).toBe('high')
  })

  it('should have correct technical difficulties', () => {
    expect(TechnicalDifficulty.BEGINNER).toBe('beginner')
    expect(TechnicalDifficulty.INTERMEDIATE).toBe('intermediate')
    expect(TechnicalDifficulty.ADVANCED).toBe('advanced')
  })

  it('should have correct subscription tiers', () => {
    expect(SubscriptionTier.FREE).toBe('free')
    expect(SubscriptionTier.BASIC).toBe('basic')
    expect(SubscriptionTier.PRO).toBe('pro')
  })

  it('should have correct age groups', () => {
    expect(AgeGroup.AGE_18_24).toBe('18-24')
    expect(AgeGroup.AGE_25_34).toBe('25-34')
    expect(AgeGroup.AGE_35_44).toBe('35-44')
    expect(AgeGroup.AGE_45_54).toBe('45-54')
    expect(AgeGroup.AGE_55_64).toBe('55-64')
    expect(AgeGroup.AGE_65_PLUS).toBe('65+')
  })

  it('should have correct genders', () => {
    expect(Gender.MALE).toBe('male')
    expect(Gender.FEMALE).toBe('female')
    expect(Gender.OTHER).toBe('other')
    expect(Gender.PREFER_NOT_TO_SAY).toBe('prefer_not_to_say')
  })

  it('should have correct income levels', () => {
    expect(IncomeLevel.LOW).toBe('low')
    expect(IncomeLevel.MIDDLE).toBe('middle')
    expect(IncomeLevel.HIGH).toBe('high')
    expect(IncomeLevel.PREMIUM).toBe('premium')
  })

  it('should have correct data source types', () => {
    expect(DataSourceType.GOOGLE_TRENDS).toBe('google_trends')
    expect(DataSourceType.REDDIT).toBe('reddit')
    expect(DataSourceType.TWITTER).toBe('twitter')
    expect(DataSourceType.PRODUCT_HUNT).toBe('product_hunt')
    expect(DataSourceType.GITHUB).toBe('github')
  })
})