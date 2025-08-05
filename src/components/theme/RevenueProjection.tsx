'use client'

import { useState } from 'react'
import type { Theme, RevenueProjection as RevenueProjectionType } from '@/types'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'

interface RevenueProjectionProps {
  theme: Theme
  className?: string
}

interface RevenueScenario {
  name: string
  label: string
  description: string
  color: string
  bgColor: string
  borderColor: string
}

const REVENUE_SCENARIOS: Record<string, RevenueScenario> = {
  conservative: {
    name: 'conservative',
    label: '保守的',
    description: '最も慎重な見積もり。リスクを最小限に抑えた現実的な下限値',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  realistic: {
    name: 'realistic',
    label: '現実的',
    description: '標準的な成功パターンに基づく最も可能性の高い収益予測',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  optimistic: {
    name: 'optimistic',
    label: '楽観的',
    description: '理想的な条件が揃った場合の最大収益ポテンシャル',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
}

const TIMEFRAME_OPTIONS = [
  { value: 'month', label: '月次', multiplier: 1 },
  { value: 'quarter', label: '四半期', multiplier: 3 },
  { value: 'year', label: '年次', multiplier: 12 },
] as const

export function RevenueProjection({ theme, className = '' }: RevenueProjectionProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'quarter' | 'year'>('month')
  const [showDetails, setShowDetails] = useState(false)

  // Calculate revenue projections based on theme data
  const calculateRevenueProjection = (): RevenueProjectionType => {
    const baseRevenue = (theme.estimatedRevenue.min + theme.estimatedRevenue.max) / 2
    const marketSizeFactor = theme.marketSize / 1000000 // Normalize market size
    const scoreFactor = theme.monetizationScore / 100
    const competitionFactor = theme.competitionLevel === 'low' ? 1.2 : theme.competitionLevel === 'medium' ? 1.0 : 0.8
    const difficultyFactor = theme.technicalDifficulty === 'beginner' ? 1.1 : theme.technicalDifficulty === 'intermediate' ? 1.0 : 0.9

    const adjustmentFactor = marketSizeFactor * scoreFactor * competitionFactor * difficultyFactor

    const timeMultiplier = TIMEFRAME_OPTIONS.find(opt => opt.value === selectedTimeframe)?.multiplier || 1

    return {
      timeframe: selectedTimeframe,
      scenarios: {
        conservative: Math.round(baseRevenue * 0.3 * adjustmentFactor * timeMultiplier),
        realistic: Math.round(baseRevenue * 0.7 * adjustmentFactor * timeMultiplier),
        optimistic: Math.round(baseRevenue * 1.5 * adjustmentFactor * timeMultiplier),
      },
      assumptions: [
        {
          factor: '市場規模',
          value: theme.marketSize,
          confidence: 75,
          source: 'トレンドデータ分析',
        },
        {
          factor: 'マネタイズスコア',
          value: theme.monetizationScore,
          confidence: 80,
          source: '総合評価アルゴリズム',
        },
        {
          factor: '競合レベル',
          value: theme.competitionLevel === 'low' ? 20 : theme.competitionLevel === 'medium' ? 50 : 80,
          confidence: 70,
          source: '競合分析',
        },
        {
          factor: '技術難易度',
          value: theme.technicalDifficulty === 'beginner' ? 30 : theme.technicalDifficulty === 'intermediate' ? 50 : 70,
          confidence: 85,
          source: '技術要件分析',
        },
      ],
    }
  }

  const projection = calculateRevenueProjection()

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate revenue timeline milestones
  const calculateTimeline = () => {
    const baseMonthlyRevenue = projection.scenarios.realistic / (selectedTimeframe === 'month' ? 1 : selectedTimeframe === 'quarter' ? 3 : 12)
    
    return {
      mvpToFirstRevenue: {
        period: '2-4ヶ月',
        description: 'MVP開発から初回収益まで',
        amount: Math.round(baseMonthlyRevenue * 0.1),
      },
      to10k: {
        period: '6-12ヶ月',
        description: '月次収益1万円達成まで',
        amount: 10000,
      },
      to100k: {
        period: '12-24ヶ月',
        description: '月次収益10万円達成まで',
        amount: 100000,
      },
    }
  }

  const timeline = calculateTimeline()

  return (
    <Card className={`${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              収益予測
            </h3>
            <p className="text-sm text-gray-600">
              {theme.title}の収益化ポテンシャル分析
            </p>
          </div>
          
          {/* Timeframe Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {TIMEFRAME_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedTimeframe(option.value)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedTimeframe === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Revenue Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(projection.scenarios).map(([scenarioKey, amount]) => {
            const scenario = REVENUE_SCENARIOS[scenarioKey]
            return (
              <div
                key={scenarioKey}
                className={`p-4 rounded-lg border-2 ${scenario.bgColor} ${scenario.borderColor}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold ${scenario.color}`}>
                    {scenario.label}
                  </h4>
                  <div className="text-xs text-gray-500">
                    {selectedTimeframe === 'month' ? '月次' : selectedTimeframe === 'quarter' ? '四半期' : '年次'}
                  </div>
                </div>
                
                <div className={`text-2xl font-bold ${scenario.color} mb-2`}>
                  {formatCurrency(amount)}
                </div>
                
                <p className="text-xs text-gray-600">
                  {scenario.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Revenue Timeline */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-4">収益化タイムライン</h4>
          <div className="space-y-4">
            {Object.entries(timeline).map(([key, milestone]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {milestone.description}
                  </div>
                  <div className="text-sm text-gray-600">
                    予想期間: {milestone.period}
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(milestone.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assumptions Toggle */}
        <div className="border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full"
          >
            {showDetails ? '詳細を隠す' : '計算根拠を表示'}
            <svg
              className={`ml-2 h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </div>

        {/* Detailed Assumptions */}
        {showDetails && (
          <div className="mt-4 space-y-4">
            <h5 className="font-medium text-gray-900">計算に使用した前提条件</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projection.assumptions.map((assumption, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {assumption.factor}
                    </span>
                    <span className="text-sm text-gray-600">
                      信頼度: {assumption.confidence}%
                    </span>
                  </div>
                  
                  <div className="text-lg font-semibold text-gray-900 mb-1">
                    {typeof assumption.value === 'number' && assumption.factor.includes('スコア') 
                      ? `${assumption.value}点`
                      : typeof assumption.value === 'number' && assumption.factor.includes('市場規模')
                      ? `${(assumption.value / 1000000).toFixed(1)}M`
                      : assumption.value
                    }
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    データソース: {assumption.source}
                  </div>
                  
                  {/* Confidence Bar */}
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${assumption.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculation Method */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h6 className="font-medium text-blue-900 mb-2">計算方法</h6>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• 基準収益 = (最小推定収益 + 最大推定収益) ÷ 2</p>
                <p>• 調整係数 = 市場規模係数 × スコア係数 × 競合係数 × 難易度係数</p>
                <p>• 保守的 = 基準収益 × 0.3 × 調整係数</p>
                <p>• 現実的 = 基準収益 × 0.7 × 調整係数</p>
                <p>• 楽観的 = 基準収益 × 1.5 × 調整係数</p>
              </div>
            </div>

            {/* Risk Factors */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h6 className="font-medium text-yellow-900 mb-2">リスク要因</h6>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>• 市場の変動や競合の参入により実際の収益は変動する可能性があります</p>
                <p>• 技術的な実装難易度が予想より高い場合、開発期間が延長される可能性があります</p>
                <p>• ユーザー獲得コストが予想より高い場合、収益性が低下する可能性があります</p>
                <p>• 規制変更や市場環境の変化により収益モデルの見直しが必要になる場合があります</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// Compact version for dashboard display
export function RevenueProjectionCompact({ theme, className = '' }: RevenueProjectionProps) {
  const baseRevenue = (theme.estimatedRevenue.min + theme.estimatedRevenue.max) / 2
  const scoreFactor = theme.monetizationScore / 100
  const realisticRevenue = Math.round(baseRevenue * 0.7 * scoreFactor)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className={`p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">月次収益予測</h4>
        <div className="text-xs text-gray-500">現実的シナリオ</div>
      </div>
      
      <div className="text-2xl font-bold text-green-600 mb-1">
        {formatCurrency(realisticRevenue)}
      </div>
      
      <div className="text-xs text-gray-600">
        マネタイズスコア {theme.monetizationScore}点 に基づく予測
      </div>
    </div>
  )
}