import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ThemeDetail } from '../ThemeDetail'
import type { Theme, TrendData, CompetitorAnalysis } from '@/types'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

// Mock child components
jest.mock('../TrendChart', () => {
  return function MockTrendChart({ theme, trendData }: { theme: Theme; trendData: TrendData[] }) {
    return <div data-testid="trend-chart">Trend Chart for {theme.title}</div>
  }
})

jest.mock('../MarketDataSection', () => {
  return function MockMarketDataSection({ theme, trendData }: { theme: Theme; trendData: TrendData[] }) {
    return <div data-testid="market-data-section">Market Data for {theme.title}</div>
  }
})

jest.mock('../TechnicalRequirementsSection', () => {
  return function MockTechnicalRequirementsSection({ theme }: { theme: Theme }) {
    return <div data-testid="technical-requirements-section">Technical Requirements for {theme.title}</div>
  }
})

jest.mock('../DevelopmentTimelineSection', () => {
  return function MockDevelopmentTimelineSection({ theme }: { theme: Theme }) {
    return <div data-testid="development-timeline-section">Development Timeline for {theme.title}</div>
  }
})

jest.mock('../CompetitorAnalysisSection', () => {
  return function MockCompetitorAnalysisSection({ theme, competitors }: { theme: Theme; competitors: CompetitorAnalysis[] }) {
    return <div data-testid="competitor-analysis-section">Competitor Analysis for {theme.title} ({competitors.length} competitors)</div>
  }
})

jest.mock('../RevenueProjection', () => {
  return function MockRevenueProjection({ theme }: { theme: Theme }) {
    return <div data-testid="revenue-projection">Revenue Projection for {theme.title}</div>
  }
})

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
  dataSources: [
    {
      source: 'google_trends',
      searchVolume: 15000,
      growthRate: 12.5,
      timestamp: '2024-01-15T10:00:00Z'
    },
    {
      source: 'reddit',
      searchVolume: 8500,
      growthRate: 8.2,
      timestamp: '2024-01-15T10:00:00Z'
    }
  ],
  monetizationFactors: {
    marketSize: 80,
    paymentWillingness: 75,
    competitionLevel: 60,
    revenueModels: 85,
    customerAcquisitionCost: 45,
    customerLifetimeValue: 90
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
}

const mockTrendData: TrendData[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    themeId: mockTheme.id,
    source: 'google_trends',
    searchVolume: 15000,
    growthRate: 12.5,
    timestamp: '2024-01-15T10:00:00Z'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    themeId: mockTheme.id,
    source: 'reddit',
    searchVolume: 8500,
    growthRate: 8.2,
    timestamp: '2024-01-14T10:00:00Z'
  }
]

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
  }
]

describe('ThemeDetail Component', () => {
  describe('Basic Rendering', () => {
    it('should render theme detail page with all sections', () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      // Check header elements
      expect(screen.getByText('AI-Powered Task Manager')).toBeInTheDocument()
      expect(screen.getByText('An intelligent task management system that uses AI to prioritize and organize tasks automatically.')).toBeInTheDocument()
      
      // Check monetization score
      expect(screen.getByText('85')).toBeInTheDocument()
      expect(screen.getByText('優秀')).toBeInTheDocument()
      
      // Check breadcrumb
      expect(screen.getByText('ダッシュボード')).toBeInTheDocument()
      expect(screen.getByText('テーマ一覧')).toBeInTheDocument()
    })

    it('should render key metrics cards', () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      // Check metric cards
      expect(screen.getByText('市場規模')).toBeInTheDocument()
      expect(screen.getByText('2.5M')).toBeInTheDocument()
      
      expect(screen.getByText('推定月収')).toBeInTheDocument()
      expect(screen.getByText('¥50,000')).toBeInTheDocument()
      
      expect(screen.getByText('競合レベル')).toBeInTheDocument()
      expect(screen.getByText('中競合')).toBeInTheDocument()
      
      expect(screen.getByText('技術難易度')).toBeInTheDocument()
      expect(screen.getByText('中級')).toBeInTheDocument()
    })

    it('should render category and difficulty tags', () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('生産性')).toBeInTheDocument()
      expect(screen.getByText('中競合')).toBeInTheDocument()
      expect(screen.getByText('中級')).toBeInTheDocument()
    })

    it('should render navigation tabs', () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('概要')).toBeInTheDocument()
      expect(screen.getByText('市場データ')).toBeInTheDocument()
      expect(screen.getByText('技術要件')).toBeInTheDocument()
      expect(screen.getByText('開発期間')).toBeInTheDocument()
      expect(screen.getByText('競合分析')).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('should show overview tab by default', () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      // Overview tab should be active
      const overviewTab = screen.getByText('概要').closest('button')
      expect(overviewTab).toHaveClass('border-blue-500', 'text-blue-600')
      
      // Overview content should be visible
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
      expect(screen.getByTestId('revenue-projection')).toBeInTheDocument()
    })

    it('should switch to market data tab when clicked', async () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      const marketTab = screen.getByText('市場データ')
      fireEvent.click(marketTab)

      await waitFor(() => {
        expect(screen.getByTestId('market-data-section')).toBeInTheDocument()
      })

      // Tab should be active
      const marketTabButton = marketTab.closest('button')
      expect(marketTabButton).toHaveClass('border-blue-500', 'text-blue-600')
    })

    it('should switch to technical requirements tab when clicked', async () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      const techTab = screen.getByText('技術要件')
      fireEvent.click(techTab)

      await waitFor(() => {
        expect(screen.getByTestId('technical-requirements-section')).toBeInTheDocument()
      })
    })

    it('should switch to development timeline tab when clicked', async () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      const timelineTab = screen.getByText('開発期間')
      fireEvent.click(timelineTab)

      await waitFor(() => {
        expect(screen.getByTestId('development-timeline-section')).toBeInTheDocument()
      })
    })

    it('should switch to competitor analysis tab when clicked', async () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      const competitorTab = screen.getByText('競合分析')
      fireEvent.click(competitorTab)

      await waitFor(() => {
        expect(screen.getByTestId('competitor-analysis-section')).toBeInTheDocument()
      })
    })
  })

  describe('Data Sources Display', () => {
    it('should render data sources in overview tab', () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('データソース')).toBeInTheDocument()
      expect(screen.getByText('google_trends')).toBeInTheDocument()
      expect(screen.getByText('reddit')).toBeInTheDocument()
    })

    it('should show search volume and growth rate for data sources', () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('検索ボリューム: 15K')).toBeInTheDocument()
      expect(screen.getByText('成長率: +12.5%')).toBeInTheDocument()
      expect(screen.getByText('検索ボリューム: 8.5K')).toBeInTheDocument()
      expect(screen.getByText('成長率: +8.2%')).toBeInTheDocument()
    })

    it('should handle themes without data sources', () => {
      const themeWithoutSources = { ...mockTheme, dataSources: [] }
      
      render(
        <ThemeDetail 
          theme={themeWithoutSources} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.queryByText('データソース')).not.toBeInTheDocument()
    })
  })

  describe('Monetization Score Display', () => {
    it('should show excellent score styling for high scores', () => {
      const highScoreTheme = { ...mockTheme, monetizationScore: 90 }
      
      render(
        <ThemeDetail 
          theme={highScoreTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('90')).toBeInTheDocument()
      expect(screen.getByText('優秀')).toBeInTheDocument()
      expect(screen.getByText('非常に高い収益化可能性があります')).toBeInTheDocument()
    })

    it('should show good score styling for medium scores', () => {
      const mediumScoreTheme = { ...mockTheme, monetizationScore: 70 }
      
      render(
        <ThemeDetail 
          theme={mediumScoreTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('70')).toBeInTheDocument()
      expect(screen.getByText('良好')).toBeInTheDocument()
      expect(screen.getByText('良好な収益化可能性があります')).toBeInTheDocument()
    })

    it('should show needs improvement styling for low scores', () => {
      const lowScoreTheme = { ...mockTheme, monetizationScore: 30 }
      
      render(
        <ThemeDetail 
          theme={lowScoreTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('30')).toBeInTheDocument()
      expect(screen.getByText('要改善')).toBeInTheDocument()
      expect(screen.getByText('収益化には工夫が必要です')).toBeInTheDocument()
    })
  })

  describe('Competition Level Display', () => {
    it('should show low competition info correctly', () => {
      const lowCompetitionTheme = { ...mockTheme, competitionLevel: 'low' as const }
      
      render(
        <ThemeDetail 
          theme={lowCompetitionTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('低競合')).toBeInTheDocument()
      expect(screen.getByText('競合が少なく、参入しやすい市場です')).toBeInTheDocument()
    })

    it('should show high competition info correctly', () => {
      const highCompetitionTheme = { ...mockTheme, competitionLevel: 'high' as const }
      
      render(
        <ThemeDetail 
          theme={highCompetitionTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('高競合')).toBeInTheDocument()
      expect(screen.getByText('競合が多く、独自性が必要です')).toBeInTheDocument()
    })
  })

  describe('Technical Difficulty Display', () => {
    it('should show beginner difficulty info correctly', () => {
      const beginnerTheme = { ...mockTheme, technicalDifficulty: 'beginner' as const }
      
      render(
        <ThemeDetail 
          theme={beginnerTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('初級')).toBeInTheDocument()
      expect(screen.getByText('基本的な技術で実装可能です')).toBeInTheDocument()
    })

    it('should show advanced difficulty info correctly', () => {
      const advancedTheme = { ...mockTheme, technicalDifficulty: 'advanced' as const }
      
      render(
        <ThemeDetail 
          theme={advancedTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText('上級')).toBeInTheDocument()
      expect(screen.getByText('高度な技術スキルが必要です')).toBeInTheDocument()
    })
  })

  describe('Last Updated Display', () => {
    it('should show last updated timestamp', () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      expect(screen.getByText(/最終更新:/)).toBeInTheDocument()
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
          className="custom-theme-detail"
        />
      )

      expect(container.firstChild).toHaveClass('custom-theme-detail')
    })
  })

  describe('Component Integration', () => {
    it('should pass correct props to child components', () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      // Check that child components receive correct props
      expect(screen.getByTestId('trend-chart')).toHaveTextContent('Trend Chart for AI-Powered Task Manager')
      expect(screen.getByTestId('revenue-projection')).toHaveTextContent('Revenue Projection for AI-Powered Task Manager')
    })

    it('should pass competitors data to competitor analysis section', async () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      // Switch to competitor analysis tab
      const competitorTab = screen.getByText('競合分析')
      fireEvent.click(competitorTab)

      await waitFor(() => {
        expect(screen.getByTestId('competitor-analysis-section')).toHaveTextContent('(2 competitors)')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and structure', () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      // Check breadcrumb navigation
      expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
      
      // Check tab navigation
      expect(screen.getByLabelText('Tabs')).toBeInTheDocument()
    })

    it('should have accessible tab buttons', () => {
      render(
        <ThemeDetail 
          theme={mockTheme} 
          trendData={mockTrendData} 
          competitors={mockCompetitors} 
        />
      )

      const tabs = screen.getAllByRole('button')
      tabs.forEach(tab => {
        expect(tab).toBeInTheDocument()
      })
    })
  })
})