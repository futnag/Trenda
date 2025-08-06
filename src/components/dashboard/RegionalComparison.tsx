'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { 
  CountryCode, 
  RegionalComparison as RegionalComparisonType,
  RegionalTrend 
} from '../../types/regional'
import { COUNTRY_NAMES } from '../../types/regional'
import { regionalAnalysisOperations } from '../../lib/regional-database'

interface RegionalComparisonProps {
  selectedRegions: CountryCode[]
  onRegionToggle: (region: CountryCode) => void
  themeIds?: string[]
  categories?: string[]
  className?: string
}

export function RegionalComparison({
  selectedRegions,
  onRegionToggle,
  themeIds,
  categories,
  className = '',
}: RegionalComparisonProps) {
  const [comparison, setComparison] = useState<RegionalComparisonType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')

  useEffect(() => {
    if (selectedRegions.length >= 2) {
      loadComparison()
    } else {
      setComparison(null)
    }
  }, [selectedRegions, themeIds, categories])

  const loadComparison = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await regionalAnalysisOperations.compareRegions(
        selectedRegions,
        {
          themeIds,
          categories,
          includeOpportunities: true,
        }
      )

      if (response.error) {
        setError(response.error)
      } else {
        setComparison(response.data)
      }
    } catch (err) {
      setError('地域比較の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getCompetitionLevelColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'high':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getCompetitionLevelText = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return '低'
      case 'medium':
        return '中'
      case 'high':
        return '高'
      default:
        return '不明'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (selectedRegions.length < 2) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <h3 className="text-lg font-semibold mb-2">地域比較</h3>
          <p>比較するには2つ以上の地域を選択してください</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">地域比較分析</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            テーブル
          </Button>
          <Button
            variant={viewMode === 'chart' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('chart')}
          >
            チャート
          </Button>
        </div>
      </div>

      {/* Selected Regions */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {selectedRegions.map((region) => (
            <span
              key={region}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {COUNTRY_NAMES[region]}
              <button
                onClick={() => onRegionToggle(region)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
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
          <Button onClick={loadComparison}>再試行</Button>
        </div>
      )}

      {comparison && !loading && (
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800">最適地域</h4>
              <p className="text-2xl font-bold text-green-600">
                {COUNTRY_NAMES[comparison.comparisonMetrics.bestRegion]}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">平均市場ポテンシャル</h4>
              <p className="text-2xl font-bold text-blue-600">
                {comparison.comparisonMetrics.averageMarketPotential}%
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800">総市場規模</h4>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(comparison.comparisonMetrics.totalMarketSize)}
              </p>
            </div>
          </div>

          {/* Detailed Comparison */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">テーマ</th>
                    {selectedRegions.map((region) => (
                      <th key={region} className="border border-gray-200 px-4 py-2 text-center">
                        {COUNTRY_NAMES[region]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.themes.slice(0, 10).map((theme) => (
                    <tr key={theme.themeId} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-medium">
                        {theme.title}
                      </td>
                      {selectedRegions.map((region) => {
                        const regionData = theme.regionalData[region]
                        return (
                          <td key={region} className="border border-gray-200 px-4 py-2 text-center">
                            {regionData ? (
                              <div className="space-y-1">
                                <div className="font-semibold">
                                  {regionData.marketPotential}%
                                </div>
                                <div className={`inline-block px-2 py-1 rounded text-xs ${getCompetitionLevelColor(regionData.competitionLevel)}`}>
                                  競合: {getCompetitionLevelText(regionData.competitionLevel)}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {formatCurrency(regionData.estimatedRevenue.min)} - {formatCurrency(regionData.estimatedRevenue.max)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">データなし</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Chart View */}
          {viewMode === 'chart' && (
            <div className="space-y-6">
              {/* Market Potential Chart */}
              <div>
                <h4 className="font-semibold mb-4">地域別市場ポテンシャル</h4>
                <div className="space-y-2">
                  {selectedRegions.map((region) => {
                    const avgPotential = comparison.themes.reduce((sum, theme) => {
                      const regionData = theme.regionalData[region]
                      return sum + (regionData?.marketPotential || 0)
                    }, 0) / comparison.themes.length

                    return (
                      <div key={region} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium">
                          {COUNTRY_NAMES[region]}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div
                            className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.min(avgPotential, 100)}%` }}
                          >
                            <span className="text-white text-xs font-medium">
                              {avgPotential.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Competition Level Distribution */}
              <div>
                <h4 className="font-semibold mb-4">競合レベル分布</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedRegions.map((region) => {
                    const regionThemes = comparison.themes.map(theme => theme.regionalData[region]).filter(Boolean)
                    const lowComp = regionThemes.filter(rd => rd.competitionLevel === 'low').length
                    const medComp = regionThemes.filter(rd => rd.competitionLevel === 'medium').length
                    const highComp = regionThemes.filter(rd => rd.competitionLevel === 'high').length
                    const total = regionThemes.length

                    return (
                      <div key={region} className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium mb-2">{COUNTRY_NAMES[region]}</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600">低競合</span>
                            <span>{total > 0 ? Math.round((lowComp / total) * 100) : 0}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-yellow-600">中競合</span>
                            <span>{total > 0 ? Math.round((medComp / total) * 100) : 0}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-red-600">高競合</span>
                            <span>{total > 0 ? Math.round((highComp / total) * 100) : 0}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">推奨事項</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• {COUNTRY_NAMES[comparison.comparisonMetrics.bestRegion]}が最も高い市場ポテンシャルを示しています</li>
              <li>• 競合レベルが低い地域での展開を優先的に検討してください</li>
              <li>• 複数地域での同時展開により、リスク分散が可能です</li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  )
}