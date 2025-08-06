import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MultiDimensionalFilter } from '../MultiDimensionalFilter'
import { DemographicCrossAnalysis } from '../DemographicCrossAnalysis'
import { SegmentComparison } from '../SegmentComparison'
import { DemographicFilteringDashboard } from '../DemographicFilteringDashboard'
import { DEFAULT_DEMOGRAPHIC_FILTERS } from '../../../types/regional'

// Mock the regional database operations
jest.mock('../../../lib/regional-database', () => ({
  demographicFilterOperations: {
    filterThemesByDemographics: jest.fn(),
    performCrossAnalysis: jest.fn(),
  },
  filterStateOperations: {
    getUserFilterStates: jest.fn(),
    saveFilterState: jest.fn(),
    incrementFilterUsage: jest.fn(),
    deleteFilterState: jest.fn(),
  },
}))

describe('MultiDimensionalFilter', () => {
  const mockOnFiltersChange = jest.fn()
  const mockOnSaveFilter = jest.fn()
  const mockOnLoadFilter = jest.fn()
  const mockOnDeleteFilter = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders multi-dimensional filter with sections', () => {
    render(
      <MultiDimensionalFilter
        filters={DEFAULT_DEMOGRAPHIC_FILTERS}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByText('多次元フィルター')).toBeInTheDocument()
    expect(screen.getByText('地理的')).toBeInTheDocument()
    expect(screen.getByText('人口統計')).toBeInTheDocument()
    expect(screen.getByText('社会経済')).toBeInTheDocument()
    expect(screen.getByText('行動')).toBeInTheDocument()
  })

  it('shows estimated segment size', () => {
    render(
      <MultiDimensionalFilter
        filters={DEFAULT_DEMOGRAPHIC_FILTERS}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByText('推定セグメントサイズ')).toBeInTheDocument()
    expect(screen.getByText(/人/)).toBeInTheDocument()
    expect(screen.getByText('全人口に対する割合')).toBeInTheDocument()
  })

  it('switches between filter sections', () => {
    render(
      <MultiDimensionalFilter
        filters={DEFAULT_DEMOGRAPHIC_FILTERS}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    // Click demographic section
    fireEvent.click(screen.getByText('人口統計'))
    expect(screen.getByText('年齢層')).toBeInTheDocument()
    expect(screen.getByText('性別')).toBeInTheDocument()

    // Click socioeconomic section
    fireEvent.click(screen.getByText('社会経済'))
    expect(screen.getByText('所得層')).toBeInTheDocument()
  })

  it('handles country selection with presets', () => {
    render(
      <MultiDimensionalFilter
        filters={DEFAULT_DEMOGRAPHIC_FILTERS}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    // Click geographic section (default)
    expect(screen.getByText('国・地域')).toBeInTheDocument()
    
    // Click North America preset
    fireEvent.click(screen.getByText(/北米/))
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_DEMOGRAPHIC_FILTERS,
      countries: ['US', 'CA', 'MX'],
    })
  })

  it('shows filter combinations when filters are applied', () => {
    const filtersWithCountries = {
      ...DEFAULT_DEMOGRAPHIC_FILTERS,
      countries: ['US', 'JP'],
      ageGroups: ['25-34', '35-44'],
    }

    render(
      <MultiDimensionalFilter
        filters={filtersWithCountries}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByText('推奨フィルター組み合わせ')).toBeInTheDocument()
  })

  it('handles saving filters', () => {
    render(
      <MultiDimensionalFilter
        filters={DEFAULT_DEMOGRAPHIC_FILTERS}
        onFiltersChange={mockOnFiltersChange}
        onSaveFilter={mockOnSaveFilter}
      />
    )

    fireEvent.click(screen.getByText('フィルターを保存'))
    expect(screen.getByText('フィルター設定を保存')).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText('例: 北米の若年層高所得者')
    fireEvent.change(nameInput, { target: { value: 'Test Filter' } })

    fireEvent.click(screen.getByText('保存'))
    expect(mockOnSaveFilter).toHaveBeenCalledWith('Test Filter', undefined, false)
  })
})

describe('DemographicCrossAnalysis', () => {
  const mockOnFiltersChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows message when no valid filters are applied', () => {
    render(
      <DemographicCrossAnalysis
        filters={{}}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByText('人口統計学的クロス分析')).toBeInTheDocument()
    expect(screen.getByText('分析を開始するには、フィルター条件を設定してください')).toBeInTheDocument()
  })

  it('loads cross analysis when valid filters are provided', async () => {
    const { demographicFilterOperations } = require('../../../lib/regional-database')
    const mockAnalysis = {
      segments: [
        {
          segmentId: 'segment-1',
          name: 'Test Segment',
          description: 'Test Description',
          demographics: {},
          themes: [
            {
              themeId: 'theme-1',
              title: 'Test Theme',
              relevanceScore: 85,
              marketPotential: 75,
              competitionLevel: 'low',
              estimatedRevenue: { min: 10000, max: 50000 },
            },
          ],
          totalMarketSize: 1000000,
          averageRelevance: 85,
        },
      ],
      comparisons: [],
      insights: [
        {
          type: 'opportunity',
          title: 'Test Insight',
          description: 'Test insight description',
          confidence: 80,
          impact: 'high',
          actionable: true,
        },
      ],
      createdAt: '2024-01-01T00:00:00Z',
    }

    demographicFilterOperations.performCrossAnalysis.mockResolvedValue({
      data: mockAnalysis,
      error: null,
    })

    render(
      <DemographicCrossAnalysis
        filters={{ countries: ['US'], ageGroups: ['25-34'] }}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Segment')).toBeInTheDocument()
      expect(screen.getByText('Test Theme')).toBeInTheDocument()
    })
  })

  it('switches between view modes', async () => {
    const { demographicFilterOperations } = require('../../../lib/regional-database')
    demographicFilterOperations.performCrossAnalysis.mockResolvedValue({
      data: {
        segments: [],
        comparisons: [],
        insights: [],
        createdAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    })

    render(
      <DemographicCrossAnalysis
        filters={{ countries: ['US'] }}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('セグメント')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('インサイト'))
    expect(screen.getByText('分析インサイト')).toBeInTheDocument()
  })
})

describe('SegmentComparison', () => {
  const mockOnSegmentUpdate = jest.fn()
  const mockOnSegmentRemove = jest.fn()

  const mockSegments = [
    {
      id: 'segment-1',
      name: 'Segment A',
      filters: { countries: ['US'], ageGroups: ['25-34'] },
      color: '#3B82F6',
    },
    {
      id: 'segment-2',
      name: 'Segment B',
      filters: { countries: ['JP'], ageGroups: ['35-44'] },
      color: '#EF4444',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows message when no segments are provided', () => {
    render(
      <SegmentComparison
        segments={[]}
        onSegmentUpdate={mockOnSegmentUpdate}
        onSegmentRemove={mockOnSegmentRemove}
      />
    )

    expect(screen.getByText('セグメント比較')).toBeInTheDocument()
    expect(screen.getByText('比較するセグメントを追加してください')).toBeInTheDocument()
  })

  it('displays segment overview with remove buttons', () => {
    render(
      <SegmentComparison
        segments={mockSegments}
        onSegmentUpdate={mockOnSegmentUpdate}
        onSegmentRemove={mockOnSegmentRemove}
      />
    )

    expect(screen.getByText('Segment A')).toBeInTheDocument()
    expect(screen.getByText('Segment B')).toBeInTheDocument()
    
    const removeButtons = screen.getAllByText('×')
    expect(removeButtons).toHaveLength(2)
  })

  it('handles segment removal', () => {
    render(
      <SegmentComparison
        segments={mockSegments}
        onSegmentUpdate={mockOnSegmentUpdate}
        onSegmentRemove={mockOnSegmentRemove}
      />
    )

    const removeButtons = screen.getAllByText('×')
    fireEvent.click(removeButtons[0])

    expect(mockOnSegmentRemove).toHaveBeenCalledWith('segment-1')
  })

  it('switches between comparison modes', () => {
    render(
      <SegmentComparison
        segments={mockSegments}
        onSegmentUpdate={mockOnSegmentUpdate}
        onSegmentRemove={mockOnSegmentRemove}
      />
    )

    expect(screen.getByText('テーブル')).toBeInTheDocument()
    expect(screen.getByText('チャート')).toBeInTheDocument()
    expect(screen.getByText('レーダー')).toBeInTheDocument()

    fireEvent.click(screen.getByText('チャート'))
    // Chart mode specific content would be tested here
  })

  it('loads segment data and displays comparison metrics', async () => {
    const { demographicFilterOperations } = require('../../../lib/regional-database')
    demographicFilterOperations.performCrossAnalysis.mockResolvedValue({
      data: {
        segments: [
          {
            segmentId: 'segment-1',
            averageRelevance: 85,
            totalMarketSize: 1000000,
            themes: [
              {
                themeId: 'theme-1',
                title: 'Test Theme',
                relevanceScore: 85,
                marketPotential: 75,
                competitionLevel: 'low',
              },
            ],
          },
        ],
        comparisons: [],
        insights: [],
        createdAt: '2024-01-01T00:00:00Z',
      },
      error: null,
    })

    render(
      <SegmentComparison
        segments={mockSegments}
        onSegmentUpdate={mockOnSegmentUpdate}
        onSegmentRemove={mockOnSegmentRemove}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('平均関連度')).toBeInTheDocument()
      expect(screen.getByText('市場規模')).toBeInTheDocument()
    })
  })
})

describe('DemographicFilteringDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dashboard with all main components', () => {
    render(<DemographicFilteringDashboard />)

    expect(screen.getByText('人口統計学的フィルタリング')).toBeInTheDocument()
    expect(screen.getByText('多次元フィルターとクロス分析でターゲットセグメントを特定')).toBeInTheDocument()
    expect(screen.getByText('フィルター設定')).toBeInTheDocument()
    expect(screen.getByText('クロス分析')).toBeInTheDocument()
    expect(screen.getByText('セグメント比較')).toBeInTheDocument()
  })

  it('switches between tabs correctly', () => {
    render(<DemographicFilteringDashboard />)

    // Default should be filters tab
    expect(screen.getByText('フィルター設定')).toHaveClass('bg-white text-blue-600 shadow-sm')

    // Click analysis tab
    fireEvent.click(screen.getByText('クロス分析'))
    expect(screen.getByText('クロス分析')).toHaveClass('bg-white text-blue-600 shadow-sm')

    // Click comparison tab
    fireEvent.click(screen.getByText('セグメント比較'))
    expect(screen.getByText('セグメント比較')).toHaveClass('bg-white text-blue-600 shadow-sm')
  })

  it('shows quick stats cards', () => {
    render(<DemographicFilteringDashboard />)

    expect(screen.getByText('アクティブフィルター')).toBeInTheDocument()
    expect(screen.getByText('作成セグメント')).toBeInTheDocument()
    expect(screen.getByText('保存済みフィルター')).toBeInTheDocument()
    expect(screen.getByText('分析実行回数')).toBeInTheDocument()
  })

  it('shows create segment button when filters are applied', () => {
    render(
      <DemographicFilteringDashboard
        initialFilters={{ countries: ['US'], ageGroups: ['25-34'] }}
      />
    )

    expect(screen.getByText('セグメント作成')).toBeInTheDocument()
  })

  it('opens create segment dialog', () => {
    render(
      <DemographicFilteringDashboard
        initialFilters={{ countries: ['US'], ageGroups: ['25-34'] }}
      />
    )

    fireEvent.click(screen.getByText('セグメント作成'))
    expect(screen.getByText('新しいセグメントを作成')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('例: 北米の若年層高所得者')).toBeInTheDocument()
  })

  it('creates a new segment', () => {
    render(
      <DemographicFilteringDashboard
        initialFilters={{ countries: ['US'], ageGroups: ['25-34'] }}
      />
    )

    fireEvent.click(screen.getByText('セグメント作成'))
    
    const nameInput = screen.getByPlaceholderText('例: 北米の若年層高所得者')
    fireEvent.change(nameInput, { target: { value: 'Test Segment' } })

    fireEvent.click(screen.getByText('作成'))

    // Should switch to comparison tab and show the segment
    expect(screen.getByText('セグメント比較')).toHaveClass('bg-white text-blue-600 shadow-sm')
  })

  it('shows help section with usage guide', () => {
    render(<DemographicFilteringDashboard />)

    expect(screen.getByText('使い方ガイド')).toBeInTheDocument()
    expect(screen.getByText(/フィルター設定で地理的・人口統計学的条件を/)).toBeInTheDocument()
    expect(screen.getByText(/クロス分析でセグメント間の関係性と/)).toBeInTheDocument()
  })

  it('loads saved filters when userId is provided', async () => {
    const { filterStateOperations } = require('../../../lib/regional-database')
    const mockSavedFilters = [
      {
        id: '1',
        userId: 'user-1',
        name: 'Test Filter',
        description: 'Test Description',
        filters: DEFAULT_DEMOGRAPHIC_FILTERS,
        isDefault: false,
        isPublic: false,
        usageCount: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]

    filterStateOperations.getUserFilterStates.mockResolvedValue({
      data: mockSavedFilters,
      error: null,
    })

    render(<DemographicFilteringDashboard userId="user-1" />)

    await waitFor(() => {
      expect(filterStateOperations.getUserFilterStates).toHaveBeenCalledWith('user-1', true)
    })
  })
})