'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Theme, TrendData, CompetitorAnalysis } from '@/types'
import Card from '@/components/common/Card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { TrendChart } from './TrendChart'
import { MarketDataSection } from './MarketDataSection'
import { TechnicalRequirementsSection } from './TechnicalRequirementsSection'
import { DevelopmentTimelineSection } from './DevelopmentTimelineSection'
import { CompetitorAnalysisSection } from './CompetitorAnalysisSection'
import { RevenueProjection } from './RevenueProjection'

interface ThemeDetailProps {
  theme: Theme
  trendData: TrendData[]
  competitors: CompetitorAnalysis[]
  className?: string
}

export function ThemeDetail({ 
  theme, 
  trendData, 
  competitors, 
  className = '' 
}: ThemeDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'technical' | 'timeline' | 'competitors'>('overview')

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

  // Get competition level info
  const getCompetitionInfo = (level: string) => {
    const info: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
      low: { 
        label: '低競合', 
        color: 'text-green-800', 
        bgColor: 'bg-green-100',
        description: '競合が少なく、参入しやすい市場です'
      },
      medium: { 
        label: '中競合', 
        color: 'text-yellow-800', 
        bgColor: 'bg-yellow-100',
        description: '適度な競合があり、差別化が重要です'
      },
      high: { 
        label: '高競合', 
        color: 'text-red-800', 
        bgColor: 'bg-red-100',
        description: '競合が多く、独自性が必要です'
      },
    }
    return info[level] || { 
      label: level, 
      color: 'text-gray-800', 
      bgColor: 'bg-gray-100',
      description: '競合レベル不明'
    }
  }

  // Get technical difficulty info
  const getDifficultyInfo = (difficulty: string) => {
    const info: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
      beginner: { 
        label: '初級', 
        color: 'text-green-800', 
        bgColor: 'bg-green-100',
        description: '基本的な技術で実装可能です'
      },
      intermediate: { 
        label: '中級', 
        color: 'text-yellow-800', 
        bgColor: 'bg-yellow-100',
        description: '中程度の技術スキルが必要です'
      },
      advanced: { 
        label: '上級', 
        color: 'text-red-800', 
        bgColor: 'bg-red-100',
        description: '高度な技術スキルが必要です'
      },
    }
    return info[difficulty] || { 
      label: difficulty, 
      color: 'text-gray-800', 
      bgColor: 'bg-gray-100',
      description: '技術難易度不明'
    }
  }

  // Get monetization score info
  const getScoreInfo = (score: number) => {
    if (score >= 80) return { 
      text: 'text-green-600', 
      bg: 'bg-green-50', 
      border: 'border-green-200',
      label: '優秀',
      description: '非常に高い収益化可能性があります'
    }
    if (score >= 60) return { 
      text: 'text-yellow-600', 
      bg: 'bg-yellow-50', 
      border: 'border-yellow-200',
      label: '良好',
      description: '良好な収益化可能性があります'
    }
    if (score >= 40) return { 
      text: 'text-orange-600', 
      bg: 'bg-orange-50', 
      border: 'border-orange-200',
      label: '普通',
      description: '平均的な収益化可能性です'
    }
    return { 
      text: 'text-red-600', 
      bg: 'bg-red-50', 
      border: 'border-red-200',
      label: '要改善',
      description: '収益化には工夫が必要です'
    }
  }

  const competitionInfo = getCompetitionInfo(theme.competitionLevel)
  const difficultyInfo = getDifficultyInfo(theme.technicalDifficulty)
  const scoreInfo = getScoreInfo(theme.monetizationScore)

  const tabs = [
    { id: 'overview', label: '概要', icon: '📊' },
    { id: 'market', label: '市場データ', icon: '📈' },
    { id: 'technical', label: '技術要件', icon: '⚙️' },
    { id: 'timeline', label: '開発期間', icon: '📅' },
    { id: 'competitors', label: '競合分析', icon: '🏢' },
  ] as const

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Breadcrumb */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
              <svg className="w-3 h-3 mr-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
              </svg>
              ダッシュボード
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link href="/themes" className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">
                テーマ一覧
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 truncate">
                {theme.title}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {theme.title}
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl">
              {theme.description}
            </p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-3 mt-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {getCategoryLabel(theme.category)}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${competitionInfo.bgColor} ${competitionInfo.color}`}>
                {competitionInfo.label}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${difficultyInfo.bgColor} ${difficultyInfo.color}`}>
                {difficultyInfo.label}
              </span>
            </div>
          </div>

          {/* Monetization Score */}
          <div className="mt-6 lg:mt-0 lg:ml-8 flex-shrink-0">
            <Card className={`p-6 text-center ${scoreInfo.bg} ${scoreInfo.border} border-2`}>
              <div className={`text-4xl font-bold ${scoreInfo.text} mb-2`}>
                {theme.monetizationScore}
              </div>
              <div className={`text-sm font-medium ${scoreInfo.text} mb-2`}>
                {scoreInfo.label}
              </div>
              <div className="text-xs text-gray-600">
                マネタイズスコア
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {scoreInfo.description}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">市場規模</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(theme.marketSize)}
              </div>
              <div className="text-xs text-gray-500">
                {theme.marketSize >= 1000000 ? '大規模市場' : 
                 theme.marketSize >= 500000 ? '中規模市場' : '小規模市場'}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">推定月収</div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(theme.estimatedRevenue.min)}
              </div>
              <div className="text-xs text-gray-500">
                〜 {formatCurrency(theme.estimatedRevenue.max)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 ${competitionInfo.bgColor} rounded-lg flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${competitionInfo.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">競合レベル</div>
              <div className={`text-lg font-bold ${competitionInfo.color}`}>
                {competitionInfo.label}
              </div>
              <div className="text-xs text-gray-500">
                {competitors.length}社の競合
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 ${difficultyInfo.bgColor} rounded-lg flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${difficultyInfo.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">技術難易度</div>
              <div className={`text-lg font-bold ${difficultyInfo.color}`}>
                {difficultyInfo.label}
              </div>
              <div className="text-xs text-gray-500">
                {difficultyInfo.description}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Trend Chart */}
            <TrendChart theme={theme} trendData={trendData} />
            
            {/* Revenue Projection */}
            <RevenueProjection theme={theme} />
            
            {/* Data Sources */}
            {theme.dataSources && Array.isArray(theme.dataSources) && theme.dataSources.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">データソース</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {theme.dataSources.map((source: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {source.source || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {source.timestamp ? new Date(source.timestamp).toLocaleDateString('ja-JP') : ''}
                        </span>
                      </div>
                      {source.searchVolume && (
                        <div className="text-sm text-gray-600">
                          検索ボリューム: {formatNumber(source.searchVolume)}
                        </div>
                      )}
                      {source.growthRate && (
                        <div className={`text-sm ${source.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          成長率: {source.growthRate > 0 ? '+' : ''}{source.growthRate.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'market' && (
          <MarketDataSection theme={theme} trendData={trendData} />
        )}

        {activeTab === 'technical' && (
          <TechnicalRequirementsSection theme={theme} />
        )}

        {activeTab === 'timeline' && (
          <DevelopmentTimelineSection theme={theme} />
        )}

        {activeTab === 'competitors' && (
          <CompetitorAnalysisSection theme={theme} competitors={competitors} />
        )}
      </div>

      {/* Last Updated */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="text-sm text-gray-500 text-center">
          最終更新: {new Date(theme.updatedAt).toLocaleString('ja-JP')}
        </div>
      </div>
    </div>
  )
}