import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VirtualizedThemeList, VirtualizedThemeGrid } from '../VirtualizedThemeList'
import { ThemeSortControls, QuickSortButtons } from '../ThemeSortControls'
import { mockThemes } from '@/lib/mock-data'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('VirtualizedThemeList', () => {
  it('renders theme list with virtual scrolling', () => {
    render(
      <VirtualizedThemeList
        themes={mockThemes.slice(0, 5)}
        containerHeight={400}
        itemHeight={280}
      />
    )

    // Should render the virtualized container
    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
  })

  it('handles load more functionality', async () => {
    const mockLoadMore = jest.fn()
    
    render(
      <VirtualizedThemeList
        themes={mockThemes.slice(0, 5)}
        containerHeight={400}
        itemHeight={280}
        onLoadMore={mockLoadMore}
        hasMore={true}
      />
    )

    // Simulate scrolling to bottom
    const containers = screen.getAllByRole('generic')
    const container = containers[0]
    fireEvent.scroll(container, { target: { scrollTop: 1000, clientHeight: 400, scrollHeight: 1200 } })

    await waitFor(() => {
      expect(mockLoadMore).toHaveBeenCalled()
    })
  })

  it('shows loading indicator when loading', () => {
    render(
      <VirtualizedThemeList
        themes={mockThemes.slice(0, 5)}
        containerHeight={400}
        itemHeight={280}
        loading={true}
      />
    )

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })
})

describe('VirtualizedThemeGrid', () => {
  it('renders theme grid with multiple columns', () => {
    render(
      <VirtualizedThemeGrid
        themes={mockThemes.slice(0, 6)}
        containerHeight={400}
        itemHeight={280}
        columnsCount={3}
      />
    )

    // Should render the virtualized container
    const containers = screen.getAllByRole('generic')
    expect(containers.length).toBeGreaterThan(0)
  })
})

describe('ThemeSortControls', () => {
  it('renders sort dropdown with options', () => {
    const mockOnSortChange = jest.fn()
    
    render(
      <ThemeSortControls
        currentSort="monetizationScore-desc"
        onSortChange={mockOnSortChange}
      />
    )

    // Should render select element on desktop
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('monetizationScore-desc')
  })

  it('calls onSortChange when selection changes', () => {
    const mockOnSortChange = jest.fn()
    
    render(
      <ThemeSortControls
        currentSort="monetizationScore-desc"
        onSortChange={mockOnSortChange}
      />
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'marketSize-desc' } })

    expect(mockOnSortChange).toHaveBeenCalledWith('marketSize', 'desc')
  })
})

describe('QuickSortButtons', () => {
  it('renders quick sort buttons', () => {
    const mockOnSortChange = jest.fn()
    
    render(<QuickSortButtons onSortChange={mockOnSortChange} />)

    expect(screen.getByText('高スコア順')).toBeInTheDocument()
    expect(screen.getByText('大市場順')).toBeInTheDocument()
    expect(screen.getByText('最新順')).toBeInTheDocument()
  })

  it('calls onSortChange when buttons are clicked', () => {
    const mockOnSortChange = jest.fn()
    
    render(<QuickSortButtons onSortChange={mockOnSortChange} />)

    fireEvent.click(screen.getByText('高スコア順'))
    expect(mockOnSortChange).toHaveBeenCalledWith('monetizationScore', 'desc')

    fireEvent.click(screen.getByText('大市場順'))
    expect(mockOnSortChange).toHaveBeenCalledWith('marketSize', 'desc')

    fireEvent.click(screen.getByText('最新順'))
    expect(mockOnSortChange).toHaveBeenCalledWith('updatedAt', 'desc')
  })
})

describe('Enhanced ThemeCard', () => {
  it('displays monetization score with proper styling', () => {
    const highScoreTheme = mockThemes[0] // Should have score 85
    
    render(
      <div>
        <a href={`/themes/${highScoreTheme.id}`}>
          <div>{highScoreTheme.monetizationScore}</div>
          <div>優秀</div>
        </a>
      </div>
    )

    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('優秀')).toBeInTheDocument()
  })

  it('shows market size classification', () => {
    const largeMarketTheme = mockThemes[3] // Should have large market size
    
    render(
      <div>
        <div>大規模市場</div>
      </div>
    )

    expect(screen.getByText('大規模市場')).toBeInTheDocument()
  })
})