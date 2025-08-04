import { z } from 'zod'

// =============================================================================
// ENUMS AND CONSTANTS
// =============================================================================

export const ThemeCategory = {
  PRODUCTIVITY: 'productivity',
  ENTERTAINMENT: 'entertainment',
  EDUCATION: 'education',
  HEALTH: 'health',
  FINANCE: 'finance',
  SOCIAL: 'social',
} as const

export const CompetitionLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

export const TechnicalDifficulty = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const

export const SubscriptionTier = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
} as const

export const AgeGroup = {
  AGE_18_24: '18-24',
  AGE_25_34: '25-34',
  AGE_35_44: '35-44',
  AGE_45_54: '45-54',
  AGE_55_64: '55-64',
  AGE_65_PLUS: '65+',
} as const

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
} as const

export const IncomeLevel = {
  LOW: 'low',
  MIDDLE: 'middle',
  HIGH: 'high',
  PREMIUM: 'premium',
} as const

export const DataSourceType = {
  GOOGLE_TRENDS: 'google_trends',
  REDDIT: 'reddit',
  TWITTER: 'twitter',
  PRODUCT_HUNT: 'product_hunt',
  GITHUB: 'github',
} as const

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

// Basic validation schemas
export const ThemeCategorySchema = z.enum([
  'productivity',
  'entertainment',
  'education',
  'health',
  'finance',
  'social',
])

export const CompetitionLevelSchema = z.enum(['low', 'medium', 'high'])

export const TechnicalDifficultySchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
])

export const SubscriptionTierSchema = z.enum(['free', 'basic', 'pro'])

export const AgeGroupSchema = z.enum([
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+',
])

export const GenderSchema = z.enum([
  'male',
  'female',
  'other',
  'prefer_not_to_say',
])

export const IncomeLevelSchema = z.enum(['low', 'middle', 'high', 'premium'])

export const DataSourceTypeSchema = z.enum([
  'google_trends',
  'reddit',
  'twitter',
  'product_hunt',
  'github',
])

// Data Source Schema
export const DataSourceSchema = z.object({
  source: DataSourceTypeSchema,
  searchVolume: z.number().min(0),
  growthRate: z.number(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
})

// Monetization Factors Schema
export const MonetizationFactorsSchema = z.object({
  marketSize: z.number().min(0).max(100),
  paymentWillingness: z.number().min(0).max(100),
  competitionLevel: z.number().min(0).max(100),
  revenueModels: z.number().min(0).max(100),
  customerAcquisitionCost: z.number().min(0).max(100),
  customerLifetimeValue: z.number().min(0).max(100),
})

// Revenue Projection Schema
export const RevenueProjectionSchema = z.object({
  timeframe: z.enum(['month', 'quarter', 'year']),
  scenarios: z.object({
    conservative: z.number().min(0),
    realistic: z.number().min(0),
    optimistic: z.number().min(0),
  }),
  assumptions: z.array(
    z.object({
      factor: z.string(),
      value: z.number(),
      confidence: z.number().min(0).max(100),
      source: z.string(),
    })
  ),
})

// Theme Schema
export const ThemeSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000),
  category: ThemeCategorySchema,
  monetizationScore: z.number().min(0).max(100),
  marketSize: z.number().min(0),
  competitionLevel: CompetitionLevelSchema,
  technicalDifficulty: TechnicalDifficultySchema,
  estimatedRevenue: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }),
  dataSources: z.array(DataSourceSchema),
  monetizationFactors: MonetizationFactorsSchema.optional(),
  revenueProjection: RevenueProjectionSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// User Schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  subscriptionTier: SubscriptionTierSchema,
  stripeCustomerId: z.string().optional(),
  preferences: z
    .object({
      categories: z.array(ThemeCategorySchema).optional(),
      regions: z.array(z.string()).optional(),
      notifications: z.boolean().default(true),
    })
    .optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// Demographic Data Schema
export const DemographicDataSchema = z.object({
  country: z.string().min(2).max(3), // ISO country codes
  region: z.string().optional(),
  ageGroup: AgeGroupSchema,
  gender: GenderSchema,
  ethnicity: z.string().optional(),
  incomeLevel: IncomeLevelSchema,
})

// Trend Data Schema
export const TrendDataSchema = z.object({
  id: z.string().uuid(),
  themeId: z.string().uuid(),
  source: DataSourceTypeSchema,
  searchVolume: z.number().min(0),
  growthRate: z.number(),
  geographicData: z.record(z.number()).optional(),
  demographicData: DemographicDataSchema.optional(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
})

// Competitor Analysis Schema
export const CompetitorAnalysisSchema = z.object({
  id: z.string().uuid(),
  themeId: z.string().uuid(),
  competitorName: z.string().min(1).max(255),
  competitorUrl: z.string().url().optional(),
  pricingModel: z.string().max(100).optional(),
  estimatedRevenue: z.number().min(0).optional(),
  userCount: z.number().min(0).optional(),
  features: z.array(z.string()).optional(),
  marketShare: z.number().min(0).max(100).optional(),
  createdAt: z.string().datetime(),
})

// User Alert Schema
export const UserAlertSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  themeId: z.string().uuid().optional(),
  alertType: z.enum([
    'new_theme',
    'score_change',
    'competition_change',
    'market_opportunity',
  ]),
  thresholdValue: z.number().optional(),
  conditions: z.record(z.unknown()).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
})

// Subscription Schema
export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  stripeSubscriptionId: z.string(),
  planName: z.string().max(50),
  status: z.enum([
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'trialing',
    'unpaid',
  ]),
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// =============================================================================
// API REQUEST/RESPONSE SCHEMAS
// =============================================================================

// Generic API Response Schema
export const APIResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    error: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string().datetime().optional(),
  })

// Paginated Response Schema
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number().min(1),
      limit: z.number().min(1).max(100),
      total: z.number().min(0),
      totalPages: z.number().min(0),
    }),
    error: z.string().optional(),
    message: z.string().optional(),
  })

// Theme Filter Request Schema
export const ThemeFilterRequestSchema = z.object({
  categories: z.array(ThemeCategorySchema).optional(),
  competitionLevel: z.array(CompetitionLevelSchema).optional(),
  technicalDifficulty: z.array(TechnicalDifficultySchema).optional(),
  minMonetizationScore: z.number().min(0).max(100).optional(),
  maxMonetizationScore: z.number().min(0).max(100).optional(),
  minMarketSize: z.number().min(0).optional(),
  maxMarketSize: z.number().min(0).optional(),
  countries: z.array(z.string()).optional(),
  ageGroups: z.array(AgeGroupSchema).optional(),
  sortBy: z
    .enum([
      'monetizationScore',
      'marketSize',
      'createdAt',
      'updatedAt',
      'title',
    ])
    .default('monetizationScore'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// Theme Creation Request Schema
export const CreateThemeRequestSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000),
  category: ThemeCategorySchema,
  technicalDifficulty: TechnicalDifficultySchema,
  estimatedRevenue: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }),
})

// User Registration Request Schema
export const UserRegistrationRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  preferences: z
    .object({
      categories: z.array(ThemeCategorySchema).optional(),
      regions: z.array(z.string()).optional(),
      notifications: z.boolean().default(true),
    })
    .optional(),
})

// User Login Request Schema
export const UserLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Alert Creation Request Schema
export const CreateAlertRequestSchema = z.object({
  themeId: z.string().uuid().optional(),
  alertType: z.enum([
    'new_theme',
    'score_change',
    'competition_change',
    'market_opportunity',
  ]),
  thresholdValue: z.number().optional(),
  conditions: z.record(z.any()).optional(),
})

// =============================================================================
// TYPE EXPORTS (inferred from schemas)
// =============================================================================

export type ThemeCategory = z.infer<typeof ThemeCategorySchema>
export type CompetitionLevel = z.infer<typeof CompetitionLevelSchema>
export type TechnicalDifficulty = z.infer<typeof TechnicalDifficultySchema>
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>
export type AgeGroup = z.infer<typeof AgeGroupSchema>
export type Gender = z.infer<typeof GenderSchema>
export type IncomeLevel = z.infer<typeof IncomeLevelSchema>
export type DataSourceType = z.infer<typeof DataSourceTypeSchema>

export type DataSource = z.infer<typeof DataSourceSchema>
export type MonetizationFactors = z.infer<typeof MonetizationFactorsSchema>
export type RevenueProjection = z.infer<typeof RevenueProjectionSchema>
export type Theme = z.infer<typeof ThemeSchema>
export type User = z.infer<typeof UserSchema>
export type DemographicData = z.infer<typeof DemographicDataSchema>
export type TrendData = z.infer<typeof TrendDataSchema>
export type CompetitorAnalysis = z.infer<typeof CompetitorAnalysisSchema>
export type UserAlert = z.infer<typeof UserAlertSchema>
export type Subscription = z.infer<typeof SubscriptionSchema>

// API Types
export type APIResponse<T> = {
  data: T
  error?: string
  message?: string
  timestamp?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
  message?: string
}

export type ThemeFilterRequest = z.infer<typeof ThemeFilterRequestSchema>
export type CreateThemeRequest = z.infer<typeof CreateThemeRequestSchema>
export type UserRegistrationRequest = z.infer<
  typeof UserRegistrationRequestSchema
>
export type UserLoginRequest = z.infer<typeof UserLoginRequestSchema>
export type CreateAlertRequest = z.infer<typeof CreateAlertRequestSchema>

// =============================================================================
// UTILITY TYPES
// =============================================================================

// Database table types (for Supabase)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: Omit<User, 'preferences'> & { preferences: any }
        Insert: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
          preferences?: any
        }
        Update: Partial<
          Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { preferences?: any }
        >
      }
      themes: {
        Row: Omit<Theme, 'monetizationFactors' | 'revenueProjection'> & {
          monetizationFactors: any
          revenueProjection: any
        }
        Insert: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'> & {
          monetizationFactors?: any
          revenueProjection?: any
        }
        Update: Partial<
          Omit<Theme, 'id' | 'createdAt' | 'updatedAt'> & {
            monetizationFactors?: any
            revenueProjection?: any
          }
        >
      }
      trend_data: {
        Row: Omit<TrendData, 'geographicData' | 'demographicData' | 'metadata'> & {
          geographicData: any
          demographicData: any
          metadata: any
        }
        Insert: Omit<TrendData, 'id'> & {
          geographicData?: any
          demographicData?: any
          metadata?: any
        }
        Update: Partial<
          Omit<TrendData, 'id'> & {
            geographicData?: any
            demographicData?: any
            metadata?: any
          }
        >
      }
      competitor_analysis: {
        Row: Omit<CompetitorAnalysis, 'features'> & { features: any }
        Insert: Omit<CompetitorAnalysis, 'id' | 'createdAt'> & {
          features?: any
        }
        Update: Partial<
          Omit<CompetitorAnalysis, 'id' | 'createdAt'> & { features?: any }
        >
      }
      user_alerts: {
        Row: Omit<UserAlert, 'conditions'> & { conditions: any }
        Insert: Omit<UserAlert, 'id' | 'createdAt'> & { conditions?: any }
        Update: Partial<
          Omit<UserAlert, 'id' | 'createdAt'> & { conditions?: any }
        >
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>>
      }
    }
  }
}

// Error types
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface APIError {
  error: {
    code: string
    message: string
    details?: ValidationError[]
    timestamp: string
  }
}
