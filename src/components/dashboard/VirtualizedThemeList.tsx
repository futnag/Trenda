'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Theme } from '@/types'
import { ThemeCard, ThemeCardCompact } from './ThemeCard'

interface VirtualizedThemeListProps {
  themes: Theme[]
  itemHeight?: number
  containerHeight?: number
  overscan?: number
  compact?: boolean
  className?: string
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
}

export function VirtualizedThemeList({
  themes,
  itemHeight = 280, // Default height for ThemeCard
  containerHeight = 600,
  overscan = 5,
  compact = false,
  className = '',
  onLoadMore,
  hasMore = false,
  loading = false,
}: VirtualizedThemeListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  const loadingRef = useRef(false)

  // Adjust item height for compact mode
  const actualItemHeight = compact ? 120 : itemHeight

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / actualItemHeight) - overscan)
  const endIndex = Math.min(
    themes.length - 1,
    Math.ceil((scrollTop + containerHeight) / actualItemHeight) + overscan
  )

  // Calculate total height
  const totalHeight = themes.length * actualItemHeight

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setScrollTop(target.scrollTop)

    // Load more when near bottom
    if (
      onLoadMore &&
      hasMore &&
      !loading &&
      !loadingRef.current &&
      target.scrollTop + target.clientHeight >= target.scrollHeight - 200
    ) {
      loadingRef.current = true
      onLoadMore()
    }
  }, [onLoadMore, hasMore, loading])

  // Reset loading flag when loading changes
  useEffect(() => {
    if (!loading) {
      loadingRef.current = false
    }
  }, [loading])

  // Generate visible items
  const visibleItems = []
  for (let i = startIndex; i <= endIndex; i++) {
    if (themes[i]) {
      visibleItems.push({
        index: i,
        theme: themes[i],
        style: {
          position: 'absolute' as const,
          top: i * actualItemHeight,
          left: 0,
          right: 0,
          height: actualItemHeight,
        },
      })
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={setContainerRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map(({ index, theme, style }) => (
            <div key={theme.id} style={style} className="px-2 py-2">
              {compact ? (
                <ThemeCardCompact theme={theme} />
              ) : (
                <ThemeCard theme={theme} />
              )}
            </div>
          ))}
          
          {/* Loading indicator */}
          {loading && (
            <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                読み込み中...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Grid version for better layout
export function VirtualizedThemeGrid({
  themes,
  itemHeight = 280,
  itemWidth = 350,
  containerHeight = 600,
  columnsCount = 3,
  gap = 16,
  overscan = 5,
  className = '',
  onLoadMore,
  hasMore = false,
  loading = false,
}: VirtualizedThemeListProps & {
  itemWidth?: number
  columnsCount?: number
  gap?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)
  const loadingRef = useRef(false)

  // Calculate rows
  const rowsCount = Math.ceil(themes.length / columnsCount)
  const rowHeight = itemHeight + gap

  // Calculate visible range
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endRow = Math.min(
    rowsCount - 1,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  )

  // Calculate total height
  const totalHeight = rowsCount * rowHeight

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setScrollTop(target.scrollTop)

    // Load more when near bottom
    if (
      onLoadMore &&
      hasMore &&
      !loading &&
      !loadingRef.current &&
      target.scrollTop + target.clientHeight >= target.scrollHeight - 200
    ) {
      loadingRef.current = true
      onLoadMore()
    }
  }, [onLoadMore, hasMore, loading])

  // Reset loading flag when loading changes
  useEffect(() => {
    if (!loading) {
      loadingRef.current = false
    }
  }, [loading])

  // Generate visible rows
  const visibleRows = []
  for (let row = startRow; row <= endRow; row++) {
    const rowItems = []
    for (let col = 0; col < columnsCount; col++) {
      const index = row * columnsCount + col
      if (themes[index]) {
        rowItems.push(themes[index])
      }
    }
    
    if (rowItems.length > 0) {
      visibleRows.push({
        row,
        items: rowItems,
        style: {
          position: 'absolute' as const,
          top: row * rowHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        },
      })
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleRows.map(({ row, items, style }) => (
            <div key={row} style={style} className="px-4">
              <div 
                className="grid gap-4"
                style={{ 
                  gridTemplateColumns: `repeat(${columnsCount}, 1fr)`,
                  gap: `${gap}px`
                }}
              >
                {items.map((theme) => (
                  <ThemeCard key={theme.id} theme={theme} />
                ))}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {loading && (
            <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                読み込み中...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}