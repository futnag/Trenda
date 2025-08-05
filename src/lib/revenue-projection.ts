import { z } from 'zod'
import type { Theme, RevenueProjection, MonetizationFactors } from '@/types'
import { RevenueProjectionSchema } from '@/types'

// =============================================================================
// CONFIGURATION AND CONSTANTS
// =============================================================================

/**
 * Revenue calculation configuration
 */
export const REVENUE_CONFIG = {
  // Base multipliers for different scenarios
  CONSERVATIVE_MULTIPLIER: 0.3,
  REALISTIC_MULTIPLIER: 0.7,
  OPTIMISTIC_MULTIPLIER: 1.5,
  
  // Market factors
  MARKET_SIZE_NORMALIZATION: 1000000, // Normalize market size to millions
  
  // Competition level adjustments
  COMPETITION_FACTORS: {
    low: 1.2,
    medium: 1.0,
    high: 0.8,
  },
  
  // Technical difficulty adjustments
  DIFFICULTY_FACTORS: {
    beginner: 1.1,
    intermediate: 1.0,
    advanced: 0.9,
  },
  
  // Timeline milestones (in months)
  MILESTONES: {
    MVP_TO_FIRST_REVENUE: { min: 2, max: 4 },
    TO_10K_YEN: { min: 6, max: 12 },
    TO_100K_YEN: { min: 12, max: 24 },
  },
  
  // Revenue growth patterns
  GROWTH_PATTERNS: {
    conservative: {
      monthlyGrowthRate: 0.05, // 5% monthly growth
      plateauMonth: 18,
    },
    realistic: {
      monthlyGrowthRate: 0.10, // 10% monthly growth
      plateauMonth: 24,
    },
    optimistic: {
      monthlyGrowthRate: 0.20, // 20% monthly growth
      plateauMonth: 36,
    },
  },
} as const

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

export const RevenueCalculationOptionsSchema = z.object({
  includeGrowthProjection: z.boolean().default(false),
  customMultipliers: z.object({
    conservative: z.number().min(0).max(2).optional(),
    realistic: z.number().min(0).max(2).optional(),
    optimistic: z.number().min(0).max(3).optional(),
  }).optional(),
  timeHorizonMonths: z.number().min(1).max(60).default(12),
  includeSeasonality: z.boolean().default(false),
})

export const RevenueTimelineSchema = z.object({
  mvpToFirstRevenue: z.object({
    period: z.string(),
    description: z.string(),
    amount: z.number().min(0),
    confidence: z.number().min(0).max(100),
  }),
  to10k: z.object({
    period: z.string(),
    description: z.string(),
    amount: z.number().min(0),
    confidence: z.number().min(0).max(100),
  }),
  to100k: z.object({
    period: z.string(),
    description: z.string(),
    amount: z.number().min(0),
    confidence: z.number().min(0).max(100),
  }),
})

export const RevenueGrowthProjectionSchema = z.object({
  monthlyProjections: z.array(z.object({
    month: z.number().min(1),
    conservative: z.number().min(0),
    realistic: z.number().min(0),
    optimistic: z.number().min(0),
  })),
  totalProjection: z.object({
    conservative: z.number().min(0),
    realistic: z.number().min(0),
    optimistic: z.number().min(0),
  }),
  peakMonth: z.number().min(1),
  plateauRevenue: z.object({
    conservative: z.number().min(0),
    realistic: z.number().min(0),
    optimistic: z.number().min(0),
  }),
})

// =============================================================================
// TYPES
// =============================================================================

export type RevenueCalculationOptions = z.infer<typeof RevenueCalculationOptionsSchema>
export type RevenueTimeline = z.infer<typeof RevenueTimelineSchema>
export type RevenueGrowthProjection = z.infer<typeof RevenueGrowthProjectionSchema>

export interface RevenueAnalysis {
  projection: RevenueProjection
  timeline: RevenueTimeline
  growthProjection?: RevenueGrowthProjection
  riskFactors: RiskFactor[]
  opportunities: Opportunity[]
}

export interface RiskFactor {
  factor: string
  impact: 'low' | 'medium' | 'high'
  probability: number // 0-100
  mitigation: string
}

export interface Opportunity {
  opportunity: string
  potential: 'low' | 'medium' | 'high'
  timeframe: string
  requirements: string[]
}

// =============================================================================
// CORE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculates base revenue from theme data
 */
export function calculateBaseRevenue(theme: Theme): number {
  return (theme.estimatedRevenue.min + theme.estimatedRevenue.max) / 2
}

/**
 * Calculates market adjustment factor based on theme characteristics
 */
export function calculateMarketAdjustmentFactor(theme: Theme): number {
  // Market size factor (normalized to 0-2 range)
  const marketSizeFactor = Math.min(2, theme.marketSize / REVENUE_CONFIG.MARKET_SIZE_NORMALIZATION)
  
  // Monetization score factor (0-1 range)
  const scoreFactor = theme.monetizationScore / 100
  
  // Competition level factor
  const competitionFactor = REVENUE_CONFIG.COMPETITION_FACTORS[theme.competitionLevel]
  
  // Technical difficulty factor
  const difficultyFactor = REVENUE_CONFIG.DIFFICULTY_FACTORS[theme.technicalDifficulty]
  
  // Additional factors from monetization factors if available
  let additionalFactor = 1.0
  if (theme.monetizationFactors) {
    const factors = theme.monetizationFactors
    // Payment willingness boost
    additionalFactor *= (1 + (factors.paymentWillingness - 50) / 200) // -25% to +25%
    // Customer lifetime value boost
    additionalFactor *= (1 + (factors.customerLifetimeValue - 50) / 300) // -17% to +17%
  }
  
  return marketSizeFactor * scoreFactor * competitionFactor * difficultyFactor * additionalFactor
}

/**
 * Calculates revenue projection for different scenarios
 */
export function calculateRevenueProjection(
  theme: Theme,
  timeframe: 'month' | 'quarter' | 'year' = 'month',
  options?: RevenueCalculationOptions
): RevenueProjection {
  const baseRevenue = calculateBaseRevenue(theme)
  const adjustmentFactor = calculateMarketAdjustmentFactor(theme)
  
  // Time multiplier
  const timeMultiplier = timeframe === 'month' ? 1 : timeframe === 'quarter' ? 3 : 12
  
  // Custom multipliers if provided
  const multipliers = {
    conservative: options?.customMultipliers?.conservative ?? REVENUE_CONFIG.CONSERVATIVE_MULTIPLIER,
    realistic: options?.customMultipliers?.realistic ?? REVENUE_CONFIG.REALISTIC_MULTIPLIER,
    optimistic: options?.customMultipliers?.optimistic ?? REVENUE_CONFIG.OPTIMISTIC_MULTIPLIER,
  }
  
  const scenarios = {
    conservative: Math.round(baseRevenue * multipliers.conservative * adjustmentFactor * timeMultiplier),
    realistic: Math.round(baseRevenue * multipliers.realistic * adjustmentFactor * timeMultiplier),
    optimistic: Math.round(baseRevenue * multipliers.optimistic * adjustmentFactor * timeMultiplier),
  }
  
  // Generate assumptions
  const assumptions = generateRevenueAssumptions(theme, adjustmentFactor)
  
  return {
    timeframe,
    scenarios,
    assumptions,
  }
}

/**
 * Generates revenue assumptions based on theme data
 */
export function generateRevenueAssumptions(
  theme: Theme,
  adjustmentFactor: number
): RevenueProjection['assumptions'] {
  const assumptions = [
    {
      factor: '市場規模',
      value: theme.marketSize,
      confidence: 75,
      source: 'トレンドデータ分析',
    },
    {
      factor: 'マネタイズスコア',
      value: theme.monetizationScore,
      confidence: 80,
      source: '総合評価アルゴリズム',
    },
    {
      factor: '競合レベル',
      value: theme.competitionLevel === 'low' ? 20 : theme.competitionLevel === 'medium' ? 50 : 80,
      confidence: 70,
      source: '競合分析',
    },
    {
      factor: '技術難易度',
      value: theme.technicalDifficulty === 'beginner' ? 30 : theme.technicalDifficulty === 'intermediate' ? 50 : 70,
      confidence: 85,
      source: '技術要件分析',
    },
    {
      factor: '市場調整係数',
      value: Math.round(adjustmentFactor * 100) / 100,
      confidence: 65,
      source: '複合要因分析',
    },
  ]
  
  // Add monetization factors if available
  if (theme.monetizationFactors) {
    assumptions.push(
      {
        factor: '支払い意欲度',
        value: theme.monetizationFactors.paymentWillingness,
        confidence: 70,
        source: 'ユーザー行動分析',
      },
      {
        factor: '顧客生涯価値',
        value: theme.monetizationFactors.customerLifetimeValue,
        confidence: 60,
        source: '収益モデル分析',
      }
    )
  }
  
  return assumptions
}

/**
 * Calculates revenue timeline milestones
 */
export function calculateRevenueTimeline(theme: Theme): RevenueTimeline {
  const projection = calculateRevenueProjection(theme, 'month')
  const baseMonthlyRevenue = projection.scenarios.realistic
  
  // Adjust timeline based on theme characteristics
  const timelineAdjustment = theme.technicalDifficulty === 'beginner' ? 0.8 : 
                            theme.technicalDifficulty === 'intermediate' ? 1.0 : 1.3
  
  const competitionAdjustment = theme.competitionLevel === 'low' ? 0.9 :
                               theme.competitionLevel === 'medium' ? 1.0 : 1.2
  
  const totalAdjustment = timelineAdjustment * competitionAdjustment
  
  return {
    mvpToFirstRevenue: {
      period: `${Math.round(REVENUE_CONFIG.MILESTONES.MVP_TO_FIRST_REVENUE.min * totalAdjustment)}-${Math.round(REVENUE_CONFIG.MILESTONES.MVP_TO_FIRST_REVENUE.max * totalAdjustment)}ヶ月`,
      description: 'MVP開発から初回収益まで',
      amount: Math.round(baseMonthlyRevenue * 0.1),
      confidence: 70,
    },
    to10k: {
      period: `${Math.round(REVENUE_CONFIG.MILESTONES.TO_10K_YEN.min * totalAdjustment)}-${Math.round(REVENUE_CONFIG.MILESTONES.TO_10K_YEN.max * totalAdjustment)}ヶ月`,
      description: '月次収益1万円達成まで',
      amount: 10000,
      confidence: 65,
    },
    to100k: {
      period: `${Math.round(REVENUE_CONFIG.MILESTONES.TO_100K_YEN.min * totalAdjustment)}-${Math.round(REVENUE_CONFIG.MILESTONES.TO_100K_YEN.max * totalAdjustment)}ヶ月`,
      description: '月次収益10万円達成まで',
      amount: 100000,
      confidence: 55,
    },
  }
}

/**
 * Calculates revenue growth projection over time
 */
export function calculateRevenueGrowthProjection(
  theme: Theme,
  months: number = 24
): RevenueGrowthProjection {
  const baseProjection = calculateRevenueProjection(theme, 'month')
  const monthlyProjections = []
  
  for (let month = 1; month <= months; month++) {
    const projections = {
      month,
      conservative: 0,
      realistic: 0,
      optimistic: 0,
    }
    
    // Calculate growth for each scenario
    Object.keys(REVENUE_CONFIG.GROWTH_PATTERNS).forEach(scenario => {
      const pattern = REVENUE_CONFIG.GROWTH_PATTERNS[scenario as keyof typeof REVENUE_CONFIG.GROWTH_PATTERNS]
      const baseRevenue = baseProjection.scenarios[scenario as keyof typeof baseProjection.scenarios]
      
      if (month <= pattern.plateauMonth) {
        // Growth phase
        const growthFactor = Math.pow(1 + pattern.monthlyGrowthRate, month - 1)
        projections[scenario as keyof typeof projections] = Math.round(baseRevenue * growthFactor)
      } else {
        // Plateau phase
        const plateauFactor = Math.pow(1 + pattern.monthlyGrowthRate, pattern.plateauMonth - 1)
        projections[scenario as keyof typeof projections] = Math.round(baseRevenue * plateauFactor)
      }
    })
    
    monthlyProjections.push(projections)
  }
  
  // Calculate totals
  const totalProjection = monthlyProjections.reduce(
    (acc, month) => ({
      conservative: acc.conservative + month.conservative,
      realistic: acc.realistic + month.realistic,
      optimistic: acc.optimistic + month.optimistic,
    }),
    { conservative: 0, realistic: 0, optimistic: 0 }
  )
  
  // Find peak month (when growth starts to plateau)
  const peakMonth = Math.min(
    REVENUE_CONFIG.GROWTH_PATTERNS.realistic.plateauMonth,
    months
  )
  
  // Calculate plateau revenue
  const plateauRevenue = {
    conservative: monthlyProjections[Math.min(REVENUE_CONFIG.GROWTH_PATTERNS.conservative.plateauMonth - 1, months - 1)]?.conservative || 0,
    realistic: monthlyProjections[Math.min(REVENUE_CONFIG.GROWTH_PATTERNS.realistic.plateauMonth - 1, months - 1)]?.realistic || 0,
    optimistic: monthlyProjections[Math.min(REVENUE_CONFIG.GROWTH_PATTERNS.optimistic.plateauMonth - 1, months - 1)]?.optimistic || 0,
  }
  
  return {
    monthlyProjections,
    totalProjection,
    peakMonth,
    plateauRevenue,
  }
}

/**
 * Analyzes risk factors for revenue projection
 */
export function analyzeRiskFactors(theme: Theme): RiskFactor[] {
  const risks: RiskFactor[] = []
  
  // Competition risk
  if (theme.competitionLevel === 'high') {
    risks.push({
      factor: '高競合市場',
      impact: 'high',
      probability: 80,
      mitigation: '差別化戦略の強化、ニッチ市場への特化',
    })
  }
  
  // Technical complexity risk
  if (theme.technicalDifficulty === 'advanced') {
    risks.push({
      factor: '技術実装の複雑性',
      impact: 'medium',
      probability: 70,
      mitigation: '段階的開発、技術的負債の管理',
    })
  }
  
  // Market size risk
  if (theme.marketSize < 500000) {
    risks.push({
      factor: '限定的な市場規模',
      impact: 'medium',
      probability: 60,
      mitigation: '市場拡大戦略、隣接市場への展開',
    })
  }
  
  // Monetization score risk
  if (theme.monetizationScore < 50) {
    risks.push({
      factor: '低いマネタイズ可能性',
      impact: 'high',
      probability: 75,
      mitigation: '収益モデルの見直し、価値提案の強化',
    })
  }
  
  // Payment willingness risk
  if (theme.monetizationFactors?.paymentWillingness && theme.monetizationFactors.paymentWillingness < 40) {
    risks.push({
      factor: '低い支払い意欲',
      impact: 'high',
      probability: 70,
      mitigation: 'フリーミアムモデル、価値の明確化',
    })
  }
  
  return risks
}

/**
 * Identifies revenue opportunities
 */
export function identifyRevenueOpportunities(theme: Theme): Opportunity[] {
  const opportunities: Opportunity[] = []
  
  // Low competition opportunity
  if (theme.competitionLevel === 'low') {
    opportunities.push({
      opportunity: 'ブルーオーシャン市場',
      potential: 'high',
      timeframe: '6-12ヶ月',
      requirements: ['迅速な市場参入', 'ブランド構築'],
    })
  }
  
  // High monetization score opportunity
  if (theme.monetizationScore >= 80) {
    opportunities.push({
      opportunity: '高収益化ポテンシャル',
      potential: 'high',
      timeframe: '3-6ヶ月',
      requirements: ['効率的な開発', 'マーケティング投資'],
    })
  }
  
  // Large market opportunity
  if (theme.marketSize >= 1000000) {
    opportunities.push({
      opportunity: '大規模市場への展開',
      potential: 'medium',
      timeframe: '12-24ヶ月',
      requirements: ['スケーラブルな設計', '資金調達'],
    })
  }
  
  // Easy implementation opportunity
  if (theme.technicalDifficulty === 'beginner') {
    opportunities.push({
      opportunity: '迅速なMVP開発',
      potential: 'medium',
      timeframe: '1-3ヶ月',
      requirements: ['最小限のリソース', '市場検証'],
    })
  }
  
  // High payment willingness opportunity
  if (theme.monetizationFactors?.paymentWillingness && theme.monetizationFactors.paymentWillingness >= 70) {
    opportunities.push({
      opportunity: '高い支払い意欲の活用',
      potential: 'high',
      timeframe: '3-9ヶ月',
      requirements: ['プレミアム機能開発', '価格戦略最適化'],
    })
  }
  
  return opportunities
}

/**
 * Performs comprehensive revenue analysis
 */
export function performRevenueAnalysis(
  theme: Theme,
  options?: RevenueCalculationOptions
): RevenueAnalysis {
  const projection = calculateRevenueProjection(theme, 'month', options)
  const timeline = calculateRevenueTimeline(theme)
  const riskFactors = analyzeRiskFactors(theme)
  const opportunities = identifyRevenueOpportunities(theme)
  
  let growthProjection: RevenueGrowthProjection | undefined
  if (options?.includeGrowthProjection) {
    growthProjection = calculateRevenueGrowthProjection(theme, options.timeHorizonMonths)
  }
  
  return {
    projection,
    timeline,
    growthProjection,
    riskFactors,
    opportunities,
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Formats currency for display
 */
export function formatCurrency(amount: number, locale: string = 'ja-JP'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Calculates percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * Validates revenue projection data
 */
export function validateRevenueProjection(projection: unknown): projection is RevenueProjection {
  try {
    RevenueProjectionSchema.parse(projection)
    return true
  } catch {
    return false
  }
}

/**
 * Gets confidence level description
 */
export function getConfidenceDescription(confidence: number): string {
  if (confidence >= 80) return '高信頼度'
  if (confidence >= 60) return '中信頼度'
  if (confidence >= 40) return '低信頼度'
  return '要検証'
}

/**
 * Gets risk level color for UI
 */
export function getRiskLevelColor(impact: 'low' | 'medium' | 'high'): {
  text: string
  bg: string
  border: string
} {
  switch (impact) {
    case 'low':
      return { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' }
    case 'medium':
      return { text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' }
    case 'high':
      return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
  }
}

/**
 * Gets opportunity potential color for UI
 */
export function getOpportunityPotentialColor(potential: 'low' | 'medium' | 'high'): {
  text: string
  bg: string
  border: string
} {
  switch (potential) {
    case 'low':
      return { text: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' }
    case 'medium':
      return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' }
    case 'high':
      return { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' }
  }
}