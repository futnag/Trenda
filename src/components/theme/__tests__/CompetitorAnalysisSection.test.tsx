import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CompetitorAnalysisSection } from '../CompetitorAnalysisSection'
import type { Theme, CompetitorAnalysis } from '@/types'

const mockTheme: Theme = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'AI-Powered Task Manager',
  description: 'An intelligent task management system that uses AI to prioritize and organize tasks automatically.',
  category: 'productivity',
  monetizationScore: 85,
  marketSize: 2500000,
  competitionLevel: 'medium',
  technicalDifficulty: 'intermediate',
  estimatedRevenue: {
    min: 50000,
    max: 200000
  },
  dataSources: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
}

const mockCompetitors: CompetitorAnalysis[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    themeId: mockTheme.id,
    competitorName: 'TaskMaster Pro',
    competitorUrl: 'https://taskmaster.com',
    pricingModel: 'subscription',
    estimatedRevenue: 150000,
    userCount: 50000,
    features: ['AI prioritization', 'Team collaboration', 'Mobile app'],
    marketShare: 25,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    themeId: mockTheme.id,
    competitorName: 'Smart Planner',
    competitorUrl: 'https://smartplanner.io',
    pricingModel: 'freemium',
    estimatedRevenue: 80000,
    userCount: 100000,
    features: ['Calendar integration', 'Task automation'],
    marketShare: 15,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174005',
    themeId: mockTheme.id,
    competitorName: 'Simple Tasks',
    competitorUrl: 'https://simpletasks.app',
    pricingModel: 'one-time',
    estimatedRevenue: 30000,
    userCount: 25000,
    features: ['Basic task management', 'Reminders'],
    createdAt: '2024-01-01T00:00:00Z'
  }
]

const mockLowCompetitionCompetitors: CompetitorAnalysis[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174006',
    themeId: mockTheme.id,
    competitorName: 'Only Competitor',
    competitorUrl: 'https://onlycompetitor.com',
    pricingModel: 'subscription',
    estimatedRevenue: 50000,
    userCount: 10000,
    features: ['Basic features'],
    createdAt: '2024-01-01T00:00:00Z'
  }
]

describe('CompetitorAnalysisSection Component', () => {
  describe('Basic Rendering', () => {
    it('should render competitor analysis section with all main components', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      // Check main sections
      expect(screen.getByText('競合環境概要')).toBeInTheDocument()
      expect(screen.getByText('主要競合企業')).toBeInTheDocument()
      expect(screen.getByText('価格モデル分析')).toBeInTheDocument()
      expect(screen.getByText('競争優位の機会')).toBeInTheDocument()
      expect(screen.getByText('市場ギャップ')).toBeInTheDocument()
      expect(screen.getByText('ポジショニング戦略')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors}
          className="custom-competitor-analysis"
        />
      )

      expect(container.firstChild).toHaveClass('custom-competitor-analysis')
    })
  })

  describe('Competitive Landscape Overview - Requirement 4.1', () => {
    it('should display correct number of competitors', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('3社')).toBeInTheDocument()
      expect(screen.getByText('直接・間接競合')).toBeInTheDocument()
    })

    it('should calculate and display market saturation correctly for medium competition', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('低飽和')).toBeInTheDocument()
      expect(screen.getByText('ブルーオーシャン市場')).toBeInTheDocument()
      expect(screen.getByText('参入しやすく、先行者利益を得やすい')).toBeInTheDocument()
    })

    it('should display average revenue when available', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      // Average of 150000, 80000, 30000 = 86667 (rounded to 86667)
      expect(screen.getByText('￥86,667')).toBeInTheDocument()
      expect(screen.getByText('月間推定')).toBeInTheDocument()
    })

    it('should display average user count when available', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      // Average of 50000, 100000, 25000 = 58333 (rounded to 58333)
      expect(screen.getByText('58.3K')).toBeInTheDocument()
      expect(screen.getByText('アクティブユーザー')).toBeInTheDocument()
    })

    it('should show market opportunity based on saturation level', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('市場機会')).toBeInTheDocument()
      expect(screen.getByText('参入しやすく、先行者利益を得やすい')).toBeInTheDocument()
    })
  })

  describe('Market Saturation Analysis - Requirement 4.2', () => {
    it('should classify low saturation correctly (≤3 competitors)', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('低飽和')).toBeInTheDocument()
      expect(screen.getByText('ブルーオーシャン市場')).toBeInTheDocument()
    })

    it('should classify medium saturation correctly (4-10 competitors)', () => {
      const mediumCompetitors = [
        ...mockCompetitors,
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `competitor-${i}`,
          themeId: mockTheme.id,
          competitorName: `Competitor ${i + 4}`,
          pricingModel: 'subscription',
          createdAt: '2024-01-01T00:00:00Z'
        }))
      ]

      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mediumCompetitors} 
        />
      )

      expect(screen.getByText('中飽和')).toBeInTheDocument()
      expect(screen.getByText('バランス市場')).toBeInTheDocument()
      expect(screen.getByText('差別化により成功可能')).toBeInTheDocument()
    })

    it('should classify high saturation correctly (>10 competitors)', () => {
      const highCompetitors = [
        ...mockCompetitors,
        ...Array.from({ length: 9 }, (_, i) => ({
          id: `competitor-${i}`,
          themeId: mockTheme.id,
          competitorName: `Competitor ${i + 4}`,
          pricingModel: 'subscription',
          createdAt: '2024-01-01T00:00:00Z'
        }))
      ]

      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={highCompetitors} 
        />
      )

      expect(screen.getByText('高飽和')).toBeInTheDocument()
      expect(screen.getByText('レッドオーシャン市場')).toBeInTheDocument()
      expect(screen.getByText('独自性と革新が必要')).toBeInTheDocument()
    })
  })

  describe('Blue Ocean Opportunity Highlighting - Requirement 4.3', () => {
    it('should highlight blue ocean opportunity when competitors are few', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockLowCompetitionCompetitors} 
        />
      )

      expect(screen.getByText('ブルーオーシャン市場')).toBeInTheDocument()
      expect(screen.getByText('参入しやすく、先行者利益を得やすい')).toBeInTheDocument()
    })

    it('should show blue ocean message when no competitors exist', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={[]} 
        />
      )

      expect(screen.getByText('競合データがありません')).toBeInTheDocument()
      expect(screen.getByText('ブルーオーシャンの可能性')).toBeInTheDocument()
      expect(screen.getByText('競合が少ない、または存在しない可能性があります。これは先行者利益を得る絶好の機会かもしれません。')).toBeInTheDocument()
    })

    it('should identify market gaps as blue ocean opportunities', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('市場ギャップ')).toBeInTheDocument()
      expect(screen.getByText('これらの機能は競合が提供していない可能性があり、ブルーオーシャンの機会となります。')).toBeInTheDocument()
      
      // Check for some expected market gaps
      expect(screen.getByText('モバイルファースト設計')).toBeInTheDocument()
      expect(screen.getByText('AI/ML機能統合')).toBeInTheDocument()
    })
  })

  describe('Competitor List Display', () => {
    it('should display all competitor information correctly', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      // Check first competitor
      expect(screen.getByText('TaskMaster Pro')).toBeInTheDocument()
      expect(screen.getByText('https://taskmaster.com')).toBeInTheDocument()
      expect(screen.getAllByText('subscription')).toHaveLength(2) // Appears in competitor list and pricing analysis
      expect(screen.getByText('￥150,000')).toBeInTheDocument()
      expect(screen.getByText('50.0K')).toBeInTheDocument()
      expect(screen.getAllByText('AI prioritization')).toHaveLength(2) // Appears in competitor list and competitive advantages
      expect(screen.getAllByText('Team collaboration')).toHaveLength(2) // Appears in competitor list and competitive advantages
      expect(screen.getAllByText('Mobile app')).toHaveLength(2) // Appears in competitor list and competitive advantages

      // Check second competitor
      expect(screen.getByText('Smart Planner')).toBeInTheDocument()
      expect(screen.getByText('https://smartplanner.io')).toBeInTheDocument()
      // freemium already checked above as it appears multiple times
      expect(screen.getByText('￥80,000')).toBeInTheDocument()
      expect(screen.getByText('100.0K')).toBeInTheDocument()
      expect(screen.getAllByText('Calendar integration')).toHaveLength(2) // Appears in competitor list and competitive advantages
      expect(screen.getAllByText('Task automation')).toHaveLength(2) // Appears in competitor list and competitive advantages
    })

    it('should handle competitors with missing optional data', () => {
      const incompleteCompetitor: CompetitorAnalysis = {
        id: '123e4567-e89b-12d3-a456-426614174007',
        themeId: mockTheme.id,
        competitorName: 'Minimal Competitor',
        createdAt: '2024-01-01T00:00:00Z'
      }

      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={[incompleteCompetitor]} 
        />
      )

      expect(screen.getByText('Minimal Competitor')).toBeInTheDocument()
      // Should not crash when optional fields are missing
    })

    it('should make competitor URLs clickable', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      const link = screen.getByText('https://taskmaster.com')
      expect(link).toHaveAttribute('href', 'https://taskmaster.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Pricing Model Analysis', () => {
    it('should analyze and display pricing model distribution', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('価格モデル分析')).toBeInTheDocument()
      expect(screen.getAllByText('subscription')).toHaveLength(2) // Appears in competitor list and pricing analysis
      expect(screen.getAllByText('freemium')).toHaveLength(2) // Appears in competitor list and pricing analysis
      expect(screen.getAllByText('one-time')).toHaveLength(2) // Appears in competitor list and pricing analysis
    })

    it('should provide pricing strategy recommendations', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('価格戦略の提案')).toBeInTheDocument()
      expect(screen.getByText(/最も一般的な価格モデルは/)).toBeInTheDocument()
    })
  })

  describe('Competitive Advantages and Market Gaps', () => {
    it('should identify competitive advantages based on feature frequency', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('競争優位の機会')).toBeInTheDocument()
      expect(screen.getByText('これらの機能は競合の半数未満しか提供していないため、差別化の機会があります。')).toBeInTheDocument()
    })

    it('should suggest market gaps for blue ocean opportunities', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('市場ギャップ')).toBeInTheDocument()
      
      // Check for expected market gaps that are not in competitor features
      const expectedGaps = ['モバイルファースト設計', 'AI/ML機能統合', 'リアルタイム協業', 'オフライン対応', 'カスタマイズ性']
      expectedGaps.forEach(gap => {
        expect(screen.getByText(gap)).toBeInTheDocument()
      })
    })
  })

  describe('Positioning Strategy Recommendations', () => {
    it('should provide market leadership strategy for low saturation', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockLowCompetitionCompetitors} 
        />
      )

      expect(screen.getByText('ポジショニング戦略')).toBeInTheDocument()
      expect(screen.getByText('市場リーダーシップ')).toBeInTheDocument()
      expect(screen.getByText('先行者利益を活かし、市場標準を確立する')).toBeInTheDocument()
      expect(screen.getByText('高優先度')).toBeInTheDocument()
    })

    it('should provide differentiation strategy for medium saturation', () => {
      const mediumCompetitors = [
        ...mockCompetitors,
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `competitor-${i}`,
          themeId: mockTheme.id,
          competitorName: `Competitor ${i + 4}`,
          pricingModel: 'subscription',
          createdAt: '2024-01-01T00:00:00Z'
        }))
      ]

      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mediumCompetitors} 
        />
      )

      expect(screen.getByText('差別化戦略')).toBeInTheDocument()
      expect(screen.getByText('独自機能や優れたUXで競合と差別化する')).toBeInTheDocument()
    })

    it('should provide niche strategy for high saturation', () => {
      const highCompetitors = [
        ...mockCompetitors,
        ...Array.from({ length: 9 }, (_, i) => ({
          id: `competitor-${i}`,
          themeId: mockTheme.id,
          competitorName: `Competitor ${i + 4}`,
          pricingModel: 'subscription',
          createdAt: '2024-01-01T00:00:00Z'
        }))
      ]

      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={highCompetitors} 
        />
      )

      expect(screen.getByText('ニッチ戦略')).toBeInTheDocument()
      expect(screen.getByText('特定セグメントに特化して競争を避ける')).toBeInTheDocument()
    })

    it('should provide gap strategy when market gaps exist', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('ギャップ戦略')).toBeInTheDocument()
      expect(screen.getByText('競合が対応していない機能やニーズに焦点を当てる')).toBeInTheDocument()
      expect(screen.getAllByText('中優先度')).toHaveLength(2) // Gap strategy and pricing strategy both have medium priority
    })

    it('should provide pricing strategy when revenue data is available', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('価格戦略')).toBeInTheDocument()
      expect(screen.getByText(/市場平均（￥86,667）を参考に価格設定する/)).toBeInTheDocument()
    })
  })

  describe('Number Formatting', () => {
    it('should format large numbers correctly', () => {
      const largeNumberCompetitor: CompetitorAnalysis = {
        id: '123e4567-e89b-12d3-a456-426614174008',
        themeId: mockTheme.id,
        competitorName: 'Large Competitor',
        estimatedRevenue: 1500000,
        userCount: 2500000,
        createdAt: '2024-01-01T00:00:00Z'
      }

      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={[largeNumberCompetitor]} 
        />
      )

      expect(screen.getAllByText('￥1,500,000')).toHaveLength(2) // Appears in overview and competitor list
      expect(screen.getAllByText('2.5M')).toHaveLength(2) // Appears in overview and competitor list
    })

    it('should format currency in Japanese yen', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      // Check that currency is formatted with ¥ symbol
      expect(screen.getByText('￥150,000')).toBeInTheDocument()
      expect(screen.getByText('￥80,000')).toBeInTheDocument()
      expect(screen.getByText('￥30,000')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty competitors array gracefully', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={[]} 
        />
      )

      expect(screen.getByText('競合データがありません')).toBeInTheDocument()
      expect(screen.getByText('このテーマの競合分析データが収集されていません。')).toBeInTheDocument()
      expect(screen.getByText('ブルーオーシャンの可能性')).toBeInTheDocument()
    })

    it('should handle competitors with null/undefined values', () => {
      const incompleteCompetitors: CompetitorAnalysis[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174009',
          themeId: mockTheme.id,
          competitorName: 'Incomplete Competitor',
          competitorUrl: undefined,
          pricingModel: undefined,
          estimatedRevenue: undefined,
          userCount: undefined,
          features: undefined,
          marketShare: undefined,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ]

      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={incompleteCompetitors} 
        />
      )

      expect(screen.getByText('Incomplete Competitor')).toBeInTheDocument()
      // Should not crash and should handle missing data gracefully
    })

    it('should handle competitors with empty features array', () => {
      const noFeaturesCompetitor: CompetitorAnalysis[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174010',
          themeId: mockTheme.id,
          competitorName: 'No Features Competitor',
          features: [],
          createdAt: '2024-01-01T00:00:00Z'
        }
      ]

      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={noFeaturesCompetitor} 
        />
      )

      expect(screen.getByText('No Features Competitor')).toBeInTheDocument()
      // Should not show features section if no features exist
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: '競合環境概要' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: '主要競合企業' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: '価格モデル分析' })).toBeInTheDocument()
    })

    it('should have accessible links for competitor URLs', () => {
      render(
        <CompetitorAnalysisSection 
          theme={mockTheme} 
          competitors={mockCompetitors} 
        />
      )

      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      })
    })
  })
})