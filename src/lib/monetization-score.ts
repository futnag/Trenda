import { z } from 'zod'
import type { MonetizationFactors, Theme, TrendData } from '@/types'
import { MonetizationFactorsSchema } from '@/types'

// =============================================================================
// CONFIGURATION AND CONSTANTS
// =============================================================================

/**
 * Default weights for monetization score calculation
 * These weights determine the relative importance of each factor
 */
export const DEFAULT_MONETIZATION_WEIGHTS = {
  marketSize: 0.25,           // 市場規模の重要度
  paymentWillingness: 0.2,    // 支払い意欲度の重要度
  competitionLevel: 0.15,     // 競合レベルの重要度（逆相関）
  revenueModels: 0.15,        // 収益化手法の多様性
  customerAcquisitionCost: 0.15, // 顧客獲得コストの重要度（逆相関）
  customerLifetimeValue: 0.1, // 顧客生涯価値の重要度
} as const

/**
 * Score calculation configuration
 */
export const SCORE_CONFIG = {
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  DECIMAL_PLACES: 0,
  TREND_ANALYSIS_DAYS: 30,
} as const

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

export const MonetizationWeightsSchema = z.object({
  marketSize: z.number().min(0).max(1),
  paymentWillingness: z.number().min(0).max(1),
  competitionLevel: z.number().min(0).max(1),
  revenueModels: z.number().min(0).max(1),
  customerAcquisitionCost: z.number().min(0).max(1),
  customerLifetimeValue: z.number().min(0).max(1),
}).refine(
  (weights) => {
    const sum = Object.values(weights).reduce((acc, val) => acc + val, 0)
    return Math.abs(sum - 1.0) < 0.001 // Allow for floating point precision
  },
  {
    message: 'Weight values must sum to 1.0',
  }
)

export const ScoreHistoryEntrySchema = z.object({
  score: z.number().min(0).max(100),
  factors: z.object({
    marketSize: z.number().min(0).max(100),
    paymentWillingness: z.number().min(0).max(100),
    competitionLevel: z.number().min(0).max(100),
    revenueModels: z.number().min(0).max(100),
    customerAcquisitionCost: z.number().min(0).max(100),
    customerLifetimeValue: z.number().min(0).max(100),
  }),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
})

export const ScoreAnalysisSchema = z.object({
  currentScore: z.number().min(0).max(100),
  previousScore: z.number().min(0).max(100).optional(),
  trend: z.enum(['increasing', 'decreasing', 'stable']),
  changePercentage: z.number(),
  volatility: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  factors: z.object({
    strongest: z.string(),
    weakest: z.string(),
    mostImproved: z.string().optional(),
    mostDeclined: z.string().optional(),
  }),
})

// =============================================================================
// TYPES
// =============================================================================

export type MonetizationWeights = z.infer<typeof MonetizationWeightsSchema>
export type ScoreHistoryEntry = z.infer<typeof ScoreHistoryEntrySchema>
export type ScoreAnalysis = z.infer<typeof ScoreAnalysisSchema>

export interface ScoreCalculationOptions {
  weights?: Partial<MonetizationWeights>
  includeHistory?: boolean
  includeAnalysis?: boolean
}

export interface ScoreCalculationResult {
  score: number
  factors: MonetizationFactors
  breakdown: Record<keyof MonetizationFactors, number>
  analysis?: ScoreAnalysis
  history?: ScoreHistoryEntry[]
}

// =============================================================================
// CORE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Validates and normalizes monetization factors to ensure they're within valid ranges
 */
export function normalizeMonetizationFactors(
  factors: Partial<MonetizationFactors>
): MonetizationFactors {
  const normalize = (value: number | undefined, defaultValue: number = 50): number => {
    if (value === undefined || value === null) return defaultValue
    return Math.max(0, Math.min(100, value))
  }

  return {
    marketSize: normalize(factors.marketSize),
    paymentWillingness: normalize(factors.paymentWillingness),
    competitionLevel: normalize(factors.competitionLevel),
    revenueModels: normalize(factors.revenueModels),
    customerAcquisitionCost: normalize(factors.customerAcquisitionCost),
    customerLifetimeValue: normalize(factors.customerLifetimeValue),
  }
}

/**
 * Validates and normalizes weights, filling in defaults for missing values
 */
export function normalizeWeights(
  weights?: Partial<MonetizationWeights>
): MonetizationWeights {
  const normalized = {
    ...DEFAULT_MONETIZATION_WEIGHTS,
    ...weights,
  }

  // Validate that weights sum to 1.0
  const sum = Object.values(normalized).reduce((acc, val) => acc + val, 0)
  if (Math.abs(sum - 1.0) > 0.001) {
    console.warn('Weights do not sum to 1.0, normalizing...')
    const factor = 1.0 / sum
    Object.keys(normalized).forEach((key) => {
      normalized[key as keyof MonetizationWeights] *= factor
    })
  }

  return normalized
}

/**
 * Calculates the monetization score based on factors and weights
 * 
 * @param factors - The monetization factors (0-100 scale)
 * @param weights - Optional custom weights for calculation
 * @returns The calculated monetization score (0-100)
 */
export function calculateMonetizationScore(
  factors: Partial<MonetizationFactors>,
  weights?: Partial<MonetizationWeights>
): number {
  const normalizedFactors = normalizeMonetizationFactors(factors)
  const normalizedWeights = normalizeWeights(weights)

  // Calculate weighted score
  // Note: competitionLevel and customerAcquisitionCost are inverted (lower is better)
  const score =
    normalizedFactors.marketSize * normalizedWeights.marketSize +
    normalizedFactors.paymentWillingness * normalizedWeights.paymentWillingness +
    (100 - normalizedFactors.competitionLevel) * normalizedWeights.competitionLevel +
    normalizedFactors.revenueModels * normalizedWeights.revenueModels +
    (100 - normalizedFactors.customerAcquisitionCost) * normalizedWeights.customerAcquisitionCost +
    normalizedFactors.customerLifetimeValue * normalizedWeights.customerLifetimeValue

  // Round to specified decimal places
  return Math.round(score * Math.pow(10, SCORE_CONFIG.DECIMAL_PLACES)) / Math.pow(10, SCORE_CONFIG.DECIMAL_PLACES)
}

/**
 * Calculates detailed score breakdown showing contribution of each factor
 */
export function calculateScoreBreakdown(
  factors: Partial<MonetizationFactors>,
  weights?: Partial<MonetizationWeights>
): Record<keyof MonetizationFactors, number> {
  const normalizedFactors = normalizeMonetizationFactors(factors)
  const normalizedWeights = normalizeWeights(weights)

  return {
    marketSize: normalizedFactors.marketSize * normalizedWeights.marketSize,
    paymentWillingness: normalizedFactors.paymentWillingness * normalizedWeights.paymentWillingness,
    competitionLevel: (100 - normalizedFactors.competitionLevel) * normalizedWeights.competitionLevel,
    revenueModels: normalizedFactors.revenueModels * normalizedWeights.revenueModels,
    customerAcquisitionCost: (100 - normalizedFactors.customerAcquisitionCost) * normalizedWeights.customerAcquisitionCost,
    customerLifetimeValue: normalizedFactors.customerLifetimeValue * normalizedWeights.customerLifetimeValue,
  }
}

// =============================================================================
// SCORE HISTORY AND TREND ANALYSIS
// =============================================================================

/**
 * Creates a score history entry
 */
export function createScoreHistoryEntry(
  score: number,
  factors: MonetizationFactors,
  metadata?: Record<string, unknown>
): ScoreHistoryEntry {
  return {
    score,
    factors,
    timestamp: new Date().toISOString(),
    metadata,
  }
}

/**
 * Analyzes score trend based on historical data
 */
export function analyzeScoreTrend(
  currentScore: number,
  currentFactors: MonetizationFactors,
  history: ScoreHistoryEntry[]
): ScoreAnalysis {
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const previousEntry = sortedHistory[0]
  const previousScore = previousEntry?.score

  // Calculate trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  let changePercentage = 0

  if (previousScore !== undefined) {
    const change = currentScore - previousScore
    changePercentage = previousScore > 0 ? (change / previousScore) * 100 : 0

    if (Math.abs(changePercentage) < 2) {
      trend = 'stable'
    } else if (changePercentage > 0) {
      trend = 'increasing'
    } else {
      trend = 'decreasing'
    }
  }

  // Calculate volatility (standard deviation of recent scores)
  const recentScores = sortedHistory.slice(0, 10).map(entry => entry.score)
  recentScores.unshift(currentScore)
  
  const mean = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
  const variance = recentScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / recentScores.length
  const volatility = Math.min(100, Math.sqrt(variance))

  // Calculate confidence based on data availability and volatility
  const dataPoints = recentScores.length
  const baseConfidence = Math.min(100, (dataPoints / 10) * 100)
  const volatilityPenalty = volatility * 0.5
  const confidence = Math.max(0, baseConfidence - volatilityPenalty)

  // Identify strongest and weakest factors
  const factorEntries = Object.entries(currentFactors) as [keyof MonetizationFactors, number][]
  const sortedFactors = factorEntries.sort((a, b) => b[1] - a[1])
  
  const strongest = sortedFactors[0][0]
  const weakest = sortedFactors[sortedFactors.length - 1][0]

  // Identify most improved and declined factors (if previous data exists)
  let mostImproved: string | undefined
  let mostDeclined: string | undefined

  if (previousEntry) {
    const factorChanges = factorEntries.map(([factor, value]) => ({
      factor,
      change: value - previousEntry.factors[factor],
    }))

    factorChanges.sort((a, b) => b.change - a.change)
    
    if (factorChanges[0].change > 1) {
      mostImproved = factorChanges[0].factor
    }
    
    if (factorChanges[factorChanges.length - 1].change < -1) {
      mostDeclined = factorChanges[factorChanges.length - 1].factor
    }
  }

  return {
    currentScore,
    previousScore,
    trend,
    changePercentage,
    volatility,
    confidence,
    factors: {
      strongest,
      weakest,
      mostImproved,
      mostDeclined,
    },
  }
}

/**
 * Filters score history to recent entries within specified days
 */
export function getRecentScoreHistory(
  history: ScoreHistoryEntry[],
  days: number = SCORE_CONFIG.TREND_ANALYSIS_DAYS
): ScoreHistoryEntry[] {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  return history.filter(entry => new Date(entry.timestamp) >= cutoffDate)
}

// =============================================================================
// THEME-SPECIFIC CALCULATIONS
// =============================================================================

/**
 * Calculates monetization factors from theme data and trend data
 */
export function calculateFactorsFromThemeData(
  theme: Theme,
  trendData?: TrendData[]
): MonetizationFactors {
  // Base factors from theme data
  let factors: MonetizationFactors = {
    marketSize: Math.min(100, (theme.marketSize / 1000000) * 10), // Normalize market size
    paymentWillingness: 50, // Default, will be enhanced with trend data
    competitionLevel: theme.competitionLevel === 'low' ? 20 : theme.competitionLevel === 'medium' ? 50 : 80,
    revenueModels: theme.dataSources.length * 20, // More data sources = more revenue opportunities
    customerAcquisitionCost: theme.technicalDifficulty === 'beginner' ? 30 : theme.technicalDifficulty === 'intermediate' ? 50 : 70,
    customerLifetimeValue: (theme.estimatedRevenue.min + theme.estimatedRevenue.max) / 2000, // Normalize revenue
  }

  // Enhance with trend data if available
  if (trendData && trendData.length > 0) {
    const avgSearchVolume = trendData.reduce((sum, data) => sum + data.searchVolume, 0) / trendData.length
    const avgGrowthRate = trendData.reduce((sum, data) => sum + data.growthRate, 0) / trendData.length

    // Enhance payment willingness based on search volume and growth
    factors.paymentWillingness = Math.min(100, (avgSearchVolume / 10000) * 50 + Math.max(0, avgGrowthRate) * 2)

    // Adjust market size based on growth trends
    if (avgGrowthRate > 10) {
      factors.marketSize = Math.min(100, factors.marketSize * 1.2)
    } else if (avgGrowthRate < -10) {
      factors.marketSize = Math.max(0, factors.marketSize * 0.8)
    }
  }

  return normalizeMonetizationFactors(factors)
}

/**
 * Updates theme with calculated monetization score and factors
 */
export function updateThemeWithMonetizationScore(
  theme: Theme,
  trendData?: TrendData[],
  options?: ScoreCalculationOptions
): Theme {
  const factors = calculateFactorsFromThemeData(theme, trendData)
  const score = calculateMonetizationScore(factors, options?.weights)
  const breakdown = calculateScoreBreakdown(factors, options?.weights)

  return {
    ...theme,
    monetizationScore: score,
    monetizationFactors: factors,
  }
}

// =============================================================================
// BATCH PROCESSING FUNCTIONS
// =============================================================================

/**
 * Calculates monetization scores for multiple themes
 */
export function calculateBatchMonetizationScores(
  themes: Theme[],
  trendDataMap?: Map<string, TrendData[]>,
  options?: ScoreCalculationOptions
): Theme[] {
  return themes.map(theme => {
    const trendData = trendDataMap?.get(theme.id)
    return updateThemeWithMonetizationScore(theme, trendData, options)
  })
}

/**
 * Recalculates all scores with new weights
 */
export function recalculateScoresWithNewWeights(
  themes: Theme[],
  newWeights: Partial<MonetizationWeights>
): Theme[] {
  return themes.map(theme => {
    if (!theme.monetizationFactors) {
      console.warn(`Theme ${theme.id} missing monetization factors, skipping recalculation`)
      return theme
    }

    const newScore = calculateMonetizationScore(theme.monetizationFactors, newWeights)
    return {
      ...theme,
      monetizationScore: newScore,
    }
  })
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validates monetization factors
 */
export function validateMonetizationFactors(factors: unknown): factors is MonetizationFactors {
  try {
    MonetizationFactorsSchema.parse(factors)
    return true
  } catch {
    return false
  }
}

/**
 * Validates monetization weights
 */
export function validateMonetizationWeights(weights: unknown): weights is MonetizationWeights {
  try {
    MonetizationWeightsSchema.parse(weights)
    return true
  } catch {
    return false
  }
}

/**
 * Gets human-readable factor names
 */
export function getFactorDisplayName(factor: keyof MonetizationFactors): string {
  const displayNames: Record<keyof MonetizationFactors, string> = {
    marketSize: '市場規模',
    paymentWillingness: '支払い意欲度',
    competitionLevel: '競合レベル',
    revenueModels: '収益化手法の多様性',
    customerAcquisitionCost: '顧客獲得コスト',
    customerLifetimeValue: '顧客生涯価値',
  }
  
  return displayNames[factor] || factor
}

/**
 * Gets factor description for UI tooltips
 */
export function getFactorDescription(factor: keyof MonetizationFactors): string {
  const descriptions: Record<keyof MonetizationFactors, string> = {
    marketSize: 'そのテーマの総市場規模（TAM）の大きさを示します',
    paymentWillingness: 'ユーザーが有料サービスに対して支払う意欲の高さを示します',
    competitionLevel: '市場における競合の激しさを示します（低いほど良い）',
    revenueModels: 'サブスク、広告、課金など、適用可能な収益化手法の多様性を示します',
    customerAcquisitionCost: '新規顧客を獲得するのに必要なコストの低さを示します',
    customerLifetimeValue: '顧客一人当たりの生涯価値の高さを示します',
  }
  
  return descriptions[factor] || ''
}