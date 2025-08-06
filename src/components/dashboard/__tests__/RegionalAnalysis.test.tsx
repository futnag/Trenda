import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RegionalFilter } from '../RegionalFilter'
import { RegionalComparison } from '../RegionalComparison'
import { LocalizedOpportunities } from '../LocalizedOpportunities'
import { RegionalAnalysisDashboard } from '../RegionalAnalysisDashboard'
import { DEFAULT_DEMOGRAPHIC_FILTERS } from '../../../types/regional'

// Mock the regional database operations
jest.mock('../../../lib/regional-database', () => ({
  regionalAnalysisOperations: {
    compareRegions: jest.fn(),
    getLocalizedOpportunities: jest.fn(),
    getRegionalMarketPotential: jest.fn(),
  },
  filterStateOperations: {
    getUserFilterStates: jest.fn(),
    saveFilterState: jest.fn(),
    incrementFilterUsage: jest.fn(),
    deleteFilterState: jest.fn(),
  },
  demographicFilterOperations: {
    filterThemesByDemographics: jest.fn(),
    performCrossAnalysis: jest.fn(),
  },
}))

describe('RegionalFilter', () => {
  const mockOnFiltersChange = jest.fn()
  const mockOnSaveFilter = jest.fn()
  const mockOnLoadFilter = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders filter component with default filters', () => {
    render(
      <RegionalFilter
        filters={DEFAULT_DEMOGRAPHIC_FILTERS}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByText('地域・人口統計フィルター')).toBeInTheDocument()
    expect(screen.getByText('展開')).toBeInTheDocument()
    expect(screen.getByText('リセット')).toBeInTheDocument()
  })

  it('expands and shows filter options when expand button is clicked', () => {
    render(
      <RegionalFilter
        filters={DEFAULT_DEMOGRAPHIC_FILTERS}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    fireEvent.click(screen.getByText('展開'))

    expect(screen.getByText('国・地域')).toBeInTheDocument()
    expect(screen.getByText('年齢層')).toBeInTheDocument()
    expect(screen.getByText('性別')).toBeInTheDocument()
    expect(screen.getByText('所得層')).toBeInTheDocument()
  })

  it('calls onFiltersChange when country is selected', () => {
    render(
      <RegionalFilter
        filters={DEFAULT_DEMOGRAPHIC_FILTERS}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    fireEvent.click(screen.getByText('展開'))
    
    const usCheckbox = screen.getByLabelText(/United States/)
    fireEvent.click(usCheckbox)

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_DEMOGRAPHIC_FILTERS,
      countries: [...(DEFAULT_DEMOGRAPHIC_FILTERS.countries || []), 'US'],
    })
  })

  it('shows save dialog when save button is clicked', () => {
    render(
      <RegionalFilter
        filters={DEFAULT_DEMOGRAPHIC_FILTERS}
        onFiltersChange={mockOnFiltersChange}
        onSaveFilter={mockOnSaveFilter}
      />
    )

    fireEvent.click(screen.getByText('展開'))
    fireEvent.click(screen.getByText('フィルター設定を保存'))

    expect(screen.getByText('フィルター設定を保存')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('例: 北米の若年層')).toBeInTheDocument()
  })

  it('resets filters when reset button is clicked', () => {
    const customFilters = {
      ...DEFAULT_DEMOGRAPHIC_FILTERS,
      countries: ['JP', 'KR'],
    }

    render(
      <RegionalFilter
        filters={customFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    fireEvent.click(screen.getByText('リセット'))

    expect(mockOnFiltersChange).toHaveBeenCalledWith(DEFAULT_DEMOGRAPHIC_FILTERS)
  })
})

describe('RegionalComparison', () => {
  const mockOnRegionToggle = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows message when less than 2 regions are selected', () => {
    render(
      <RegionalComparison
        selectedRegions={['US']}
        onRegionToggle={mockOnRegionToggle}
      />
    )

    expect(screen.getByText('比較するには2つ以上の地域を選択してください')).toBeInTheDocument()
  })

  it('shows loading state when comparison is being loaded', () => {
    const { regionalAnalysisOperations } = require('../../../lib/regional-database')
    regionalAnalysisOperations.compareRegions.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    )

    render(
      <RegionalComparison
        selectedRegions={['US', 'JP']}
        onRegionToggle={mockOnRegionToggle}
      />
    )

    expect(screen.getByText('地域比較分析')).toBeInTheDocument()
  })

  it('displays selected regions with remove buttons', () => {
    render(
      <RegionalComparison
        selectedRegions={['US', 'JP']}
        onRegionToggle={mockOnRegionToggle}
      />
    )

    expect(screen.getByText('United States')).toBeInTheDocument()
    expect(screen.getByText('Japan')).toBeInTheDocument()
    
    const removeButtons = screen.getAllByText('×')
    expect(removeButtons).toHaveLength(2)
  })

  it('calls onRegionToggle when remove button is clicked', () => {
    render(
      <RegionalComparison
        selectedRegions={['US', 'JP']}
        onRegionToggle={mockOnRegionToggle}
      />
    )

    const removeButtons = screen.getAllByText('×')
    fireEvent.click(removeButtons[0])

    expect(mockOnRegionToggle).toHaveBeenCalledWith('US')
  })
})

describe('LocalizedOpportunities', () => {
  const mockOnRegionChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows region selection message when no region is selected', () => {
    render(
      <LocalizedOpportunities
        selectedRegion={null}
        onRegionChange={mockOnRegionChange}
      />
    )

    expect(screen.getByText('地域を選択してローカライゼーション機会を表示してください')).toBeInTheDocument()
  })

  it('shows region selector dropdown', () => {
    render(
      <LocalizedOpportunities
        selectedRegion={null}
        onRegionChange={mockOnRegionChange}
      />
    )

    const select = screen.getByDisplayValue('地域を選択')
    expect(select).toBeInTheDocument()
    
    fireEvent.change(select, { target: { value: 'US' } })
    expect(mockOnRegionChange).toHaveBeenCalledWith('US')
  })

  it('loads opportunities when region is selected', async () => {
    const { regionalAnalysisOperations } = require('../../../lib/regional-database')
    const mockOpportunities = [
      {
        id: '1',
        themeId: 'theme-1',
        region: 'US',
        theme: 'Test Theme',
        localNeed: 'Test local need',
        marketGap: 75,
        culturalFactors: ['Factor 1'],
        regulatoryConsiderations: ['Regulation 1'],
        estimatedRevenue: { min: 10000, max: 50000 },
        confidence: 85,
        dataSource: 'Test Source',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]

    regionalAnalysisOperations.getLocalizedOpportunities.mockResolvedValue({
      data: mockOpportunities,
      error: null,
    })

    render(
      <LocalizedOpportunities
        selectedRegion="US"
        onRegionChange={mockOnRegionChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Theme')).toBeInTheDocument()
      expect(screen.getByText('Test local need')).toBeInTheDocument()
      expect(screen.getByText('市場ギャップ 75%')).toBeInTheDocument()
    })
  })
})

describe('RegionalAnalysisDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dashboard with all main components', () => {
    render(<RegionalAnalysisDashboard />)

    expect(screen.getByText('地域・人口統計学的分析')).toBeInTheDocument()
    expect(screen.getByText('地域別のトレンド分析とローカライゼーション機会を発見')).toBeInTheDocument()
    expect(screen.getByText('地域比較分析')).toBeInTheDocument()
    expect(screen.getByText('ローカライゼーション機会')).toBeInTheDocument()
  })

  it('switches between tabs correctly', () => {
    render(<RegionalAnalysisDashboard />)

    // Default should be comparison tab
    expect(screen.getByText('地域比較分析')).toHaveClass('bg-white text-blue-600 shadow-sm')

    // Click opportunities tab
    fireEvent.click(screen.getByText('ローカライゼーション機会'))
    expect(screen.getByText('ローカライゼーション機会')).toHaveClass('bg-white text-blue-600 shadow-sm')
  })

  it('shows quick stats cards', () => {
    render(<RegionalAnalysisDashboard />)

    expect(screen.getByText('分析対象地域')).toBeInTheDocument()
    expect(screen.getByText('人口統計セグメント')).toBeInTheDocument()
    expect(screen.getByText('保存済みフィルター')).toBeInTheDocument()
  })

  it('shows help section with usage tips', () => {
    render(<RegionalAnalysisDashboard />)

    expect(screen.getByText('使い方のヒント')).toBeInTheDocument()
    expect(screen.getByText(/地域比較では複数の国を選択して/)).toBeInTheDocument()
    expect(screen.getByText(/ローカライゼーション機会では特定地域の/)).toBeInTheDocument()
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

    render(<RegionalAnalysisDashboard userId="user-1" />)

    await waitFor(() => {
      expect(filterStateOperations.getUserFilterStates).toHaveBeenCalledWith('user-1', true)
    })
  })
})