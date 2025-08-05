import {
  calculateBaseRevenue,
  calculateMarketAdjustmentFactor,
  calculateRevenueProjection,
  calculateRevenueTimeline,
  calculateRevenueGrowthProjection,
  analyzeRiskFactors,
  identifyRevenueOpportunities,
  performRevenueAnalysis,
  formatCurrency,
  calculatePercentageChange,
  validateRevenueProjection,
  getConfidenceDescription,
  REVENUE_CONFIG,
} from '../revenue-projection'
import type { Theme } from '@/types'

// Mock theme data for testing
const mockTheme: Theme = {
  id: 'test-theme-1',
  title: 'Test Theme',
  description: 'A test theme for revenue projection',
  category: 'productivity',
  monetizationScore: 75,
  marketSize: 2000000,
  competitionLevel: 'medium',
  technicalDifficulty: 'intermediate',
  estimatedRevenue: {
    min: 50000,
    max: 150000,
  },
  dataSources: [
    {
      source: 'google_trends',
      searchVolume: 10000,
      growthRate: 15,
      timestamp: '2024-01-01T00:00:00Z',
    },
  ],
  monetizationFactors: {
    marketSize: 80,
    paymentWillingness: 70,
    competitionLevel: 50,
    revenueModels: 60,
    customerAcquisitionCost: 40,
    customerLifetimeValue: 75,
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockLowCompetitionTheme: Theme = {
  ...mockTheme,
  id: 'low-competition-theme',
  competitionLevel: 'low',
  monetizationScore: 85,
}

const mockHighRiskTheme: Theme = {
  ...mockTheme,
  id: 'high-risk-theme',
  competitionLevel: 'high',
  technicalDifficulty: 'advanced',
  marketSize: 300000,
  monetizationScore: 35,
  monetizationFactors: {
    ...mockTheme.monetizationFactors!,
    paymentWillingness: 30,
  },
}

describe('Revenue Projection Library', () => {
  describe('calculateBaseRevenue', () => {
    it('should calculate base revenue as average of min and max', () => {
      const result = calculateBaseRevenue(mockTheme)
      expect(result).toBe(100000) // (50000 + 150000) / 2
    })

    it('should handle edge cases', () => {
      const zeroRevenueTheme = { ...mockTheme, estimatedRevenue: { min: 0, max: 0 } }
      expect(calculateBaseRevenue(zeroRevenueTheme)).toBe(0)

      const sameRevenueTheme = { ...mockTheme, estimatedRevenue: { min: 100000, max: 100000 } }
      expect(calculateBaseRevenue(sameRevenueTheme)).toBe(100000)
    })
  })

  describe('calculateMarketAdjustmentFactor', () => {
    it('should calculate adjustment factor based on theme characteristics', () => {
      const result = calculateMarketAdjustmentFactor(mockTheme)
      
      // Should be a positive number
      expect(result).toBeGreaterThan(0)
      expect(typeof result).toBe('number')
    })

    it('should give higher factor for better themes', () => {
      const goodTheme = {
        ...mockTheme,
        marketSize: 5000000,
        monetizationScore: 90,
        competitionLevel: 'low' as const,
        technicalDifficulty: 'beginner' as const,
      }

      const poorTheme = {
        ...mockTheme,
        marketSize: 100000,
        monetizationScore: 30,
        competitionLevel: 'high' as const,
        technicalDifficulty: 'advanced' as const,
      }

      const goodFactor = calculateMarketAdjustmentFactor(goodTheme)
      const poorFactor = calculateMarketAdjustmentFactor(poorTheme)

      expect(goodFactor).toBeGreaterThan(poorFactor)
    })

    it('should handle themes without monetization factors', () => {
      const themeWithoutFactors = { ...mockTheme }
      delete themeWithoutFactors.monetizationFactors

      const result = calculateMarketAdjustmentFactor(themeWithoutFactors)
      expect(result).toBeGreaterThan(0)
      expect(typeof result).toBe('number')
    })
  })

  describe('calculateRevenueProjection', () => {
    it('should calculate revenue projection for different timeframes', () => {
      const monthlyProjection = calculateRevenueProjection(mockTheme, 'month')
      const quarterlyProjection = calculateRevenueProjection(mockTheme, 'quarter')
      const yearlyProjection = calculateRevenueProjection(mockTheme, 'year')

      expect(monthlyProjection.timeframe).toBe('month')
      expect(quarterlyProjection.timeframe).toBe('quarter')
      expect(yearlyProjection.timeframe).toBe('year')

      // Quarterly should be roughly 3x monthly, yearly should be roughly 12x monthly
      expect(quarterlyProjection.scenarios.realistic).toBeCloseTo(
        monthlyProjection.scenarios.realistic * 3,
        -2 // Allow for rounding differences
      )
      expect(yearlyProjection.scenarios.realistic).toBeCloseTo(
        monthlyProjection.scenarios.realistic * 12,
        -2
      )
    })

    it('should have conservative < realistic < optimistic scenarios', () => {
      const projection = calculateRevenueProjection(mockTheme)

      expect(projection.scenarios.conservative).toBeLessThan(projection.scenarios.realistic)
      expect(projection.scenarios.realistic).toBeLessThan(projection.scenarios.optimistic)
    })

    it('should include assumptions', () => {
      const projection = calculateRevenueProjection(mockTheme)

      expect(projection.assumptions).toBeDefined()
      expect(projection.assumptions.length).toBeGreaterThan(0)
      
      // Should include basic assumptions
      const factorNames = projection.assumptions.map(a => a.factor)
      expect(factorNames).toContain('市場規模')
      expect(factorNames).toContain('マネタイズスコア')
      expect(factorNames).toContain('競合レベル')
      expect(factorNames).toContain('技術難易度')
    })

    it('should handle custom multipliers', () => {
      const customOptions = {
        customMultipliers: {
          conservative: 0.5,
          realistic: 1.0,
          optimistic: 2.0,
        },
      }

      const projection = calculateRevenueProjection(mockTheme, 'month', customOptions)
      const defaultProjection = calculateRevenueProjection(mockTheme, 'month')

      // Custom multipliers should affect the results
      expect(projection.scenarios.conservative).not.toBe(defaultProjection.scenarios.conservative)
    })
  })

  describe('calculateRevenueTimeline', () => {
    it('should calculate timeline milestones', () => {
      const timeline = calculateRevenueTimeline(mockTheme)

      expect(timeline.mvpToFirstRevenue).toBeDefined()
      expect(timeline.to10k).toBeDefined()
      expect(timeline.to100k).toBeDefined()

      // Check that amounts are reasonable
      expect(timeline.mvpToFirstRevenue.amount).toBeGreaterThan(0)
      expect(timeline.to10k.amount).toBe(10000)
      expect(timeline.to100k.amount).toBe(100000)

      // Check that periods are strings
      expect(typeof timeline.mvpToFirstRevenue.period).toBe('string')
      expect(typeof timeline.to10k.period).toBe('string')
      expect(typeof timeline.to100k.period).toBe('string')
    })

    it('should adjust timeline based on theme difficulty', () => {
      const easyTheme = { ...mockTheme, technicalDifficulty: 'beginner' as const }
      const hardTheme = { ...mockTheme, technicalDifficulty: 'advanced' as const }

      const easyTimeline = calculateRevenueTimeline(easyTheme)
      const hardTimeline = calculateRevenueTimeline(hardTheme)

      // Hard themes should generally take longer (this is a rough check)
      expect(hardTimeline.mvpToFirstRevenue.period.length).toBeGreaterThanOrEqual(
        easyTimeline.mvpToFirstRevenue.period.length
      )
    })
  })

  describe('calculateRevenueGrowthProjection', () => {
    it('should calculate growth projection over time', () => {
      const projection = calculateRevenueGrowthProjection(mockTheme, 12)

      expect(projection.monthlyProjections).toHaveLength(12)
      expect(projection.totalProjection).toBeDefined()
      expect(projection.peakMonth).toBeGreaterThan(0)
      expect(projection.plateauRevenue).toBeDefined()

      // Check that monthly projections are in ascending order (at least initially)
      const firstMonth = projection.monthlyProjections[0]
      const thirdMonth = projection.monthlyProjections[2]
      expect(thirdMonth.realistic).toBeGreaterThan(firstMonth.realistic)
    })

    it('should handle different projection lengths', () => {
      const shortProjection = calculateRevenueGrowthProjection(mockTheme, 6)
      const longProjection = calculateRevenueGrowthProjection(mockTheme, 24)

      expect(shortProjection.monthlyProjections).toHaveLength(6)
      expect(longProjection.monthlyProjections).toHaveLength(24)
    })
  })

  describe('analyzeRiskFactors', () => {
    it('should identify risk factors for high-risk themes', () => {
      const risks = analyzeRiskFactors(mockHighRiskTheme)

      expect(risks.length).toBeGreaterThan(0)
      
      // Should identify high competition risk
      const competitionRisk = risks.find(r => r.factor.includes('競合'))
      expect(competitionRisk).toBeDefined()
      expect(competitionRisk?.impact).toBe('high')

      // Should identify technical complexity risk
      const techRisk = risks.find(r => r.factor.includes('技術'))
      expect(techRisk).toBeDefined()
    })

    it('should identify fewer risks for low-risk themes', () => {
      const lowRiskTheme = {
        ...mockTheme,
        competitionLevel: 'low' as const,
        technicalDifficulty: 'beginner' as const,
        marketSize: 5000000,
        monetizationScore: 85,
      }

      const risks = analyzeRiskFactors(lowRiskTheme)
      const highRiskThemeRisks = analyzeRiskFactors(mockHighRiskTheme)

      expect(risks.length).toBeLessThan(highRiskThemeRisks.length)
    })
  })

  describe('identifyRevenueOpportunities', () => {
    it('should identify opportunities for good themes', () => {
      const opportunities = identifyRevenueOpportunities(mockLowCompetitionTheme)

      expect(opportunities.length).toBeGreaterThan(0)
      
      // Should identify blue ocean opportunity
      const blueOceanOpp = opportunities.find(o => o.opportunity.includes('ブルーオーシャン'))
      expect(blueOceanOpp).toBeDefined()
      expect(blueOceanOpp?.potential).toBe('high')
    })

    it('should identify different opportunities based on theme characteristics', () => {
      const highScoreTheme = { ...mockTheme, monetizationScore: 85 }
      const largeMarketTheme = { ...mockTheme, marketSize: 5000000 }
      const easyTheme = { ...mockTheme, technicalDifficulty: 'beginner' as const }

      const highScoreOpps = identifyRevenueOpportunities(highScoreTheme)
      const largeMarketOpps = identifyRevenueOpportunities(largeMarketTheme)
      const easyOpps = identifyRevenueOpportunities(easyTheme)

      // Each should have different opportunities
      expect(highScoreOpps.some(o => o.opportunity.includes('収益化'))).toBe(true)
      expect(largeMarketOpps.some(o => o.opportunity.includes('大規模'))).toBe(true)
      expect(easyOpps.some(o => o.opportunity.includes('MVP'))).toBe(true)
    })
  })

  describe('performRevenueAnalysis', () => {
    it('should perform comprehensive analysis', () => {
      const analysis = performRevenueAnalysis(mockTheme)

      expect(analysis.projection).toBeDefined()
      expect(analysis.timeline).toBeDefined()
      expect(analysis.riskFactors).toBeDefined()
      expect(analysis.opportunities).toBeDefined()

      // Growth projection should be undefined by default
      expect(analysis.growthProjection).toBeUndefined()
    })

    it('should include growth projection when requested', () => {
      const analysis = performRevenueAnalysis(mockTheme, {
        includeGrowthProjection: true,
        timeHorizonMonths: 18,
      })

      expect(analysis.growthProjection).toBeDefined()
      expect(analysis.growthProjection?.monthlyProjections).toHaveLength(18)
    })
  })

  describe('Utility Functions', () => {
    describe('formatCurrency', () => {
      it('should format currency correctly', () => {
        expect(formatCurrency(100000)).toBe('￥100,000')
        expect(formatCurrency(1500)).toBe('￥1,500')
        expect(formatCurrency(0)).toBe('￥0')
      })
    })

    describe('calculatePercentageChange', () => {
      it('should calculate percentage change correctly', () => {
        expect(calculatePercentageChange(100, 150)).toBe(50)
        expect(calculatePercentageChange(100, 50)).toBe(-50)
        expect(calculatePercentageChange(0, 100)).toBe(100)
        expect(calculatePercentageChange(100, 100)).toBe(0)
      })

      it('should handle zero old value', () => {
        expect(calculatePercentageChange(0, 100)).toBe(100)
        expect(calculatePercentageChange(0, 0)).toBe(0)
      })
    })

    describe('validateRevenueProjection', () => {
      it('should validate correct revenue projection', () => {
        const validProjection = {
          timeframe: 'month',
          scenarios: {
            conservative: 50000,
            realistic: 100000,
            optimistic: 200000,
          },
          assumptions: [
            {
              factor: 'Test Factor',
              value: 75,
              confidence: 80,
              source: 'Test Source',
            },
          ],
        }

        expect(validateRevenueProjection(validProjection)).toBe(true)
      })

      it('should reject invalid revenue projection', () => {
        const invalidProjection = {
          timeframe: 'invalid',
          scenarios: {
            conservative: -100, // Invalid negative value
          },
        }

        expect(validateRevenueProjection(invalidProjection)).toBe(false)
      })
    })

    describe('getConfidenceDescription', () => {
      it('should return correct confidence descriptions', () => {
        expect(getConfidenceDescription(90)).toBe('高信頼度')
        expect(getConfidenceDescription(70)).toBe('中信頼度')
        expect(getConfidenceDescription(50)).toBe('低信頼度')
        expect(getConfidenceDescription(30)).toBe('要検証')
      })
    })
  })

  describe('Configuration Constants', () => {
    it('should have valid configuration values', () => {
      expect(REVENUE_CONFIG.CONSERVATIVE_MULTIPLIER).toBeLessThan(REVENUE_CONFIG.REALISTIC_MULTIPLIER)
      expect(REVENUE_CONFIG.REALISTIC_MULTIPLIER).toBeLessThan(REVENUE_CONFIG.OPTIMISTIC_MULTIPLIER)

      expect(REVENUE_CONFIG.COMPETITION_FACTORS.low).toBeGreaterThan(REVENUE_CONFIG.COMPETITION_FACTORS.high)
      expect(REVENUE_CONFIG.DIFFICULTY_FACTORS.beginner).toBeGreaterThan(REVENUE_CONFIG.DIFFICULTY_FACTORS.advanced)

      // Growth patterns should have reasonable values
      Object.values(REVENUE_CONFIG.GROWTH_PATTERNS).forEach(pattern => {
        expect(pattern.monthlyGrowthRate).toBeGreaterThan(0)
        expect(pattern.monthlyGrowthRate).toBeLessThan(1) // Less than 100% monthly growth
        expect(pattern.plateauMonth).toBeGreaterThan(0)
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle themes with missing optional data', () => {
      const minimalTheme: Theme = {
        id: 'minimal-theme',
        title: 'Minimal Theme',
        description: 'A minimal theme',
        category: 'productivity',
        monetizationScore: 50,
        marketSize: 1000000,
        competitionLevel: 'medium',
        technicalDifficulty: 'intermediate',
        estimatedRevenue: { min: 10000, max: 50000 },
        dataSources: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      expect(() => calculateRevenueProjection(minimalTheme)).not.toThrow()
      expect(() => calculateRevenueTimeline(minimalTheme)).not.toThrow()
      expect(() => performRevenueAnalysis(minimalTheme)).not.toThrow()
    })

    it('should handle extreme values gracefully', () => {
      const extremeTheme: Theme = {
        ...mockTheme,
        marketSize: 0,
        monetizationScore: 0,
        estimatedRevenue: { min: 0, max: 0 },
      }

      const projection = calculateRevenueProjection(extremeTheme)
      expect(projection.scenarios.conservative).toBeGreaterThanOrEqual(0)
      expect(projection.scenarios.realistic).toBeGreaterThanOrEqual(0)
      expect(projection.scenarios.optimistic).toBeGreaterThanOrEqual(0)
    })
  })
})