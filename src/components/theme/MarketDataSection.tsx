'use client'

import { useMemo } from 'react'
import type { Theme, TrendData } from '@/types'
import Card from '@/components/common/Card'

interface MarketDataSectionProps {
  theme: Theme
  trendData: TrendData[]
  className?: string
}

export function MarketDataSection({ theme, trendData, className = '' }: MarketDataSectionProps) {
  // Calculate market insights from trend data
  const marketInsights = useMemo(() => {
    if (!trendData || trendData.length === 0) {
      return {
        totalSearchVolume: 0,
        growthTrend: 'stable',
        peakPeriod: null,
        geographicDistribution: {},
        demographicInsights: {},
        seasonality: 'unknown'
      }
    }

    // Calculate total search volume
    const totalSearchVolume = trendData.reduce((sum, item) => sum + (item.searchVolume || 0), 0)

    // Determine growth trend
    const recentData = trendData.slice(-5) // Last 5 data points
    const olderData = trendData.slice(0, 5) // First 5 data points
    const recentAvg = recentData.reduce((sum, item) => sum + (item.searchVolume || 0), 0) / recentData.length
    const olderAvg = olderData.reduce((sum, item) => sum + (item.searchVolume || 0), 0) / olderData.length
    
    let growthTrend: 'growing' | 'declining' | 'stable' = 'stable'
    if (recentAvg > olderAvg * 1.1) growthTrend = 'growing'
    else if (recentAvg < olderAvg * 0.9) growthTrend = 'declining'

    // Find peak period
    const peakData = trendData.reduce((peak, item) => 
      (item.searchVolume || 0) > (peak?.searchVolume || 0) ? item : peak
    , null as TrendData | null)

    // Aggregate geographic data
    const geographicDistribution = trendData.reduce((acc, item) => {
      if (item.geographicData) {
        Object.entries(item.geographicData).forEach(([country, volume]) => {
          acc[country] = (acc[country] || 0) + (volume as number)
        })
      }
      return acc
    }, {} as Record<string, number>)

    // Aggregate demographic insights
    const demographicInsights = trendData.reduce((acc, item) => {
      if (item.demographicData) {
        const demo = item.demographicData
        if (demo.ageGroup) {
          acc.ageGroups = acc.ageGroups || {}
          acc.ageGroups[demo.ageGroup] = (acc.ageGroups[demo.ageGroup] || 0) + 1
        }
        if (demo.gender) {
          acc.genders = acc.genders || {}
          acc.genders[demo.gender] = (acc.genders[demo.gender] || 0) + 1
        }
        if (demo.incomeLevel) {
          acc.incomeLevel = acc.incomeLevel || {}
          acc.incomeLevel[demo.incomeLevel] = (acc.incomeLevel[demo.incomeLevel] || 0) + 1
        }
      }
      return acc
    }, {} as any)

    return {
      totalSearchVolume,
      growthTrend,
      peakPeriod: peakData,
      geographicDistribution,
      demographicInsights,
      seasonality: 'unknown' // Would need more sophisticated analysis
    }
  }, [trendData])

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get growth trend info
  const getGrowthTrendInfo = (trend: string) => {
    const info: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
      growing: {
        label: '成長中',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: '📈'
      },
      declining: {
        label: '減少中',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: '📉'
      },
      stable: {
        label: '安定',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: '📊'
      }
    }
    return info[trend] || info.stable
  }

  // Get market size category
  const getMarketSizeCategory = (size: number) => {
    if (size >= 10000000) return { label: '超大規模市場', color: 'text-purple-600', bgColor: 'bg-purple-50' }
    if (size >= 5000000) return { label: '大規模市場', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (size >= 1000000) return { label: '中規模市場', color: 'text-blue-600', bgColor: 'bg-blue-50' }
    if (size >= 100000) return { label: '小規模市場', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    return { label: 'ニッチ市場', color: 'text-gray-600', bgColor: 'bg-gray-50' }
  }

  const trendInfo = getGrowthTrendInfo(marketInsights.growthTrend)
  const marketSizeInfo = getMarketSizeCategory(theme.marketSize)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Market Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">市場概要</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`p-4 rounded-lg ${marketSizeInfo.bgColor}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">市場規模</span>
              <span className="text-2xl">🎯</span>
            </div>
            <div className={`text-2xl font-bold ${marketSizeInfo.color}`}>
              {formatNumber(theme.marketSize)}
            </div>
            <div className={`text-sm ${marketSizeInfo.color}`}>
              {marketSizeInfo.label}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${trendInfo.bgColor}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">成長トレンド</span>
              <span className="text-2xl">{trendInfo.icon}</span>
            </div>
            <div className={`text-lg font-bold ${trendInfo.color}`}>
              {trendInfo.label}
            </div>
            <div className="text-sm text-gray-500">
              過去30日間の傾向
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">総検索ボリューム</span>
              <span className="text-2xl">🔍</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(marketInsights.totalSearchVolume)}
            </div>
            <div className="text-sm text-gray-500">
              全データソース合計
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">推定月収範囲</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(theme.estimatedRevenue.min)}
            </div>
            <div className="text-sm text-gray-500">
              〜 {formatCurrency(theme.estimatedRevenue.max)}
            </div>
          </div>
        </div>
      </Card>

      {/* Market Opportunity Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">市場機会分析</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monetization Factors */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">マネタイズ要因</h4>
            {theme.monetizationFactors ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">市場規模</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${theme.monetizationFactors.marketSize}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{theme.monetizationFactors.marketSize}/100</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">支払い意欲度</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${theme.monetizationFactors.paymentWillingness}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{theme.monetizationFactors.paymentWillingness}/100</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">競合レベル</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${theme.monetizationFactors.competitionLevel}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{theme.monetizationFactors.competitionLevel}/100</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">収益化手法の多様性</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${theme.monetizationFactors.revenueModels}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{theme.monetizationFactors.revenueModels}/100</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">顧客獲得コスト</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${100 - theme.monetizationFactors.customerAcquisitionCost}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{theme.monetizationFactors.customerAcquisitionCost}/100</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">顧客生涯価値</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${theme.monetizationFactors.customerLifetimeValue}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{theme.monetizationFactors.customerLifetimeValue}/100</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                マネタイズ要因のデータがありません
              </div>
            )}
          </div>

          {/* Market Insights */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">市場インサイト</h4>
            <div className="space-y-4">
              {marketInsights.peakPeriod && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">📊</span>
                    <span className="font-medium text-blue-900">ピーク期間</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    {new Date(marketInsights.peakPeriod.timestamp).toLocaleDateString('ja-JP')}
                  </div>
                  <div className="text-sm text-blue-700">
                    検索ボリューム: {formatNumber(marketInsights.peakPeriod.searchVolume || 0)}
                  </div>
                </div>
              )}

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">🎯</span>
                  <span className="font-medium text-green-900">市場機会</span>
                </div>
                <div className="text-sm text-green-800">
                  {theme.competitionLevel === 'low' ? 
                    'ブルーオーシャン市場 - 競合が少なく参入しやすい' :
                    theme.competitionLevel === 'medium' ?
                    'バランス市場 - 適度な競合で差別化が重要' :
                    'レッドオーシャン市場 - 競合が多く独自性が必要'
                  }
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">💡</span>
                  <span className="font-medium text-purple-900">推奨戦略</span>
                </div>
                <div className="text-sm text-purple-800">
                  {theme.monetizationScore >= 80 ? 
                    '積極的な投資と迅速な市場参入を推奨' :
                    theme.monetizationScore >= 60 ?
                    '慎重な市場調査と段階的な参入を推奨' :
                    '十分な差別化戦略と長期的な視点が必要'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Geographic Distribution */}
      {Object.keys(marketInsights.geographicDistribution).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">地域別分布</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(marketInsights.geographicDistribution)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 8)
              .map(([country, volume]) => (
                <div key={country} className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {country.toUpperCase()}
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatNumber(volume as number)}
                  </div>
                  <div className="text-xs text-gray-500">
                    検索ボリューム
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Demographic Insights */}
      {Object.keys(marketInsights.demographicInsights).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">人口統計学的インサイト</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {marketInsights.demographicInsights.ageGroups && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">年齢層分布</h4>
                <div className="space-y-2">
                  {Object.entries(marketInsights.demographicInsights.ageGroups)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .map(([ageGroup, count]) => (
                      <div key={ageGroup} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{ageGroup}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {marketInsights.demographicInsights.genders && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">性別分布</h4>
                <div className="space-y-2">
                  {Object.entries(marketInsights.demographicInsights.genders)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .map(([gender, count]) => (
                      <div key={gender} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {gender === 'male' ? '男性' : 
                           gender === 'female' ? '女性' : 
                           gender === 'other' ? 'その他' : '未回答'}
                        </span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {marketInsights.demographicInsights.incomeLevel && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">所得層分布</h4>
                <div className="space-y-2">
                  {Object.entries(marketInsights.demographicInsights.incomeLevel)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .map(([income, count]) => (
                      <div key={income} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {income === 'low' ? '低所得' : 
                           income === 'middle' ? '中所得' : 
                           income === 'high' ? '高所得' : 
                           income === 'premium' ? 'プレミアム' : income}
                        </span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}