'use client'

import { useMemo } from 'react'
import type { Theme, CompetitorAnalysis } from '@/types'
import Card from '@/components/common/Card'

interface CompetitorAnalysisSectionProps {
  theme: Theme
  competitors: CompetitorAnalysis[]
  className?: string
}

export function CompetitorAnalysisSection({ 
  theme, 
  competitors, 
  className = '' 
}: CompetitorAnalysisSectionProps) {
  // Analyze competitor data
  const competitorInsights = useMemo(() => {
    if (!competitors || competitors.length === 0) {
      return {
        totalCompetitors: 0,
        averageRevenue: 0,
        averageUsers: 0,
        pricingModels: {},
        marketSaturation: 'unknown',
        competitiveAdvantages: [],
        marketGaps: []
      }
    }

    const totalCompetitors = competitors.length
    const revenueData = competitors.filter(c => c.estimatedRevenue).map(c => c.estimatedRevenue!)
    const userCountData = competitors.filter(c => c.userCount).map(c => c.userCount!)
    
    const averageRevenue = revenueData.length > 0 
      ? revenueData.reduce((sum, rev) => sum + rev, 0) / revenueData.length 
      : 0
    
    const averageUsers = userCountData.length > 0 
      ? userCountData.reduce((sum, users) => sum + users, 0) / userCountData.length 
      : 0

    // Analyze pricing models
    const pricingModels = competitors.reduce((acc, competitor) => {
      if (competitor.pricingModel) {
        acc[competitor.pricingModel] = (acc[competitor.pricingModel] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Determine market saturation
    let marketSaturation: 'low' | 'medium' | 'high' | 'unknown' = 'unknown'
    if (totalCompetitors <= 3) marketSaturation = 'low'
    else if (totalCompetitors <= 10) marketSaturation = 'medium'
    else marketSaturation = 'high'

    // Identify competitive advantages and gaps
    const allFeatures = competitors.flatMap(c => c.features || [])
    const featureFrequency = allFeatures.reduce((acc, feature) => {
      acc[feature] = (acc[feature] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const competitiveAdvantages = Object.entries(featureFrequency)
      .filter(([, count]) => count < totalCompetitors * 0.5)
      .map(([feature]) => feature)
      .slice(0, 5)

    const marketGaps = [
      'モバイルファースト設計',
      'AI/ML機能統合',
      'リアルタイム協業',
      'オフライン対応',
      'カスタマイズ性'
    ].filter(gap => !allFeatures.includes(gap))

    return {
      totalCompetitors,
      averageRevenue: Math.round(averageRevenue),
      averageUsers: Math.round(averageUsers),
      pricingModels,
      marketSaturation,
      competitiveAdvantages,
      marketGaps
    }
  }, [competitors])

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

  // Get market saturation info
  const getSaturationInfo = (saturation: string) => {
    const info: Record<string, { 
      label: string
      color: string
      bgColor: string
      description: string
      opportunity: string
    }> = {
      low: {
        label: '低飽和',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'ブルーオーシャン市場',
        opportunity: '参入しやすく、先行者利益を得やすい'
      },
      medium: {
        label: '中飽和',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        description: 'バランス市場',
        opportunity: '差別化により成功可能'
      },
      high: {
        label: '高飽和',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        description: 'レッドオーシャン市場',
        opportunity: '独自性と革新が必要'
      },
      unknown: {
        label: '不明',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        description: 'データ不足',
        opportunity: '市場調査が必要'
      }
    }
    return info[saturation] || info.unknown
  }

  const saturationInfo = getSaturationInfo(competitorInsights.marketSaturation)

  // Get competitive positioning recommendations
  const getPositioningRecommendations = () => {
    const recommendations = []

    if (competitorInsights.marketSaturation === 'low') {
      recommendations.push({
        strategy: '市場リーダーシップ',
        description: '先行者利益を活かし、市場標準を確立する',
        priority: 'high'
      })
    }

    if (competitorInsights.marketSaturation === 'medium') {
      recommendations.push({
        strategy: '差別化戦略',
        description: '独自機能や優れたUXで競合と差別化する',
        priority: 'high'
      })
    }

    if (competitorInsights.marketSaturation === 'high') {
      recommendations.push({
        strategy: 'ニッチ戦略',
        description: '特定セグメントに特化して競争を避ける',
        priority: 'high'
      })
    }

    if (competitorInsights.marketGaps.length > 0) {
      recommendations.push({
        strategy: 'ギャップ戦略',
        description: '競合が対応していない機能やニーズに焦点を当てる',
        priority: 'medium'
      })
    }

    if (competitorInsights.averageRevenue > 0) {
      recommendations.push({
        strategy: '価格戦略',
        description: `市場平均（${formatCurrency(competitorInsights.averageRevenue)}）を参考に価格設定する`,
        priority: 'medium'
      })
    }

    return recommendations
  }

  const positioningRecommendations = getPositioningRecommendations()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Competitive Landscape Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">競合環境概要</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">競合企業数</span>
              <span className="text-2xl">🏢</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {competitorInsights.totalCompetitors}社
            </div>
            <div className="text-sm text-blue-700">
              直接・間接競合
            </div>
          </div>

          <div className={`p-4 rounded-lg ${saturationInfo.bgColor}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">市場飽和度</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className={`text-lg font-bold ${saturationInfo.color}`}>
              {saturationInfo.label}
            </div>
            <div className={`text-sm ${saturationInfo.color}`}>
              {saturationInfo.description}
            </div>
          </div>

          {competitorInsights.averageRevenue > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">平均収益</span>
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(competitorInsights.averageRevenue)}
              </div>
              <div className="text-sm text-green-700">
                月間推定
              </div>
            </div>
          )}

          {competitorInsights.averageUsers > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">平均ユーザー数</span>
                <span className="text-2xl">👥</span>
              </div>
              <div className="text-lg font-bold text-purple-600">
                {formatNumber(competitorInsights.averageUsers)}
              </div>
              <div className="text-sm text-purple-700">
                アクティブユーザー
              </div>
            </div>
          )}
        </div>

        <div className={`mt-6 p-4 rounded-lg ${saturationInfo.bgColor}`}>
          <div className="flex items-center mb-2">
            <span className="text-lg mr-2">💡</span>
            <span className="font-medium text-gray-900">市場機会</span>
          </div>
          <p className={`text-sm ${saturationInfo.color}`}>
            {saturationInfo.opportunity}
          </p>
        </div>
      </Card>

      {/* Competitor List */}
      {competitors.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">主要競合企業</h3>
          
          <div className="space-y-4">
            {competitors.map((competitor, index) => (
              <div key={competitor.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">
                      {competitor.competitorName}
                    </h4>
                    {competitor.competitorUrl && (
                      <a 
                        href={competitor.competitorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {competitor.competitorUrl}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {competitor.marketShare && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                        シェア {competitor.marketShare}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {competitor.pricingModel && (
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-500 mb-1">価格モデル</div>
                      <div className="text-sm font-medium text-gray-900">
                        {competitor.pricingModel}
                      </div>
                    </div>
                  )}

                  {competitor.estimatedRevenue && (
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-500 mb-1">推定月収</div>
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(competitor.estimatedRevenue)}
                      </div>
                    </div>
                  )}

                  {competitor.userCount && (
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-500 mb-1">ユーザー数</div>
                      <div className="text-sm font-medium text-purple-600">
                        {formatNumber(competitor.userCount)}
                      </div>
                    </div>
                  )}
                </div>

                {competitor.features && competitor.features.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-900 mb-2">主要機能</div>
                    <div className="flex flex-wrap gap-2">
                      {competitor.features.map((feature, featureIndex) => (
                        <span 
                          key={featureIndex}
                          className="bg-gray-200 text-gray-800 text-xs font-medium px-2 py-1 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pricing Model Analysis */}
      {Object.keys(competitorInsights.pricingModels).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">価格モデル分析</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(competitorInsights.pricingModels)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([model, count]) => (
                <div key={model} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">{model}</span>
                    <span className="text-lg font-bold text-blue-600">{count}</span>
                  </div>
                  <div className="text-xs text-blue-700">
                    {Math.round((count as number) / competitorInsights.totalCompetitors * 100)}% の競合が採用
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">💡</span>
              <span className="font-medium text-yellow-900">価格戦略の提案</span>
            </div>
            <p className="text-sm text-yellow-800">
              最も一般的な価格モデルは「{Object.entries(competitorInsights.pricingModels)[0]?.[0]}」です。
              差別化のために異なるモデルを検討するか、同じモデルでより良い価値提案を行うことを推奨します。
            </p>
          </div>
        </Card>
      )}

      {/* Competitive Advantages & Market Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitive Advantages */}
        {competitorInsights.competitiveAdvantages.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">競争優位の機会</h3>
            
            <div className="space-y-3">
              {competitorInsights.competitiveAdvantages.map((advantage, index) => (
                <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                    <span className="text-sm text-green-800">{advantage}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              これらの機能は競合の半数未満しか提供していないため、差別化の機会があります。
            </div>
          </Card>
        )}

        {/* Market Gaps */}
        {competitorInsights.marketGaps.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">市場ギャップ</h3>
            
            <div className="space-y-3">
              {competitorInsights.marketGaps.map((gap, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                    <span className="text-sm text-blue-800">{gap}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              これらの機能は競合が提供していない可能性があり、ブルーオーシャンの機会となります。
            </div>
          </Card>
        )}
      </div>

      {/* Positioning Recommendations */}
      {positioningRecommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">ポジショニング戦略</h3>
          
          <div className="space-y-4">
            {positioningRecommendations.map((rec, index) => (
              <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-md font-semibold text-purple-900">{rec.strategy}</h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority === 'high' ? '高優先度' :
                     rec.priority === 'medium' ? '中優先度' : '低優先度'}
                  </span>
                </div>
                <p className="text-sm text-purple-800">{rec.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No Competitors Message */}
      {competitors.length === 0 && (
        <Card className="p-8 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">競合データがありません</h3>
          <p className="text-sm text-gray-500 mb-4">
            このテーマの競合分析データが収集されていません。
          </p>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <span className="text-lg mr-2">🎯</span>
              <span className="font-medium text-green-900">ブルーオーシャンの可能性</span>
            </div>
            <p className="text-sm text-green-800">
              競合が少ない、または存在しない可能性があります。これは先行者利益を得る絶好の機会かもしれません。
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}