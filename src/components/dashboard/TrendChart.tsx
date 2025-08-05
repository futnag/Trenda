'use client'

import { useMemo } from 'react'
import type { Theme } from '@/types'
import { Card } from '@/components/common/Card'

interface TrendChartProps {
  themes: Theme[]
  className?: string
}

export function TrendChart({ themes, className = '' }: TrendChartProps) {
  // Calculate trend statistics
  const trendStats = useMemo(() => {
    if (themes.length === 0) {
      return {
        totalThemes: 0,
        averageScore: 0,
        highScoreThemes: 0,
        categoryDistribution: {},
        competitionDistribution: {},
        topCategories: [],
      }
    }

    const totalThemes = themes.length
    const averageScore = Math.round(
      themes.reduce((sum, theme) => sum + theme.monetizationScore, 0) / totalThemes
    )
    const highScoreThemes = themes.filter(theme => theme.monetizationScore >= 80).length

    // Category distribution
    const categoryDistribution = themes.reduce((acc, theme) => {
      acc[theme.category] = (acc[theme.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Competition distribution
    const competitionDistribution = themes.reduce((acc, theme) => {
      acc[theme.competitionLevel] = (acc[theme.competitionLevel] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Top categories by count
    const topCategories = Object.entries(categoryDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))

    return {
      totalThemes,
      averageScore,
      highScoreThemes,
      categoryDistribution,
      competitionDistribution,
      topCategories,
    }
  }, [themes])

  // Get category label in Japanese
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      productivity: '生産性',
      entertainment: 'エンターテイメント',
      education: '教育',
      health: 'ヘルスケア',
      finance: '金融',
      social: 'ソーシャル',
    }
    return labels[category] || category
  }

  // Get competition level label in Japanese
  const getCompetitionLabel = (level: string) => {
    const labels: Record<string, string> = {
      low: '低競合',
      medium: '中競合',
      high: '高競合',
    }
    return labels[level] || level
  }

  // Calculate percentage for progress bars
  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          トレンド分析サマリー
        </h3>
        <p className="text-sm text-gray-600">
          現在のフィルター条件に基づく市場トレンドの概要
        </p>
      </div>

      {themes.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500">データがありません</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {trendStats.totalThemes}
                  </div>
                  <div className="text-sm text-gray-600">総テーマ数</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {trendStats.averageScore}
                  </div>
                  <div className="text-sm text-gray-600">平均スコア</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {trendStats.highScoreThemes}
                  </div>
                  <div className="text-sm text-gray-600">高スコア（80+）</div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">
              カテゴリー別分布
            </h4>
            <div className="space-y-3">
              {trendStats.topCategories.map(({ category, count }) => (
                <div key={category} className="flex items-center">
                  <div className="w-24 text-sm text-gray-600 flex-shrink-0">
                    {getCategoryLabel(category)}
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${getPercentage(count, trendStats.totalThemes)}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-900 text-right">
                    {count}
                  </div>
                  <div className="w-12 text-sm text-gray-500 text-right">
                    {getPercentage(count, trendStats.totalThemes)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Competition Level Distribution */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">
              競合レベル分布
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(trendStats.competitionDistribution).map(([level, count]) => {
                const percentage = getPercentage(count, trendStats.totalThemes)
                const colorClass = level === 'low' ? 'bg-green-100 text-green-800' :
                                 level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                 'bg-red-100 text-red-800'
                
                return (
                  <div key={level} className={`rounded-lg p-4 ${colorClass}`}>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {count}
                      </div>
                      <div className="text-sm">
                        {getCompetitionLabel(level)}
                      </div>
                      <div className="text-xs mt-1">
                        ({percentage}%)
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Score Distribution Visualization */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">
              スコア分布
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {[
                { range: '0-25', color: 'bg-red-500', count: themes.filter(t => t.monetizationScore < 25).length },
                { range: '25-50', color: 'bg-orange-500', count: themes.filter(t => t.monetizationScore >= 25 && t.monetizationScore < 50).length },
                { range: '50-75', color: 'bg-yellow-500', count: themes.filter(t => t.monetizationScore >= 50 && t.monetizationScore < 75).length },
                { range: '75-100', color: 'bg-green-500', count: themes.filter(t => t.monetizationScore >= 75).length },
              ].map(({ range, color, count }) => (
                <div key={range} className="text-center">
                  <div className="text-xs text-gray-600 mb-1">{range}</div>
                  <div
                    className={`${color} rounded h-20 flex items-end justify-center text-white text-sm font-semibold pb-2`}
                    style={{
                      height: `${Math.max(20, (count / trendStats.totalThemes) * 80)}px`
                    }}
                  >
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}