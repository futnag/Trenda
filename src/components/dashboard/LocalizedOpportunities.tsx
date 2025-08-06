'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '../common/Card'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { 
  CountryCode, 
  LocalizedOpportunity 
} from '../../types/regional'
import { COUNTRY_NAMES } from '../../types/regional'
import { regionalAnalysisOperations } from '../../lib/regional-database'

interface LocalizedOpportunitiesProps {
  selectedRegion: CountryCode | null
  onRegionChange: (region: CountryCode | null) => void
  themeIds?: string[]
  minMarketGap?: number
  minConfidence?: number
  className?: string
}

export function LocalizedOpportunities({
  selectedRegion,
  onRegionChange,
  themeIds,
  minMarketGap = 0,
  minConfidence = 0,
  className = '',
}: LocalizedOpportunitiesProps) {
  const [opportunities, setOpportunities] = useState<LocalizedOpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedOpportunity, setExpandedOpportunity] = useState<string | null>(null)

  useEffect(() => {
    if (selectedRegion) {
      loadOpportunities()
    } else {
      setOpportunities([])
    }
  }, [selectedRegion, themeIds, minMarketGap, minConfidence])

  const loadOpportunities = async () => {
    if (!selectedRegion) return

    setLoading(true)
    setError(null)

    try {
      const response = await regionalAnalysisOperations.getLocalizedOpportunities(
        selectedRegion,
        {
          themeIds,
          minMarketGap,
          minConfidence,
          limit: 20,
        }
      )

      if (response.error) {
        setError(response.error)
      } else {
        setOpportunities(response.data || [])
      }
    } catch (err) {
      setError('ローカライゼーション機会の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getMarketGapColor = (gap: number) => {
    if (gap >= 80) return 'text-green-600 bg-green-100'
    if (gap >= 60) return 'text-blue-600 bg-blue-100'
    if (gap >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-blue-600'
    if (confidence >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const toggleExpanded = (opportunityId: string) => {
    setExpandedOpportunity(
      expandedOpportunity === opportunityId ? null : opportunityId
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">ローカライゼーション機会</h3>
        <div className="flex items-center gap-2">
          <select
            value={selectedRegion || ''}
            onChange={(e) => onRegionChange(e.target.value as CountryCode || null)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">地域を選択</option>
            {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedRegion && (
        <div className="text-center text-gray-500 py-8">
          <p>地域を選択してローカライゼーション機会を表示してください</p>
        </div>
      )}

      {selectedRegion && loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {selectedRegion && error && (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadOpportunities}>再試行</Button>
        </div>
      )}

      {selectedRegion && opportunities.length === 0 && !loading && !error && (
        <div className="text-center text-gray-500 py-8">
          <p>この地域のローカライゼーション機会が見つかりませんでした</p>
        </div>
      )}

      {selectedRegion && opportunities.length > 0 && !loading && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">機会数</h4>
              <p className="text-2xl font-bold text-blue-600">{opportunities.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800">平均市場ギャップ</h4>
              <p className="text-2xl font-bold text-green-600">
                {opportunities.length > 0 
                  ? Math.round(opportunities.reduce((sum, opp) => sum + opp.marketGap, 0) / opportunities.length)
                  : 0}%
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800">推定収益範囲</h4>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(Math.min(...opportunities.map(opp => opp.estimatedRevenue.min)))} - 
                {formatCurrency(Math.max(...opportunities.map(opp => opp.estimatedRevenue.max)))}
              </p>
            </div>
          </div>

          {/* Opportunities List */}
          <div className="space-y-4">
            {opportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{opportunity.theme}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getMarketGapColor(opportunity.marketGap)}`}>
                        市場ギャップ {opportunity.marketGap}%
                      </span>
                      <span className={`text-sm font-medium ${getConfidenceColor(opportunity.confidence)}`}>
                        信頼度 {opportunity.confidence}%
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{opportunity.localNeed}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        推定収益: {formatCurrency(opportunity.estimatedRevenue.min)} - {formatCurrency(opportunity.estimatedRevenue.max)}
                      </span>
                      <span>データソース: {opportunity.dataSource}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(opportunity.id)}
                  >
                    {expandedOpportunity === opportunity.id ? '折りたたむ' : '詳細'}
                  </Button>
                </div>

                {expandedOpportunity === opportunity.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Cultural Factors */}
                      <div>
                        <h5 className="font-semibold mb-2">文化的要因</h5>
                        {opportunity.culturalFactors.length > 0 ? (
                          <ul className="space-y-1">
                            {opportunity.culturalFactors.map((factor, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {factor}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">特記事項なし</p>
                        )}
                      </div>

                      {/* Regulatory Considerations */}
                      <div>
                        <h5 className="font-semibold mb-2">規制上の考慮事項</h5>
                        {opportunity.regulatoryConsiderations.length > 0 ? (
                          <ul className="space-y-1">
                            {opportunity.regulatoryConsiderations.map((consideration, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="text-orange-500 mr-2">⚠</span>
                                {consideration}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">特記事項なし</p>
                        )}
                      </div>
                    </div>

                    {/* Action Recommendations */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-semibold mb-2">推奨アクション</h5>
                      <div className="text-sm text-gray-700 space-y-1">
                        {opportunity.marketGap >= 70 && (
                          <p>• 高い市場ギャップが確認されています。早期参入を検討してください。</p>
                        )}
                        {opportunity.confidence >= 80 && (
                          <p>• 高い信頼度のデータに基づいています。投資判断の材料として活用できます。</p>
                        )}
                        {opportunity.culturalFactors.length > 0 && (
                          <p>• 文化的要因を考慮したローカライゼーション戦略が重要です。</p>
                        )}
                        {opportunity.regulatoryConsiderations.length > 0 && (
                          <p>• 規制要件の詳細調査と法的コンプライアンスの確認が必要です。</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load More */}
          {opportunities.length >= 20 && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={loadOpportunities}>
                さらに読み込む
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}