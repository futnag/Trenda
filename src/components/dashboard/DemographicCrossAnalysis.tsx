'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { 
  DemographicFilter,
  CrossAnalysis 
} from '../../types/regional'
import { demographicFilterOperations } from '../../lib/regional-database'

interface DemographicCrossAnalysisProps {
  filters: DemographicFilter
  onFiltersChange: (filters: DemographicFilter) => void
  className?: string
}

export function DemographicCrossAnalysis({
  filters,
  onFiltersChange,
  className = '',
}: DemographicCrossAnalysisProps) {
  const [analysis, setAnalysis] = useState<CrossAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSegments, setSelectedSegments] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'segments' | 'comparisons' | 'insights'>('segments')

  useEffect(() => {
    if (hasValidFilters(filters)) {
      loadCrossAnalysis()
    } else {
      setAnalysis(null)
    }
  }, [filters])

  const hasValidFilters = (filters: DemographicFilter): boolean => {
    return !!(
      (filters.countries && filters.countries.length > 0) ||
      (filters.ageGroups && filters.ageGroups.length > 0) ||
      (filters.genders && filters.genders.length > 0) ||
      (filters.incomeLevels && filters.incomeLevels.length > 0)
    )
  }

  const loadCrossAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await demographicFilterOperations.performCrossAnalysis(
        filters,
        {
          includeComparisons: true,
          includeInsights: true,
        }
      )

      if (response.error) {
        setError(response.error)
      } else {
        setAnalysis(response.data)
      }
    } catch (err) {
      setError('クロス分析の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSegmentSelection = (segmentId: string) => {
    setSelectedSegments(prev => {
      if (prev.includes(segmentId)) {
        return prev.filter(id => id !== segmentId)
      } else {
        return [...prev, segmentId]
      }
    })
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return '💡'
      case 'risk':
        return '⚠️'
      case 'trend':
        return '📈'
      case 'recommendation':
        return '🎯'
      default:
        return 'ℹ️'
    }
  }

  const getInsightColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (!hasValidFilters(filters)) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <h3 className="text-lg font-semibold mb-2">人口統計学的クロス分析</h3>
          <p>分析を開始するには、フィルター条件を設定してください</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">人口統計学的クロス分析</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'segments' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('segments')}
          >
            セグメント
          </Button>
          <Button
            variant={viewMode === 'comparisons' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('comparisons')}
          >
            比較
          </Button>
          <Button
            variant={viewMode === 'insights' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('insights')}
          >
            インサイト
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadCrossAnalysis}>再試行</Button>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          {/* Segments View */}
          {viewMode === 'segments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">人口統計セグメント ({analysis.segments.length})</h4>
                <div className="text-sm text-gray-600">
                  {selectedSegments.length > 0 && `${selectedSegments.length} 個選択中`}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.segments.map((segment) => (
                  <div
                    key={segment.segmentId}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedSegments.includes(segment.segmentId)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSegmentSelection(segment.segmentId)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="font-semibold text-sm">{segment.name}</h5>
                      <input
                        type="checkbox"
                        checked={selectedSegments.includes(segment.segmentId)}
                        onChange={() => handleSegmentSelection(segment.segmentId)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {segment.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">平均関連度</span>
                        <span className="font-medium">{segment.averageRelevance.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">市場規模</span>
                        <span className="font-medium">{formatCurrency(segment.totalMarketSize)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">テーマ数</span>
                        <span className="font-medium">{segment.themes.length}</span>
                      </div>
                    </div>

                    {/* Top Themes */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">上位テーマ</div>
                      <div className="space-y-1">
                        {segment.themes.slice(0, 3).map((theme) => (
                          <div key={theme.themeId} className="flex justify-between text-xs">
                            <span className="truncate">{theme.title}</span>
                            <span className="text-blue-600 font-medium ml-2">
                              {theme.relevanceScore}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparisons View */}
          {viewMode === 'comparisons' && (
            <div className="space-y-4">
              <h4 className="font-semibold">セグメント比較 ({analysis.comparisons.length})</h4>

              {analysis.comparisons.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>比較可能なセグメントがありません</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analysis.comparisons.map((comparison, index) => {
                    const segmentA = analysis.segments.find(s => s.segmentId === comparison.segmentA)
                    const segmentB = analysis.segments.find(s => s.segmentId === comparison.segmentB)

                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold">
                            {segmentA?.name} vs {segmentB?.name}
                          </h5>
                        </div>

                        {/* Differences */}
                        <div className="mb-4">
                          <h6 className="font-medium text-sm mb-2">主な違い</h6>
                          <div className="space-y-2">
                            {comparison.differences.map((diff, diffIndex) => (
                              <div key={diffIndex} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{diff.metric}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{diff.valueA.toFixed(1)}</span>
                                  <span className="text-gray-400">vs</span>
                                  <span className="font-medium">{diff.valueB.toFixed(1)}</span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    diff.significance > 20 
                                      ? 'bg-red-100 text-red-800' 
                                      : diff.significance > 10 
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {diff.significance.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recommendations */}
                        {comparison.recommendations.length > 0 && (
                          <div>
                            <h6 className="font-medium text-sm mb-2">推奨事項</h6>
                            <ul className="space-y-1">
                              {comparison.recommendations.map((rec, recIndex) => (
                                <li key={recIndex} className="text-sm text-gray-700 flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Insights View */}
          {viewMode === 'insights' && (
            <div className="space-y-4">
              <h4 className="font-semibold">分析インサイト ({analysis.insights.length})</h4>

              {analysis.insights.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>インサイトが見つかりませんでした</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analysis.insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${getInsightColor(insight.impact)}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold">{insight.title}</h5>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                insight.impact === 'high' 
                                  ? 'bg-red-200 text-red-800'
                                  : insight.impact === 'medium'
                                  ? 'bg-yellow-200 text-yellow-800'
                                  : 'bg-blue-200 text-blue-800'
                              }`}>
                                {insight.impact === 'high' ? '高' : insight.impact === 'medium' ? '中' : '低'}インパクト
                              </span>
                              <span className="text-xs text-gray-600">
                                信頼度 {insight.confidence}%
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                          {insight.actionable && (
                            <div className="flex items-center gap-1 text-xs text-green-700">
                              <span>✓</span>
                              <span>実行可能</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Panel */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">アクション</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Export analysis results
                  const dataStr = JSON.stringify(analysis, null, 2)
                  const dataBlob = new Blob([dataStr], { type: 'application/json' })
                  const url = URL.createObjectURL(dataBlob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `cross-analysis-${new Date().toISOString().split('T')[0]}.json`
                  link.click()
                }}
              >
                分析結果をエクスポート
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadCrossAnalysis}
              >
                分析を更新
              </Button>
              {selectedSegments.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    // Apply selected segments as filters
                    const selectedSegmentData = analysis.segments.filter(s => 
                      selectedSegments.includes(s.segmentId)
                    )
                    // This would update the main filters based on selected segments
                    console.log('Selected segments:', selectedSegmentData)
                  }}
                >
                  選択セグメントを適用 ({selectedSegments.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}