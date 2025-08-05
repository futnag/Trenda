'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/common/Card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { Theme, MonetizationFactors } from '@/types'
import type { ScoreAnalysis } from '@/lib/monetization-score'
import { 
  getFactorDisplayName, 
  getFactorDescription,
  calculateScoreBreakdown 
} from '@/lib/monetization-score'
import { analyzeThemeScoreTrend } from '@/lib/score-history'

// =============================================================================
// TYPES
// =============================================================================

interface MonetizationScoreProps {
  theme: Theme
  showBreakdown?: boolean
  showTrend?: boolean
  className?: string
}

interface ScoreBreakdownProps {
  factors: MonetizationFactors
  breakdown: Record<keyof MonetizationFactors, number>
}

interface ScoreTrendProps {
  analysis: ScoreAnalysis
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
  if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
  if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return '高収益化可能性'
  if (score >= 60) return '中程度の収益化可能性'
  if (score >= 40) return '低い収益化可能性'
  return '収益化困難'
}

function getTrendIcon(trend: 'increasing' | 'decreasing' | 'stable'): string {
  switch (trend) {
    case 'increasing': return '📈'
    case 'decreasing': return '📉'
    case 'stable': return '➡️'
  }
}

function getTrendColor(trend: 'increasing' | 'decreasing' | 'stable'): string {
  switch (trend) {
    case 'increasing': return 'text-green-600'
    case 'decreasing': return 'text-red-600'
    case 'stable': return 'text-gray-600'
  }
}

// =============================================================================
// SCORE BREAKDOWN COMPONENT
// =============================================================================

function ScoreBreakdown({ factors, breakdown }: ScoreBreakdownProps) {
  const factorEntries = Object.entries(factors) as [keyof MonetizationFactors, number][]
  
  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-medium text-gray-700">スコア内訳</h4>
      <div className="space-y-2">
        {factorEntries.map(([factor, value]) => {
          const contribution = breakdown[factor]
          const displayName = getFactorDisplayName(factor)
          const description = getFactorDescription(factor)
          
          // Adjust display for inverted factors
          const displayValue = factor === 'competitionLevel' || factor === 'customerAcquisitionCost' 
            ? 100 - value 
            : value
          
          return (
            <div key={factor} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">
                    {displayName}
                  </span>
                  <div className="group relative">
                    <span className="text-xs text-gray-400 cursor-help">ℹ️</span>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-48 z-10">
                      {description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${displayValue}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">
                    {Math.round(displayValue)}
                  </span>
                </div>
              </div>
              <div className="ml-4 text-right">
                <span className="text-sm font-medium text-gray-900">
                  {contribution.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500 ml-1">pt</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// SCORE TREND COMPONENT
// =============================================================================

function ScoreTrend({ analysis }: ScoreTrendProps) {
  const trendIcon = getTrendIcon(analysis.trend)
  const trendColor = getTrendColor(analysis.trend)
  
  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
      <h4 className="text-sm font-medium text-gray-700 mb-2">トレンド分析</h4>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">トレンド:</span>
          <div className={`flex items-center space-x-1 ${trendColor}`}>
            <span>{trendIcon}</span>
            <span className="font-medium">
              {analysis.trend === 'increasing' && '上昇中'}
              {analysis.trend === 'decreasing' && '下降中'}
              {analysis.trend === 'stable' && '安定'}
            </span>
          </div>
        </div>
        
        <div>
          <span className="text-gray-600">変化率:</span>
          <span className={`font-medium ${trendColor}`}>
            {analysis.changePercentage > 0 ? '+' : ''}
            {analysis.changePercentage.toFixed(1)}%
          </span>
        </div>
        
        <div>
          <span className="text-gray-600">最強要因:</span>
          <span className="font-medium text-green-600">
            {getFactorDisplayName(analysis.factors.strongest)}
          </span>
        </div>
        
        <div>
          <span className="text-gray-600">最弱要因:</span>
          <span className="font-medium text-red-600">
            {getFactorDisplayName(analysis.factors.weakest)}
          </span>
        </div>
        
        {analysis.factors.mostImproved && (
          <div>
            <span className="text-gray-600">最改善:</span>
            <span className="font-medium text-green-600">
              {getFactorDisplayName(analysis.factors.mostImproved)}
            </span>
          </div>
        )}
        
        {analysis.factors.mostDeclined && (
          <div>
            <span className="text-gray-600">最悪化:</span>
            <span className="font-medium text-red-600">
              {getFactorDisplayName(analysis.factors.mostDeclined)}
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>信頼度: {Math.round(analysis.confidence)}%</span>
          <span>変動性: {Math.round(analysis.volatility)}%</span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MonetizationScore({ 
  theme, 
  showBreakdown = false, 
  showTrend = false,
  className = '' 
}: MonetizationScoreProps) {
  const [analysis, setAnalysis] = useState<ScoreAnalysis | null>(null)
  const [isLoadingTrend, setIsLoadingTrend] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const score = theme.monetizationScore
  const factors = theme.monetizationFactors
  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)

  // Load trend analysis if requested
  useEffect(() => {
    if (showTrend && factors) {
      setIsLoadingTrend(true)
      setError(null)
      
      analyzeThemeScoreTrend(theme.id, score, factors)
        .then(result => {
          setAnalysis(result)
        })
        .catch(err => {
          console.error('Error loading trend analysis:', err)
          setError('トレンド分析の読み込みに失敗しました')
        })
        .finally(() => {
          setIsLoadingTrend(false)
        })
    }
  }, [theme.id, score, factors, showTrend])

  // Calculate breakdown if factors are available
  const breakdown = factors ? calculateScoreBreakdown(factors) : null

  return (
    <Card className={`${className}`}>
      <div className="p-4">
        {/* Main Score Display */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              マネタイズスコア
            </h3>
            <p className="text-sm text-gray-600">
              収益化可能性の総合評価
            </p>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full border ${scoreColor}`}>
              <span className="text-2xl font-bold mr-2">{score}</span>
              <span className="text-sm font-medium">/ 100</span>
            </div>
            <div className="mt-1">
              <span className={`text-xs font-medium ${scoreColor.split(' ')[0]}`}>
                {scoreLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        {showBreakdown && factors && breakdown && (
          <ScoreBreakdown factors={factors} breakdown={breakdown} />
        )}

        {/* Trend Analysis */}
        {showTrend && (
          <div className="mt-4">
            {isLoadingTrend ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-gray-600">
                  トレンド分析を読み込み中...
                </span>
              </div>
            ) : error ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : analysis ? (
              <ScoreTrend analysis={analysis} />
            ) : null}
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-500">
            <span>最終更新: {new Date(theme.updatedAt).toLocaleDateString('ja-JP')}</span>
            {factors && (
              <span>
                データソース: {theme.dataSources.length}個
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// COMPACT VERSION FOR THEME CARDS
// =============================================================================

interface CompactMonetizationScoreProps {
  score: number
  trend?: 'increasing' | 'decreasing' | 'stable'
  className?: string
}

export function CompactMonetizationScore({ 
  score, 
  trend,
  className = '' 
}: CompactMonetizationScoreProps) {
  const scoreColor = getScoreColor(score)
  const trendIcon = trend ? getTrendIcon(trend) : null
  
  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center px-2 py-1 rounded-full border text-sm font-medium ${scoreColor}`}>
        <span>{score}</span>
        <span className="text-xs ml-1">/100</span>
      </div>
      {trendIcon && (
        <span className="text-sm" title={`トレンド: ${trend}`}>
          {trendIcon}
        </span>
      )}
    </div>
  )
}

export default MonetizationScore