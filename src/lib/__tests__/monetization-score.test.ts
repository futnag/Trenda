import {
  calculateMonetizationScore,
  calculateScoreBreakdown,
  normalizeMonetizationFactors,
  normalizeWeights,
  analyzeScoreTrend,
  createScoreHistoryEntry,
  calculateFactorsFromThemeData,
  updateThemeWithMonetizationScore,
  calculateBatchMonetizationScores,
  recalculateScoresWithNewWeights,
  validateMonetizationFactors,
  validateMonetizationWeights,
  getFactorDisplayName,
  getFactorDescription,
  DEFAULT_MONETIZATION_WEIGHTS,
  SCORE_CONFIG,
} from '../monetization-score'
import type { MonetizationFactors, Theme, TrendData } from '@/types'
import type { ScoreHistoryEntry } from '../monetization-score'

// =============================================================================
// TEST DATA
// =============================================================================

const mockFactors: MonetizationFactors = {
  marketSize: 80,
  paymentWillingness: 70,
  competitionLevel: 30,
  revenueModels: 60,
  customerAcquisitionCost: 40,
  customerLifetimeValue: 75,
}

const mockTheme: Theme = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Theme',
  description: 'A test theme for monetization',
  category: 'productivity',
  monetizationScore: 0,
  marketSize: 5000000,
  competitionLevel: 'medium',
  technicalDifficulty: 'intermediate',
  estimatedRevenue: { min: 10000, max: 50000 },
  dataSources: [
    {
      source: 'google_trends',
      searchVolume: 15000,
      growthRate: 5.2,
      timestamp: '2024-01-01T00:00:00Z',
    },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockTrendData: TrendData[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    themeId: '123e4567-e89b-12d3-a456-426614174000',
    source: 'google_trends',
    searchVolume: 15000,
    growthRate: 5.2,
    timestamp: '2024-01-01T00:00:00Z',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    themeId: '123e4567-e89b-12d3-a456-426614174000',
    source: 'reddit',
    searchVolume: 8000,
    growthRate: 12.5,
    timestamp: '2024-01-01T00:00:00Z',
  },
]

// =============================================================================
// CORE CALCULATION TESTS
// =============================================================================

describe('calculateMonetizationScore', () => {
  test('calculates score correctly with default weights', () => {
    const score = calculateMonetizationScore(mockFactors)
    
    // Expected calculation:
    // 80 * 0.25 + 70 * 0.2 + (100-30) * 0.15 + 60 * 0.15 + (100-40) * 0.15 + 75 * 0.1
    // = 20 + 14 + 10.5 + 9 + 9 + 7.5 = 70
    expect(score).toBe(70)
  })

  test('calculates score correctly with custom weights', () => {
    const customWeights = {
      marketSize: 0.5,
      paymentWillingness: 0.3,
      competitionLevel: 0.1,
      revenueModels: 0.05,
      customerAcquisitionCost: 0.03,
      customerLifetimeValue: 0.02,
    }
    
    const score = calculateMonetizationScore(mockFactors, customWeights)
    
    // Expected calculation with custom weights:
    // 80 * 0.5 + 70 * 0.3 + (100-30) * 0.1 + 60 * 0.05 + (100-40) * 0.03 + 75 * 0.02
    // = 40 + 21 + 7 + 3 + 1.8 + 1.5 = 74.3 ≈ 74
    expect(score).toBe(74)
  })

  test('handles edge cases correctly', () => {
    const edgeFactors: MonetizationFactors = {
      marketSize: 0,
      paymentWillingness: 100,
      competitionLevel: 100,
      revenueModels: 0,
      customerAcquisitionCost: 100,
      customerLifetimeValue: 100,
    }
    
    const score = calculateMonetizationScore(edgeFactors)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  test('returns consistent results for same input', () => {
    const score1 = calculateMonetizationScore(mockFactors)
    const score2 = calculateMonetizationScore(mockFactors)
    expect(score1).toBe(score2)
  })
})

describe('calculateScoreBreakdown', () => {
  test('calculates breakdown correctly', () => {
    const breakdown = calculateScoreBreakdown(mockFactors)
    
    expect(breakdown.marketSize).toBe(80 * DEFAULT_MONETIZATION_WEIGHTS.marketSize)
    expect(breakdown.paymentWillingness).toBe(70 * DEFAULT_MONETIZATION_WEIGHTS.paymentWillingness)
    expect(breakdown.competitionLevel).toBe((100 - 30) * DEFAULT_MONETIZATION_WEIGHTS.competitionLevel)
    expect(breakdown.revenueModels).toBe(60 * DEFAULT_MONETIZATION_WEIGHTS.revenueModels)
    expect(breakdown.customerAcquisitionCost).toBe((100 - 40) * DEFAULT_MONETIZATION_WEIGHTS.customerAcquisitionCost)
    expect(breakdown.customerLifetimeValue).toBe(75 * DEFAULT_MONETIZATION_WEIGHTS.customerLifetimeValue)
  })

  test('breakdown sum equals total score', () => {
    const breakdown = calculateScoreBreakdown(mockFactors)
    const totalScore = calculateMonetizationScore(mockFactors)
    
    const breakdownSum = Object.values(breakdown).reduce((sum, value) => sum + value, 0)
    expect(Math.round(breakdownSum)).toBe(totalScore)
  })
})

// =============================================================================
// NORMALIZATION TESTS
// =============================================================================

describe('normalizeMonetizationFactors', () => {
  test('normalizes factors within valid range', () => {
    const invalidFactors = {
      marketSize: 150,
      paymentWillingness: -10,
      competitionLevel: 200,
      revenueModels: -50,
      customerAcquisitionCost: 120,
      customerLifetimeValue: -5,
    }
    
    const normalized = normalizeMonetizationFactors(invalidFactors)
    
    expect(normalized.marketSize).toBe(100)
    expect(normalized.paymentWillingness).toBe(0)
    expect(normalized.competitionLevel).toBe(100)
    expect(normalized.revenueModels).toBe(0)
    expect(normalized.customerAcquisitionCost).toBe(100)
    expect(normalized.customerLifetimeValue).toBe(0)
  })

  test('handles undefined values with defaults', () => {
    const partialFactors = {
      marketSize: 80,
      paymentWillingness: 70,
    }
    
    const normalized = normalizeMonetizationFactors(partialFactors)
    
    expect(normalized.marketSize).toBe(80)
    expect(normalized.paymentWillingness).toBe(70)
    expect(normalized.competitionLevel).toBe(50) // default
    expect(normalized.revenueModels).toBe(50) // default
    expect(normalized.customerAcquisitionCost).toBe(50) // default
    expect(normalized.customerLifetimeValue).toBe(50) // default
  })
})

describe('normalizeWeights', () => {
  test('normalizes weights that do not sum to 1', () => {
    const invalidWeights = {
      marketSize: 0.5,
      paymentWillingness: 0.5,
      competitionLevel: 0.5,
      revenueModels: 0.5,
      customerAcquisitionCost: 0.5,
      customerLifetimeValue: 0.5,
    }
    
    const normalized = normalizeWeights(invalidWeights)
    const sum = Object.values(normalized).reduce((acc, val) => acc + val, 0)
    
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.001)
  })

  test('uses default weights for missing values', () => {
    const partialWeights = {
      marketSize: 0.5,
      paymentWillingness: 0.3,
    }
    
    const normalized = normalizeWeights(partialWeights)
    
    // Should normalize to sum to 1.0
    const sum = Object.values(normalized).reduce((acc, val) => acc + val, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.001)
  })
})

// =============================================================================
// TREND ANALYSIS TESTS
// =============================================================================

describe('analyzeScoreTrend', () => {
  test('identifies increasing trend', () => {
    const history: ScoreHistoryEntry[] = [
      {
        score: 60,
        factors: mockFactors,
        timestamp: '2024-01-01T00:00:00Z',
      },
    ]
    
    const analysis = analyzeScoreTrend(70, mockFactors, history)
    
    expect(analysis.trend).toBe('increasing')
    expect(analysis.changePercentage).toBeCloseTo(16.67, 1)
    expect(analysis.currentScore).toBe(70)
    expect(analysis.previousScore).toBe(60)
  })

  test('identifies decreasing trend', () => {
    const history: ScoreHistoryEntry[] = [
      {
        score: 80,
        factors: mockFactors,
        timestamp: '2024-01-01T00:00:00Z',
      },
    ]
    
    const analysis = analyzeScoreTrend(70, mockFactors, history)
    
    expect(analysis.trend).toBe('decreasing')
    expect(analysis.changePercentage).toBeCloseTo(-12.5, 1)
  })

  test('identifies stable trend', () => {
    const history: ScoreHistoryEntry[] = [
      {
        score: 69,
        factors: mockFactors,
        timestamp: '2024-01-01T00:00:00Z',
      },
    ]
    
    const analysis = analyzeScoreTrend(70, mockFactors, history)
    
    expect(analysis.trend).toBe('stable')
  })

  test('calculates volatility correctly', () => {
    const history: ScoreHistoryEntry[] = [
      { score: 60, factors: mockFactors, timestamp: '2024-01-01T00:00:00Z' },
      { score: 80, factors: mockFactors, timestamp: '2024-01-02T00:00:00Z' },
      { score: 65, factors: mockFactors, timestamp: '2024-01-03T00:00:00Z' },
      { score: 75, factors: mockFactors, timestamp: '2024-01-04T00:00:00Z' },
    ]
    
    const analysis = analyzeScoreTrend(70, mockFactors, history)
    
    expect(analysis.volatility).toBeGreaterThan(0)
    expect(analysis.volatility).toBeLessThanOrEqual(100)
  })

  test('identifies strongest and weakest factors', () => {
    const analysis = analyzeScoreTrend(70, mockFactors, [])
    
    expect(analysis.factors.strongest).toBe('marketSize') // 80 is highest
    expect(analysis.factors.weakest).toBe('competitionLevel') // 30 is lowest
  })
})

describe('createScoreHistoryEntry', () => {
  test('creates valid history entry', () => {
    const entry = createScoreHistoryEntry(70, mockFactors, { source: 'test' })
    
    expect(entry.score).toBe(70)
    expect(entry.factors).toEqual(mockFactors)
    expect(entry.metadata).toEqual({ source: 'test' })
    expect(entry.timestamp).toBeDefined()
    expect(new Date(entry.timestamp)).toBeInstanceOf(Date)
  })
})

// =============================================================================
// THEME-SPECIFIC CALCULATION TESTS
// =============================================================================

describe('calculateFactorsFromThemeData', () => {
  test('calculates factors from theme data only', () => {
    const factors = calculateFactorsFromThemeData(mockTheme)
    
    expect(factors.marketSize).toBeGreaterThan(0)
    expect(factors.competitionLevel).toBe(50) // medium competition
    expect(factors.customerAcquisitionCost).toBe(50) // intermediate difficulty
    expect(factors.revenueModels).toBe(20) // 1 data source * 20
  })

  test('enhances factors with trend data', () => {
    const factors = calculateFactorsFromThemeData(mockTheme, mockTrendData)
    
    expect(factors.paymentWillingness).toBeGreaterThan(50) // enhanced by search volume
    expect(factors.marketSize).toBeGreaterThan(0)
  })

  test('handles empty trend data', () => {
    const factors = calculateFactorsFromThemeData(mockTheme, [])
    
    expect(factors.paymentWillingness).toBe(50) // default value
  })
})

describe('updateThemeWithMonetizationScore', () => {
  test('updates theme with calculated score', () => {
    const updatedTheme = updateThemeWithMonetizationScore(mockTheme)
    
    expect(updatedTheme.monetizationScore).toBeGreaterThan(0)
    expect(updatedTheme.monetizationScore).toBeLessThanOrEqual(100)
    expect(updatedTheme.monetizationFactors).toBeDefined()
  })

  test('preserves original theme properties', () => {
    const updatedTheme = updateThemeWithMonetizationScore(mockTheme)
    
    expect(updatedTheme.id).toBe(mockTheme.id)
    expect(updatedTheme.title).toBe(mockTheme.title)
    expect(updatedTheme.category).toBe(mockTheme.category)
  })
})

// =============================================================================
// BATCH PROCESSING TESTS
// =============================================================================

describe('calculateBatchMonetizationScores', () => {
  test('calculates scores for multiple themes', () => {
    const themes = [mockTheme, { ...mockTheme, id: 'different-id' }]
    const updatedThemes = calculateBatchMonetizationScores(themes)
    
    expect(updatedThemes).toHaveLength(2)
    updatedThemes.forEach(theme => {
      expect(theme.monetizationScore).toBeGreaterThan(0)
      expect(theme.monetizationFactors).toBeDefined()
    })
  })

  test('handles empty theme array', () => {
    const updatedThemes = calculateBatchMonetizationScores([])
    expect(updatedThemes).toHaveLength(0)
  })
})

describe('recalculateScoresWithNewWeights', () => {
  test('recalculates scores with new weights', () => {
    const themeWithFactors = {
      ...mockTheme,
      monetizationScore: 70,
      monetizationFactors: mockFactors,
    }
    
    const newWeights = {
      marketSize: 0.5,
      paymentWillingness: 0.5,
    }
    
    const updatedThemes = recalculateScoresWithNewWeights([themeWithFactors], newWeights)
    
    expect(updatedThemes[0].monetizationScore).not.toBe(70)
    expect(updatedThemes[0].monetizationFactors).toEqual(mockFactors) // factors unchanged
  })

  test('skips themes without monetization factors', () => {
    const themeWithoutFactors = { ...mockTheme, monetizationFactors: undefined }
    const updatedThemes = recalculateScoresWithNewWeights([themeWithoutFactors], {})
    
    expect(updatedThemes[0]).toEqual(themeWithoutFactors)
  })
})

// =============================================================================
// VALIDATION TESTS
// =============================================================================

describe('validateMonetizationFactors', () => {
  test('validates correct factors', () => {
    expect(validateMonetizationFactors(mockFactors)).toBe(true)
  })

  test('rejects invalid factors', () => {
    const invalidFactors = {
      marketSize: 'invalid',
      paymentWillingness: 70,
    }
    
    expect(validateMonetizationFactors(invalidFactors)).toBe(false)
  })

  test('rejects incomplete factors', () => {
    const incompleteFactors = {
      marketSize: 80,
      paymentWillingness: 70,
      // missing other required fields
    }
    
    expect(validateMonetizationFactors(incompleteFactors)).toBe(false)
  })
})

describe('validateMonetizationWeights', () => {
  test('validates correct weights', () => {
    expect(validateMonetizationWeights(DEFAULT_MONETIZATION_WEIGHTS)).toBe(true)
  })

  test('rejects weights that do not sum to 1', () => {
    const invalidWeights = {
      marketSize: 0.5,
      paymentWillingness: 0.5,
      competitionLevel: 0.5,
      revenueModels: 0.5,
      customerAcquisitionCost: 0.5,
      customerLifetimeValue: 0.5,
    }
    
    expect(validateMonetizationWeights(invalidWeights)).toBe(false)
  })
})

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('getFactorDisplayName', () => {
  test('returns correct display names', () => {
    expect(getFactorDisplayName('marketSize')).toBe('市場規模')
    expect(getFactorDisplayName('paymentWillingness')).toBe('支払い意欲度')
    expect(getFactorDisplayName('competitionLevel')).toBe('競合レベル')
  })
})

describe('getFactorDescription', () => {
  test('returns non-empty descriptions', () => {
    const factors: (keyof MonetizationFactors)[] = [
      'marketSize',
      'paymentWillingness',
      'competitionLevel',
      'revenueModels',
      'customerAcquisitionCost',
      'customerLifetimeValue',
    ]
    
    factors.forEach(factor => {
      const description = getFactorDescription(factor)
      expect(description).toBeTruthy()
      expect(typeof description).toBe('string')
    })
  })
})

// =============================================================================
// CONFIGURATION TESTS
// =============================================================================

describe('DEFAULT_MONETIZATION_WEIGHTS', () => {
  test('weights sum to 1.0', () => {
    const sum = Object.values(DEFAULT_MONETIZATION_WEIGHTS).reduce((acc, val) => acc + val, 0)
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.001)
  })

  test('all weights are positive', () => {
    Object.values(DEFAULT_MONETIZATION_WEIGHTS).forEach(weight => {
      expect(weight).toBeGreaterThan(0)
    })
  })
})

describe('SCORE_CONFIG', () => {
  test('has valid configuration values', () => {
    expect(SCORE_CONFIG.MIN_SCORE).toBe(0)
    expect(SCORE_CONFIG.MAX_SCORE).toBe(100)
    expect(SCORE_CONFIG.DECIMAL_PLACES).toBeGreaterThanOrEqual(0)
    expect(SCORE_CONFIG.TREND_ANALYSIS_DAYS).toBeGreaterThan(0)
  })
})