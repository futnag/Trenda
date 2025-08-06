import { z } from 'zod'
import { ThemeSchema, DemographicDataSchema, AgeGroupSchema, GenderSchema, IncomeLevelSchema } from './index'

// =============================================================================
// REGIONAL ANALYSIS TYPES
// =============================================================================

// Country and region definitions
export const CountryCode = {
  US: 'US',
  JP: 'JP',
  GB: 'GB',
  DE: 'DE',
  FR: 'FR',
  CA: 'CA',
  AU: 'AU',
  KR: 'KR',
  CN: 'CN',
  IN: 'IN',
  BR: 'BR',
  MX: 'MX',
  IT: 'IT',
  ES: 'ES',
  NL: 'NL',
  SE: 'SE',
  NO: 'NO',
  DK: 'DK',
  FI: 'FI',
  CH: 'CH',
  AT: 'AT',
  BE: 'BE',
  IE: 'IE',
  PT: 'PT',
  GR: 'GR',
  PL: 'PL',
  CZ: 'CZ',
  HU: 'HU',
  RO: 'RO',
  BG: 'BG',
  HR: 'HR',
  SK: 'SK',
  SI: 'SI',
  LT: 'LT',
  LV: 'LV',
  EE: 'EE',
  MT: 'MT',
  CY: 'CY',
  LU: 'LU',
} as const

export const CountryCodeSchema = z.enum([
  'US', 'JP', 'GB', 'DE', 'FR', 'CA', 'AU', 'KR', 'CN', 'IN',
  'BR', 'MX', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI', 'CH',
  'AT', 'BE', 'IE', 'PT', 'GR', 'PL', 'CZ', 'HU', 'RO', 'BG',
  'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'MT', 'CY', 'LU'
])

// Regional trend data
export const RegionalTrendSchema = z.object({
  region: CountryCodeSchema,
  regionName: z.string(),
  themes: z.array(ThemeSchema),
  marketPotential: z.number().min(0).max(100),
  competitionLevel: z.enum(['low', 'medium', 'high']),
  localizedOpportunities: z.array(z.object({
    theme: z.string(),
    localNeed: z.string(),
    marketGap: z.number().min(0).max(100),
    culturalFactors: z.array(z.string()),
    regulatoryConsiderations: z.array(z.string()),
    estimatedRevenue: z.object({
      min: z.number().min(0),
      max: z.number().min(0),
    }),
  })),
  demographics: z.object({
    totalPopulation: z.number().min(0),
    internetPenetration: z.number().min(0).max(100),
    mobileUsage: z.number().min(0).max(100),
    averageIncome: z.number().min(0),
    techAdoption: z.number().min(0).max(100),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// Localized opportunity
export const LocalizedOpportunitySchema = z.object({
  id: z.string().uuid(),
  themeId: z.string().uuid(),
  region: CountryCodeSchema,
  theme: z.string(),
  localNeed: z.string(),
  marketGap: z.number().min(0).max(100),
  culturalFactors: z.array(z.string()),
  regulatoryConsiderations: z.array(z.string()),
  estimatedRevenue: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }),
  confidence: z.number().min(0).max(100),
  dataSource: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// Regional comparison data
export const RegionalComparisonSchema = z.object({
  regions: z.array(CountryCodeSchema),
  themes: z.array(z.object({
    themeId: z.string().uuid(),
    title: z.string(),
    regionalData: z.record(CountryCodeSchema, z.object({
      marketPotential: z.number().min(0).max(100),
      competitionLevel: z.enum(['low', 'medium', 'high']),
      searchVolume: z.number().min(0),
      growthRate: z.number(),
      estimatedRevenue: z.object({
        min: z.number().min(0),
        max: z.number().min(0),
      }),
    })),
  })),
  comparisonMetrics: z.object({
    bestRegion: CountryCodeSchema,
    worstRegion: CountryCodeSchema,
    averageMarketPotential: z.number().min(0).max(100),
    totalMarketSize: z.number().min(0),
  }),
  createdAt: z.string().datetime(),
})

// =============================================================================
// DEMOGRAPHIC FILTERING TYPES
// =============================================================================

// Multi-dimensional filter
export const DemographicFilterSchema = z.object({
  countries: z.array(CountryCodeSchema).optional(),
  regions: z.array(z.string()).optional(),
  ageGroups: z.array(AgeGroupSchema).optional(),
  genders: z.array(GenderSchema).optional(),
  ethnicities: z.array(z.string()).optional(),
  incomeLevels: z.array(IncomeLevelSchema).optional(),
  languages: z.array(z.string()).optional(),
  urbanRural: z.enum(['urban', 'rural', 'both']).optional(),
  educationLevel: z.array(z.enum(['high_school', 'bachelor', 'master', 'phd', 'other'])).optional(),
  occupation: z.array(z.string()).optional(),
})

// Cross-analysis result
export const CrossAnalysisSchema = z.object({
  segments: z.array(z.object({
    segmentId: z.string(),
    name: z.string(),
    description: z.string(),
    demographics: DemographicDataSchema,
    themes: z.array(z.object({
      themeId: z.string().uuid(),
      title: z.string(),
      relevanceScore: z.number().min(0).max(100),
      marketPotential: z.number().min(0).max(100),
      competitionLevel: z.enum(['low', 'medium', 'high']),
      estimatedRevenue: z.object({
        min: z.number().min(0),
        max: z.number().min(0),
      }),
    })),
    totalMarketSize: z.number().min(0),
    averageRelevance: z.number().min(0).max(100),
  })),
  comparisons: z.array(z.object({
    segmentA: z.string(),
    segmentB: z.string(),
    differences: z.array(z.object({
      metric: z.string(),
      valueA: z.number(),
      valueB: z.number(),
      significance: z.number().min(0).max(100),
    })),
    recommendations: z.array(z.string()),
  })),
  insights: z.array(z.object({
    type: z.enum(['opportunity', 'risk', 'trend', 'recommendation']),
    title: z.string(),
    description: z.string(),
    confidence: z.number().min(0).max(100),
    impact: z.enum(['low', 'medium', 'high']),
    actionable: z.boolean(),
  })),
  createdAt: z.string().datetime(),
})

// Filter state for persistence
export const FilterStateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  filters: DemographicFilterSchema,
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  usageCount: z.number().min(0).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// =============================================================================
// API REQUEST/RESPONSE SCHEMAS
// =============================================================================

// Regional analysis request
export const RegionalAnalysisRequestSchema = z.object({
  regions: z.array(CountryCodeSchema).min(1).max(10),
  themeIds: z.array(z.string().uuid()).optional(),
  categories: z.array(z.string()).optional(),
  includeOpportunities: z.boolean().default(true),
  includeDemographics: z.boolean().default(true),
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
})

// Demographic filter request
export const DemographicFilterRequestSchema = z.object({
  filters: DemographicFilterSchema,
  themeIds: z.array(z.string().uuid()).optional(),
  categories: z.array(z.string()).optional(),
  includeComparisons: z.boolean().default(false),
  includeInsights: z.boolean().default(true),
  sortBy: z.enum(['relevance', 'market_potential', 'competition', 'revenue']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// Save filter state request
export const SaveFilterStateRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filters: DemographicFilterSchema,
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
})

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CountryCode = z.infer<typeof CountryCodeSchema>
export type RegionalTrend = z.infer<typeof RegionalTrendSchema>
export type LocalizedOpportunity = z.infer<typeof LocalizedOpportunitySchema>
export type RegionalComparison = z.infer<typeof RegionalComparisonSchema>
export type DemographicFilter = z.infer<typeof DemographicFilterSchema>
export type CrossAnalysis = z.infer<typeof CrossAnalysisSchema>
export type FilterState = z.infer<typeof FilterStateSchema>

// API Types
export type RegionalAnalysisRequest = z.infer<typeof RegionalAnalysisRequestSchema>
export type DemographicFilterRequest = z.infer<typeof DemographicFilterRequestSchema>
export type SaveFilterStateRequest = z.infer<typeof SaveFilterStateRequestSchema>

// =============================================================================
// UTILITY CONSTANTS
// =============================================================================

export const COUNTRY_NAMES: Record<CountryCode, string> = {
  US: 'United States',
  JP: 'Japan',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  CA: 'Canada',
  AU: 'Australia',
  KR: 'South Korea',
  CN: 'China',
  IN: 'India',
  BR: 'Brazil',
  MX: 'Mexico',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  IE: 'Ireland',
  PT: 'Portugal',
  GR: 'Greece',
  PL: 'Poland',
  CZ: 'Czech Republic',
  HU: 'Hungary',
  RO: 'Romania',
  BG: 'Bulgaria',
  HR: 'Croatia',
  SK: 'Slovakia',
  SI: 'Slovenia',
  LT: 'Lithuania',
  LV: 'Latvia',
  EE: 'Estonia',
  MT: 'Malta',
  CY: 'Cyprus',
  LU: 'Luxembourg',
}

export const MAJOR_REGIONS: CountryCode[] = ['US', 'JP', 'GB', 'DE', 'FR', 'CA', 'AU', 'KR', 'CN', 'IN']

export const EUROPEAN_COUNTRIES: CountryCode[] = [
  'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI',
  'CH', 'AT', 'BE', 'IE', 'PT', 'GR', 'PL', 'CZ', 'HU', 'RO',
  'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'MT', 'CY', 'LU'
]

export const ASIAN_COUNTRIES: CountryCode[] = ['JP', 'KR', 'CN', 'IN']

export const NORTH_AMERICAN_COUNTRIES: CountryCode[] = ['US', 'CA', 'MX']

export const DEFAULT_DEMOGRAPHIC_FILTERS: DemographicFilter = {
  countries: MAJOR_REGIONS,
  ageGroups: ['25-34', '35-44'],
  genders: ['male', 'female'],
  incomeLevels: ['middle', 'high'],
}