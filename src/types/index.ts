// Core theme types
export interface Theme {
  id: string
  title: string
  description: string
  category: ThemeCategory
  monetizationScore: number
  marketSize: number
  competitionLevel: CompetitionLevel
  technicalDifficulty: TechnicalDifficulty
  estimatedRevenue: {
    min: number
    max: number
  }
  dataSources: DataSource[]
  createdAt: string
  updatedAt: string
}

export type ThemeCategory =
  | 'productivity'
  | 'entertainment'
  | 'education'
  | 'health'
  | 'finance'
  | 'social'

export type CompetitionLevel = 'low' | 'medium' | 'high'
export type TechnicalDifficulty = 'beginner' | 'intermediate' | 'advanced'

// User types
export interface User {
  id: string
  email: string
  subscriptionTier: SubscriptionTier
  stripeCustomerId?: string
  createdAt: string
  updatedAt: string
}

export type SubscriptionTier = 'free' | 'basic' | 'pro'

// Data source types
export interface DataSource {
  source: string
  searchVolume: number
  growthRate: number
  timestamp: string
}

// Demographic data types
export interface DemographicData {
  country: string
  region?: string
  ageGroup: AgeGroup
  gender: Gender
  ethnicity?: string
  incomeLevel: IncomeLevel
}

export type AgeGroup = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type IncomeLevel = 'low' | 'middle' | 'high' | 'premium'

// API response types
export interface APIResponse<T> {
  data: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
