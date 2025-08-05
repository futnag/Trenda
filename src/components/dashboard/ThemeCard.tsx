'use client'

import Link from 'next/link'
import type { Theme } from '@/types'
import Card from '@/components/common/Card'

interface ThemeCardProps {
  theme: Theme
  className?: string
}

export function ThemeCard({ theme, className = '' }: ThemeCardProps) {
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

  // Get competition level color and label
  const getCompetitionInfo = (level: string) => {
    const info: Record<string, { label: string; color: string; bgColor: string }> = {
      low: { label: '低競合', color: 'text-green-800', bgColor: 'bg-green-100' },
      medium: { label: '中競合', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
      high: { label: '高競合', color: 'text-red-800', bgColor: 'bg-red-100' },
    }
    return info[level] || { label: level, color: 'text-gray-800', bgColor: 'bg-gray-100' }
  }

  // Get technical difficulty color and label
  const getDifficultyInfo = (difficulty: string) => {
    const info: Record<string, { label: string; color: string; bgColor: string }> = {
      beginner: { label: '初級', color: 'text-green-800', bgColor: 'bg-green-100' },
      intermediate: { label: '中級', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
      advanced: { label: '上級', color: 'text-red-800', bgColor: 'bg-red-100' },
    }
    return info[difficulty] || { label: difficulty, color: 'text-gray-800', bgColor: 'bg-gray-100' }
  }

  // Get monetization score color and background
  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
    if (score >= 60) return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' }
    if (score >= 40) return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' }
    return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  }

  // Get score label
  const getScoreLabel = (score: number) => {
    if (score >= 80) return '優秀'
    if (score >= 60) return '良好'
    if (score >= 40) return '普通'
    return '要改善'
  }

  const competitionInfo = getCompetitionInfo(theme.competitionLevel)
  const difficultyInfo = getDifficultyInfo(theme.technicalDifficulty)
  const scoreInfo = getScoreColor(theme.monetizationScore)

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${className}`}>
      <Link href={`/themes/${theme.id}`} className="block p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {theme.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {theme.description}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <div className={`
              px-3 py-2 rounded-lg border text-center min-w-[80px]
              ${scoreInfo.bg} ${scoreInfo.border}
            `}>
              <div className={`text-2xl font-bold ${scoreInfo.text}`}>
                {theme.monetizationScore}
              </div>
              <div className={`text-xs font-medium ${scoreInfo.text}`}>
                {getScoreLabel(theme.monetizationScore)}
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {getCategoryLabel(theme.category)}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${competitionInfo.bgColor} ${competitionInfo.color}`}>
            {competitionInfo.label}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyInfo.bgColor} ${difficultyInfo.color}`}>
            {difficultyInfo.label}
          </span>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-500 mb-1">市場規模</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatNumber(theme.marketSize)}
            </div>
            <div className="text-xs text-gray-500">
              {theme.marketSize >= 1000000 ? '大規模市場' : 
               theme.marketSize >= 500000 ? '中規模市場' : '小規模市場'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-500 mb-1">推定月収</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatCurrency(theme.estimatedRevenue.min)}
            </div>
            <div className="text-xs text-gray-500">
              〜 {formatCurrency(theme.estimatedRevenue.max)}
            </div>
          </div>
        </div>

        {/* Data Sources */}
        {theme.dataSources && Array.isArray(theme.dataSources) && theme.dataSources.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">データソース</div>
            <div className="flex flex-wrap gap-1">
              {theme.dataSources.slice(0, 3).map((source: any, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {source.source || 'Unknown'}
                </span>
              ))}
              {theme.dataSources.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  +{theme.dataSources.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            更新: {new Date(theme.updatedAt).toLocaleDateString('ja-JP')}
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            詳細を見る
          </div>
        </div>
      </Link>
    </Card>
  )
}

// Utility component for displaying theme metrics in a compact format
export function ThemeCardCompact({ theme, className = '' }: ThemeCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      productivity: '生産性',
      entertainment: 'エンタメ',
      education: '教育',
      health: 'ヘルス',
      finance: '金融',
      social: 'ソーシャル',
    }
    return labels[category] || category
  }

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow duration-200 ${className}`}>
      <Link href={`/themes/${theme.id}`} className="block">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900 truncate flex-1">
            {theme.title}
          </h4>
          <div className={`text-lg font-bold ml-2 ${getScoreColor(theme.monetizationScore)}`}>
            {theme.monetizationScore}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {getCategoryLabel(theme.category)}
          </span>
          <div className="text-xs text-gray-500">
            {new Date(theme.updatedAt).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </Link>
    </Card>
  )
}