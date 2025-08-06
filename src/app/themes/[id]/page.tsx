'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { themeOperations } from '@/lib/database'
import type { Theme, TrendData, CompetitorAnalysis } from '@/types'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ThemeDetail } from '@/components/theme/ThemeDetail'

export default function ThemeDetailPage() {
  const params = useParams()
  const themeId = params.id as string

  const [theme, setTheme] = useState<Theme | null>(null)
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadThemeData = async () => {
      if (!themeId) return

      try {
        setLoading(true)
        setError(null)

        // Load theme with all related data
        const response = await themeOperations.getThemeWithAllRelations(themeId)
        
        if (response.error) {
          throw new Error(response.error)
        }

        if (response.data) {
          setTheme(response.data)
          setTrendData(response.data.trend_data || [])
          setCompetitors(response.data.competitor_analysis || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'テーマの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    loadThemeData()
  }, [themeId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  if (!theme) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">テーマが見つかりません</h1>
          <p className="text-gray-600">指定されたテーマは存在しないか、削除された可能性があります。</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeDetail 
      theme={theme} 
      trendData={trendData} 
      competitors={competitors} 
    />
  )
}