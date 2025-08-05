'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { themeOperations, subscribeToTable } from '@/lib/database'
import { getMockThemes } from '@/lib/mock-data'
import type { Theme, ThemeFilterRequest, PaginatedResponse } from '@/types'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Card } from '@/components/common/Card'
import { CategoryFilter } from './CategoryFilter'
import { ThemeCard } from './ThemeCard'
import { TrendChart } from './TrendChart'

interface TrendDashboardProps {
  className?: string
}

export function TrendDashboard({ className = '' }: TrendDashboardProps) {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Partial<ThemeFilterRequest>>({
    sortBy: 'monetizationScore',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Load themes with current filters
  const loadThemes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Try database first, fallback to mock data
      try {
        const response = await themeOperations.getThemes({
          category: filters.categories?.[0],
          competition_level: filters.competitionLevel?.[0],
          technical_difficulty: filters.technicalDifficulty?.[0],
          min_monetization_score: filters.minMonetizationScore,
          max_monetization_score: filters.maxMonetizationScore,
          min_market_size: filters.minMarketSize,
          max_market_size: filters.maxMarketSize,
          page: filters.page,
          limit: filters.limit,
          sort_by: filters.sortBy,
          sort_order: filters.sortOrder,
        })

        if (response.error) {
          throw new Error(response.error)
        }

        setThemes(response.data)
        setPagination(response.pagination)
      } catch (dbError) {
        console.warn('Database not available, using mock data:', dbError)
        
        // Use mock data as fallback
        const mockResponse = await getMockThemes({
          category: filters.categories?.[0],
          competition_level: filters.competitionLevel?.[0],
          technical_difficulty: filters.technicalDifficulty?.[0],
          min_monetization_score: filters.minMonetizationScore,
          max_monetization_score: filters.maxMonetizationScore,
          min_market_size: filters.minMarketSize,
          max_market_size: filters.maxMarketSize,
          page: filters.page,
          limit: filters.limit,
          sort_by: filters.sortBy,
          sort_order: filters.sortOrder,
        })

        setThemes(mockResponse.data)
        setPagination(mockResponse.pagination)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'テーマの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Initial load
  useEffect(() => {
    loadThemes()
  }, [loadThemes])

  // Real-time updates subscription
  useEffect(() => {
    const subscription = subscribeToTable<Theme>(
      'themes',
      (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          setThemes(prev => [payload.new!, ...prev.slice(0, -1)])
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setThemes(prev => 
            prev.map(theme => 
              theme.id === payload.new!.id ? payload.new! : theme
            )
          )
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setThemes(prev => 
            prev.filter(theme => theme.id !== payload.old!.id)
          )
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ThemeFilterRequest>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }))
  }, [])

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  // Handle sort change
  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      sortBy: sortBy as ThemeFilterRequest['sortBy'],
      sortOrder,
      page: 1,
    }))
  }, [])

  if (loading && themes.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            トレンドダッシュボード
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            マネタイズ可能性の高いテーマを発見しましょう
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-')
              handleSortChange(sortBy, sortOrder as 'asc' | 'desc')
            }}
            className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="monetizationScore-desc">マネタイズスコア（高い順）</option>
            <option value="monetizationScore-asc">マネタイズスコア（低い順）</option>
            <option value="marketSize-desc">市場規模（大きい順）</option>
            <option value="marketSize-asc">市場規模（小さい順）</option>
            <option value="updatedAt-desc">更新日（新しい順）</option>
            <option value="updatedAt-asc">更新日（古い順）</option>
            <option value="title-asc">タイトル（A-Z）</option>
            <option value="title-desc">タイトル（Z-A）</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <CategoryFilter
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Trend Chart */}
      <TrendChart themes={themes} />

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                エラーが発生しました
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={loadThemes}
                  className="bg-red-100 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Themes Grid */}
      {themes.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>
                    {' '}から{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>
                    {' '}件を表示（全{' '}
                    <span className="font-medium">{pagination.total}</span>
                    {' '}件中）
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">前のページ</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      const isActive = pageNum === pagination.page
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            isActive
                              ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">次のページ</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : !loading && (
        <Card className="p-8 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">テーマが見つかりません</h3>
          <p className="mt-1 text-sm text-gray-500">
            フィルター条件を変更するか、新しいテーマが追加されるまでお待ちください。
          </p>
        </Card>
      )}

      {/* Loading overlay for subsequent loads */}
      {loading && themes.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      )}
    </div>
  )
}