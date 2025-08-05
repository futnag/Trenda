import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TrendDashboard } from '../TrendDashboard'
import { CategoryFilter } from '../CategoryFilter'
import { ThemeCard } from '../ThemeCard'
import { TrendChart } from '../TrendChart'
import { mockThemes } from '@/lib/mock-data'

// Mock the database operations
jest.mock('@/lib/database', () => ({
  themeOperations: {
    getThemes: jest.fn().mockRejectedValue(new Error('Database not available')),
  },
  subscribeToTable: jest.fn().mockReturnValue({
    unsubscribe: jest.fn(),
  }),
}))

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {},
}))

describe('Dashboard Components', () => {
  describe('TrendDashboard', () => {
    it('renders dashboard with mock data when database is unavailable', async () => {
      render(<TrendDashboard />)
      
      expect(screen.getByText('トレンドダッシュボード')).toBeInTheDocument()
      expect(screen.getByText('マネタイズ可能性の高いテーマを発見しましょう')).toBeInTheDocument()
      
      // Wait for mock data to load
      await waitFor(() => {
        expect(screen.getByText('AI駆動のタスク管理アプリ')).toBeInTheDocument()
      })
    })

    it('displays loading state initially', () => {
      render(<TrendDashboard />)
      
      // Should show loading spinner initially
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('allows sorting themes', async () => {
      render(<TrendDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('AI駆動のタスク管理アプリ')).toBeInTheDocument()
      })

      const sortSelect = screen.getByDisplayValue('マネタイズスコア（高い順）')
      fireEvent.change(sortSelect, { target: { value: 'title-asc' } })
      
      // Should trigger re-sorting
      await waitFor(() => {
        expect(sortSelect).toHaveValue('title-asc')
      })
    })
  })

  describe('CategoryFilter', () => {
    const mockOnFilterChange = jest.fn()

    beforeEach(() => {
      mockOnFilterChange.mockClear()
    })

    it('renders filter options', () => {
      render(
        <CategoryFilter
          filters={{}}
          onFilterChange={mockOnFilterChange}
        />
      )
      
      expect(screen.getByText('フィルター')).toBeInTheDocument()
      expect(screen.getByText('カテゴリー')).toBeInTheDocument()
      expect(screen.getByText('競合レベル')).toBeInTheDocument()
      expect(screen.getByText('技術難易度')).toBeInTheDocument()
    })

    it('expands to show advanced filters', () => {
      render(
        <CategoryFilter
          filters={{}}
          onFilterChange={mockOnFilterChange}
        />
      )
      
      const expandButton = screen.getByText('詳細フィルター')
      fireEvent.click(expandButton)
      
      expect(screen.getByText('国・地域')).toBeInTheDocument()
      expect(screen.getByText('年齢層')).toBeInTheDocument()
      expect(screen.getByText('マネタイズスコア')).toBeInTheDocument()
    })

    it('calls onFilterChange when category is selected', () => {
      render(
        <CategoryFilter
          filters={{}}
          onFilterChange={mockOnFilterChange}
        />
      )
      
      const categorySelect = screen.getByLabelText('カテゴリー')
      fireEvent.change(categorySelect, { target: { value: ['productivity'] } })
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        categories: ['productivity']
      })
    })

    it('displays active filters as badges', () => {
      render(
        <CategoryFilter
          filters={{
            categories: ['productivity'],
            competitionLevel: ['low']
          }}
          onFilterChange={mockOnFilterChange}
        />
      )
      
      expect(screen.getByText('生産性')).toBeInTheDocument()
      expect(screen.getByText('低競合')).toBeInTheDocument()
    })

    it('allows clearing all filters', () => {
      render(
        <CategoryFilter
          filters={{
            categories: ['productivity'],
            competitionLevel: ['low']
          }}
          onFilterChange={mockOnFilterChange}
        />
      )
      
      const clearButton = screen.getByText('クリア')
      fireEvent.click(clearButton)
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        categories: undefined,
        competitionLevel: undefined,
        technicalDifficulty: undefined,
        countries: undefined,
        ageGroups: undefined,
        minMonetizationScore: undefined,
        maxMonetizationScore: undefined,
        minMarketSize: undefined,
        maxMarketSize: undefined,
      })
    })
  })

  describe('ThemeCard', () => {
    const mockTheme = mockThemes[0]

    it('renders theme information correctly', () => {
      render(<ThemeCard theme={mockTheme} />)
      
      expect(screen.getByText(mockTheme.title)).toBeInTheDocument()
      expect(screen.getByText(mockTheme.description)).toBeInTheDocument()
      expect(screen.getByText(mockTheme.monetizationScore.toString())).toBeInTheDocument()
      expect(screen.getByText('生産性')).toBeInTheDocument()
      expect(screen.getByText('中競合')).toBeInTheDocument()
      expect(screen.getByText('上級')).toBeInTheDocument()
    })

    it('formats numbers correctly', () => {
      render(<ThemeCard theme={mockTheme} />)
      
      // Market size should be formatted (2500000 -> 2.5M)
      expect(screen.getByText('2.5M')).toBeInTheDocument()
      
      // Revenue should be formatted as currency
      expect(screen.getByText(/¥50,000 - ¥200,000/)).toBeInTheDocument()
    })

    it('displays data sources', () => {
      render(<ThemeCard theme={mockTheme} />)
      
      expect(screen.getByText('データソース')).toBeInTheDocument()
      expect(screen.getByText('google_trends')).toBeInTheDocument()
      expect(screen.getByText('reddit')).toBeInTheDocument()
    })

    it('shows update date', () => {
      render(<ThemeCard theme={mockTheme} />)
      
      const updateDate = new Date(mockTheme.updatedAt).toLocaleDateString('ja-JP')
      expect(screen.getByText(`更新: ${updateDate}`)).toBeInTheDocument()
    })

    it('is clickable and links to theme detail', () => {
      render(<ThemeCard theme={mockTheme} />)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', `/themes/${mockTheme.id}`)
    })
  })

  describe('TrendChart', () => {
    it('renders trend statistics', () => {
      render(<TrendChart themes={mockThemes} />)
      
      expect(screen.getByText('トレンド分析サマリー')).toBeInTheDocument()
      expect(screen.getByText('総テーマ数')).toBeInTheDocument()
      expect(screen.getByText('平均スコア')).toBeInTheDocument()
      expect(screen.getByText('高スコア（80+）')).toBeInTheDocument()
    })

    it('displays category distribution', () => {
      render(<TrendChart themes={mockThemes} />)
      
      expect(screen.getByText('カテゴリー別分布')).toBeInTheDocument()
      expect(screen.getByText('生産性')).toBeInTheDocument()
      expect(screen.getByText('教育')).toBeInTheDocument()
      expect(screen.getByText('金融')).toBeInTheDocument()
    })

    it('shows competition level distribution', () => {
      render(<TrendChart themes={mockThemes} />)
      
      expect(screen.getByText('競合レベル分布')).toBeInTheDocument()
      expect(screen.getByText('低競合')).toBeInTheDocument()
      expect(screen.getByText('中競合')).toBeInTheDocument()
      expect(screen.getByText('高競合')).toBeInTheDocument()
    })

    it('displays score distribution chart', () => {
      render(<TrendChart themes={mockThemes} />)
      
      expect(screen.getByText('スコア分布')).toBeInTheDocument()
      expect(screen.getByText('0-25')).toBeInTheDocument()
      expect(screen.getByText('25-50')).toBeInTheDocument()
      expect(screen.getByText('50-75')).toBeInTheDocument()
      expect(screen.getByText('75-100')).toBeInTheDocument()
    })

    it('handles empty themes array', () => {
      render(<TrendChart themes={[]} />)
      
      expect(screen.getByText('データがありません')).toBeInTheDocument()
    })

    it('calculates statistics correctly', () => {
      const testThemes = [
        { ...mockThemes[0], monetizationScore: 80 },
        { ...mockThemes[1], monetizationScore: 90 },
        { ...mockThemes[2], monetizationScore: 70 },
      ]
      
      render(<TrendChart themes={testThemes} />)
      
      // Average score should be 80
      expect(screen.getByText('80')).toBeInTheDocument()
      
      // High score themes (80+) should be 2
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('filters work together with dashboard', async () => {
      render(<TrendDashboard />)
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('AI駆動のタスク管理アプリ')).toBeInTheDocument()
      })
      
      // Apply a category filter
      const categorySelect = screen.getByLabelText('カテゴリー')
      fireEvent.change(categorySelect, { target: { value: ['productivity'] } })
      
      // Should filter themes
      await waitFor(() => {
        // Should still show productivity themes
        expect(screen.getByText('AI駆動のタスク管理アプリ')).toBeInTheDocument()
        expect(screen.getByText('リモートワーク効率化ツール')).toBeInTheDocument()
      })
    })

    it('real-time updates subscription is set up', () => {
      const mockSubscribe = require('@/lib/database').subscribeToTable
      
      render(<TrendDashboard />)
      
      expect(mockSubscribe).toHaveBeenCalledWith(
        'themes',
        expect.any(Function)
      )
    })
  })
})