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

interface SegmentComparisonProps {
  segments: Array<{
    id: string
    name: string
    filters: DemographicFilter
    color: string
  }>
  onSegmentUpdate: (segmentId: string, filters: DemographicFilter) => void
  onSegmentRemove: (segmentId: string) => void
  className?: string
}

interface ComparisonMetric {
  name: string
  key: string
  format: 'number' | 'percentage' | 'currency'
  description: string
}

interface SegmentData {
  segmentId: string
  metrics: Record<string, number>
  themes: Array<{
    id: string
    title: string
    relevanceScore: number
    marketPotential: number
  }>
  insights: string[]
}

export function SegmentComparison({
  segments,
  onSegmentUpdate,
  onSegmentRemove,
  className = '',
}: SegmentComparisonProps) {
  const [segmentData, setSegmentData] = useState<SegmentData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<string>('averageRelevance')
  const [comparisonMode, setComparisonMode] = useState<'table' | 'chart' | 'radar'>('table')

  const comparisonMetrics: ComparisonMetric[] = [
    {
      name: '平均関連度',
      key: 'averageRelevance',
      format: 'percentage',
      description: 'セグメント内テーマの平均関連度スコア',
    },
    {
      name: '市場規模',
      key: 'totalMarketSize',
      format: 'currency',
      description: '推定総市場規模',
    },
    {
      name: 'テーマ数',
      key: 'themeCount',
      format: 'number',
      description: '関連テーマの総数',
    },
    {
      name: '競合レベル',
      key: 'averageCompetition',
      format: 'percentage',
      description: '平均競合レベル（低いほど良い）',
    },
    {
      name: '収益ポテンシャル',
      key: 'revenueScore',
      format: 'percentage',
      description: '収益化可能性スコア',
    },
  ]

  useEffect(() => {
    if (segments.length > 0) {
      loadSegmentData()
    } else {
      setSegmentData([])
    }
  }, [segments])

  const loadSegmentData = async () => {
    setLoading(true)
    setError(null)

    try {
      const segmentDataPromises = segments.map(async (segment) => {
        const response = await demographicFilterOperations.performCrossAnalysis(
          segment.filters,
          {
            includeComparisons: false,
            includeInsights: true,
          }
        )

        if (response.error) {
          throw new Error(response.error)
        }

        const analysis = response.data
        const segmentInfo = analysis?.segments[0] // Assuming first segment is the main one

        return {
          segmentId: segment.id,
          metrics: {
            averageRelevance: segmentInfo?.averageRelevance || 0,
            totalMarketSize: segmentInfo?.totalMarketSize || 0,
            themeCount: segmentInfo?.themes.length || 0,
            averageCompetition: segmentInfo?.themes.reduce((sum, theme) => {
              const competitionScore = theme.competitionLevel === 'low' ? 25 : 
                                     theme.competitionLevel === 'medium' ? 50 : 75
              return sum + competitionScore
            }, 0) / (segmentInfo?.themes.length || 1),
            revenueScore: segmentInfo?.themes.reduce((sum, theme) => 
              sum + theme.marketPotential, 0) / (segmentInfo?.themes.length || 1),
          },
          themes: segmentInfo?.themes.slice(0, 5) || [],
          insights: analysis?.insights.map(insight => insight.description) || [],
        }
      })

      const results = await Promise.all(segmentDataPromises)
      setSegmentData(results)
    } catch (err) {
      setError('セグメント比較データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: number, format: string): string => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'currency':
        return new Intl.NumberFormat('ja-JP', {
          style: 'currency',
          currency: 'JPY',
          minimumFractionDigits: 0,
        }).format(value)
      case 'number':
        return value.toLocaleString()
      default:
        return value.toString()
    }
  }

  const getBestSegmentForMetric = (metricKey: string): string | null => {
    if (segmentData.length === 0) return null

    const isLowerBetter = metricKey === 'averageCompetition'
    const bestSegment = segmentData.reduce((best, current) => {
      const currentValue = current.metrics[metricKey] || 0
      const bestValue = best.metrics[metricKey] || 0
      
      if (isLowerBetter) {
        return currentValue < bestValue ? current : best
      } else {
        return currentValue > bestValue ? current : best
      }
    })

    return bestSegment.segmentId
  }

  const getSegmentColor = (segmentId: string): string => {
    const segment = segments.find(s => s.id === segmentId)
    return segment?.color || '#3B82F6'
  }

  const getSegmentName = (segmentId: string): string => {
    const segment = segments.find(s => s.id === segmentId)
    return segment?.name || 'Unknown Segment'
  }

  if (segments.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <h3 className="text-lg font-semibold mb-2">セグメント比較</h3>
          <p>比較するセグメントを追加してください</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">セグメント比較分析</h3>
        <div className="flex items-center gap-2">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {comparisonMetrics.map((metric) => (
              <option key={metric.key} value={metric.key}>
                {metric.name}
              </option>
            ))}
          </select>
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setComparisonMode('table')}
              className={`px-3 py-2 text-sm ${
                comparisonMode === 'table'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              テーブル
            </button>
            <button
              onClick={() => setComparisonMode('chart')}
              className={`px-3 py-2 text-sm border-l border-gray-300 ${
                comparisonMode === 'chart'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              チャート
            </button>
            <button
              onClick={() => setComparisonMode('radar')}
              className={`px-3 py-2 text-sm border-l border-gray-300 ${
                comparisonMode === 'radar'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              レーダー
            </button>
          </div>
        </div>
      </div>

      {/* Segment Overview */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
              style={{ borderColor: segment.color, backgroundColor: `${segment.color}10` }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="font-medium text-sm">{segment.name}</span>
              <button
                onClick={() => onSegmentRemove(segment.id)}
                className="text-gray-500 hover:text-red-500 ml-1"
              >
                ×
              </button>
            </div>
          ))}
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
          <Button onClick={loadSegmentData}>再試行</Button>
        </div>
      )}

      {segmentData.length > 0 && !loading && (
        <div className="space-y-6">
          {/* Table View */}
          {comparisonMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">指標</th>
                    {segments.map((segment) => (
                      <th
                        key={segment.id}
                        className="border border-gray-200 px-4 py-2 text-center"
                        style={{ color: segment.color }}
                      >
                        {segment.name}
                      </th>
                    ))}
                    <th className="border border-gray-200 px-4 py-2 text-center">最優秀</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonMetrics.map((metric) => {
                    const bestSegmentId = getBestSegmentForMetric(metric.key)
                    return (
                      <tr key={metric.key} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2 font-medium">
                          <div>
                            <div>{metric.name}</div>
                            <div className="text-xs text-gray-500">{metric.description}</div>
                          </div>
                        </td>
                        {segments.map((segment) => {
                          const data = segmentData.find(d => d.segmentId === segment.id)
                          const value = data?.metrics[metric.key] || 0
                          const isBest = bestSegmentId === segment.id
                          
                          return (
                            <td
                              key={segment.id}
                              className={`border border-gray-200 px-4 py-2 text-center ${
                                isBest ? 'bg-green-50 font-semibold' : ''
                              }`}
                            >
                              {formatValue(value, metric.format)}
                              {isBest && <span className="ml-1 text-green-600">👑</span>}
                            </td>
                          )
                        })}
                        <td className="border border-gray-200 px-4 py-2 text-center text-sm text-gray-600">
                          {bestSegmentId ? getSegmentName(bestSegmentId) : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Chart View */}
          {comparisonMode === 'chart' && (
            <div className="space-y-4">
              <h4 className="font-semibold">
                {comparisonMetrics.find(m => m.key === selectedMetric)?.name} の比較
              </h4>
              <div className="space-y-3">
                {segments.map((segment) => {
                  const data = segmentData.find(d => d.segmentId === segment.id)
                  const value = data?.metrics[selectedMetric] || 0
                  const maxValue = Math.max(...segmentData.map(d => d.metrics[selectedMetric] || 0))
                  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

                  return (
                    <div key={segment.id} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium truncate">
                        {segment.name}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="h-6 rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${Math.max(percentage, 5)}%`,
                            backgroundColor: segment.color,
                          }}
                        >
                          <span className="text-white text-xs font-medium">
                            {formatValue(value, comparisonMetrics.find(m => m.key === selectedMetric)?.format || 'number')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Radar Chart View */}
          {comparisonMode === 'radar' && (
            <div className="text-center py-8">
              <p className="text-gray-500">レーダーチャートは今後のアップデートで実装予定です</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">現在の比較サマリー</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comparisonMetrics.slice(0, 4).map((metric) => {
                    const bestSegmentId = getBestSegmentForMetric(metric.key)
                    const bestSegment = segments.find(s => s.id === bestSegmentId)
                    
                    return (
                      <div key={metric.key} className="text-left">
                        <div className="font-medium text-sm">{metric.name}</div>
                        <div className="text-xs text-gray-600">
                          最優秀: <span style={{ color: bestSegment?.color }}>{bestSegment?.name}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Top Themes Comparison */}
          <div>
            <h4 className="font-semibold mb-4">セグメント別上位テーマ</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {segments.map((segment) => {
                const data = segmentData.find(d => d.segmentId === segment.id)
                
                return (
                  <div key={segment.id} className="border border-gray-200 rounded-lg p-4">
                    <h5
                      className="font-semibold mb-3 flex items-center gap-2"
                      style={{ color: segment.color }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      {segment.name}
                    </h5>
                    <div className="space-y-2">
                      {data?.themes.map((theme) => (
                        <div key={theme.id} className="flex justify-between text-sm">
                          <span className="truncate">{theme.title}</span>
                          <span className="text-blue-600 font-medium ml-2">
                            {theme.relevanceScore.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                      {(!data?.themes || data.themes.length === 0) && (
                        <div className="text-gray-500 text-sm">テーマが見つかりません</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Insights */}
          <div>
            <h4 className="font-semibold mb-4">比較インサイト</h4>
            <div className="space-y-3">
              {segmentData.map((data) => {
                const segment = segments.find(s => s.id === data.segmentId)
                if (!segment || data.insights.length === 0) return null

                return (
                  <div key={data.segmentId} className="border-l-4 pl-4" style={{ borderColor: segment.color }}>
                    <h5 className="font-medium text-sm mb-2" style={{ color: segment.color }}>
                      {segment.name}
                    </h5>
                    <ul className="space-y-1">
                      {data.insights.slice(0, 3).map((insight, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">エクスポート</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const csvData = [
                    ['セグメント', ...comparisonMetrics.map(m => m.name)],
                    ...segments.map(segment => {
                      const data = segmentData.find(d => d.segmentId === segment.id)
                      return [
                        segment.name,
                        ...comparisonMetrics.map(metric => 
                          formatValue(data?.metrics[metric.key] || 0, metric.format)
                        )
                      ]
                    })
                  ]
                  
                  const csvContent = csvData.map(row => row.join(',')).join('\n')
                  const blob = new Blob([csvContent], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `segment-comparison-${new Date().toISOString().split('T')[0]}.csv`
                  link.click()
                }}
              >
                CSV エクスポート
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const jsonData = {
                    segments: segments.map(segment => ({
                      ...segment,
                      data: segmentData.find(d => d.segmentId === segment.id)
                    })),
                    comparisonMetrics,
                    exportDate: new Date().toISOString(),
                  }
                  
                  const dataStr = JSON.stringify(jsonData, null, 2)
                  const dataBlob = new Blob([dataStr], { type: 'application/json' })
                  const url = URL.createObjectURL(dataBlob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `segment-comparison-${new Date().toISOString().split('T')[0]}.json`
                  link.click()
                }}
              >
                JSON エクスポート
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}