import type { Theme, TrendData } from '@/types'

// Mock themes data for testing the dashboard
export const mockThemes: Theme[] = [
  {
    id: '1',
    title: 'AI駆動のタスク管理アプリ',
    description: '機械学習を活用してユーザーの作業パターンを学習し、最適なタスクスケジューリングを提案するアプリケーション',
    category: 'productivity',
    monetizationScore: 85,
    marketSize: 2500000,
    competitionLevel: 'medium',
    technicalDifficulty: 'advanced',
    estimatedRevenue: {
      min: 50000,
      max: 200000,
    },
    dataSources: [
      {
        source: 'google_trends',
        searchVolume: 15000,
        growthRate: 12.5,
        timestamp: new Date().toISOString(),
      },
      {
        source: 'reddit',
        searchVolume: 8500,
        growthRate: 8.2,
        timestamp: new Date().toISOString(),
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'バーチャル英会話練習プラットフォーム',
    description: 'AI講師との1対1英会話練習ができるWebアプリケーション。発音矯正とリアルタイムフィードバック機能付き',
    category: 'education',
    monetizationScore: 78,
    marketSize: 1800000,
    competitionLevel: 'high',
    technicalDifficulty: 'advanced',
    estimatedRevenue: {
      min: 30000,
      max: 150000,
    },
    dataSources: [
      {
        source: 'google_trends',
        searchVolume: 22000,
        growthRate: 15.3,
        timestamp: new Date().toISOString(),
      },
      {
        source: 'product_hunt',
        searchVolume: 3200,
        growthRate: 5.7,
        timestamp: new Date().toISOString(),
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'ローカル食材マッチングサービス',
    description: '地域の農家と消費者を直接つなぐプラットフォーム。新鮮な食材の直販とレシピ提案機能',
    category: 'social',
    monetizationScore: 72,
    marketSize: 950000,
    competitionLevel: 'low',
    technicalDifficulty: 'intermediate',
    estimatedRevenue: {
      min: 25000,
      max: 80000,
    },
    dataSources: [
      {
        source: 'google_trends',
        searchVolume: 8900,
        growthRate: 18.7,
        timestamp: new Date().toISOString(),
      },
      {
        source: 'twitter',
        searchVolume: 5400,
        growthRate: 22.1,
        timestamp: new Date().toISOString(),
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'パーソナル投資アドバイザーアプリ',
    description: 'ユーザーのリスク許容度と目標に基づいて、最適な投資ポートフォリオを提案するアプリ',
    category: 'finance',
    monetizationScore: 88,
    marketSize: 3200000,
    competitionLevel: 'high',
    technicalDifficulty: 'advanced',
    estimatedRevenue: {
      min: 80000,
      max: 300000,
    },
    dataSources: [
      {
        source: 'google_trends',
        searchVolume: 35000,
        growthRate: 9.8,
        timestamp: new Date().toISOString(),
      },
      {
        source: 'reddit',
        searchVolume: 12000,
        growthRate: 14.2,
        timestamp: new Date().toISOString(),
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'メンタルヘルス日記アプリ',
    description: '感情の記録と分析を通じて、メンタルヘルスの改善をサポートするアプリケーション',
    category: 'health',
    monetizationScore: 75,
    marketSize: 1400000,
    competitionLevel: 'medium',
    technicalDifficulty: 'intermediate',
    estimatedRevenue: {
      min: 20000,
      max: 100000,
    },
    dataSources: [
      {
        source: 'google_trends',
        searchVolume: 18500,
        growthRate: 25.4,
        timestamp: new Date().toISOString(),
      },
      {
        source: 'product_hunt',
        searchVolume: 2800,
        growthRate: 12.9,
        timestamp: new Date().toISOString(),
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'インタラクティブ音楽学習ゲーム',
    description: 'ゲーミフィケーションを活用した楽器学習アプリ。リアルタイム演奏評価とプログレッション機能',
    category: 'entertainment',
    monetizationScore: 68,
    marketSize: 1100000,
    competitionLevel: 'medium',
    technicalDifficulty: 'advanced',
    estimatedRevenue: {
      min: 15000,
      max: 75000,
    },
    dataSources: [
      {
        source: 'google_trends',
        searchVolume: 12000,
        growthRate: 7.3,
        timestamp: new Date().toISOString(),
      },
      {
        source: 'github',
        searchVolume: 1500,
        growthRate: 4.8,
        timestamp: new Date().toISOString(),
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    title: 'スマート家計簿アプリ',
    description: 'レシート撮影による自動入力と支出分析、節約提案機能を備えた家計管理アプリ',
    category: 'finance',
    monetizationScore: 82,
    marketSize: 2100000,
    competitionLevel: 'high',
    technicalDifficulty: 'intermediate',
    estimatedRevenue: {
      min: 40000,
      max: 180000,
    },
    dataSources: [
      {
        source: 'google_trends',
        searchVolume: 28000,
        growthRate: 11.6,
        timestamp: new Date().toISOString(),
      },
      {
        source: 'reddit',
        searchVolume: 9200,
        growthRate: 16.3,
        timestamp: new Date().toISOString(),
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8',
    title: 'リモートワーク効率化ツール',
    description: 'チーム協業とタスク管理を統合したリモートワーク専用プラットフォーム',
    category: 'productivity',
    monetizationScore: 79,
    marketSize: 1900000,
    competitionLevel: 'high',
    technicalDifficulty: 'intermediate',
    estimatedRevenue: {
      min: 35000,
      max: 160000,
    },
    dataSources: [
      {
        source: 'google_trends',
        searchVolume: 24000,
        growthRate: 19.2,
        timestamp: new Date().toISOString(),
      },
      {
        source: 'product_hunt',
        searchVolume: 4100,
        growthRate: 8.7,
        timestamp: new Date().toISOString(),
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '9',
    title: 'フィットネス動画プラットフォーム',
    description: 'パーソナライズされたワークアウト動画とプログレス追跡機能を提供するフィットネスアプリ',
    category: 'health',
    monetizationScore: 71,
    marketSize: 1600000,
    competitionLevel: 'high',
    technicalDifficulty: 'intermediate',
    estimatedRevenue: {
      min: 25000,
      max: 120000,
    },
    dataSources: [
      {
        source: 'google_trends',
        searchVolume: 31000,
        growthRate: 13.8,
        timestamp: new Date().toISOString(),
      },
      {
        source: 'twitter',
        searchVolume: 8700,
        growthRate: 21.5,
        timestamp: new Date().toISOString(),
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10',
    title: 'プログラミング学習コミュニティ',
    description: 'コード共有とピアレビューを中心とした初心者向けプログラミング学習プラットフォーム',
    category: 'education',
    monetizationScore: 76,
    marketSize: 1300000,
    competitionLevel: 'medium',
    technicalDifficulty: 'intermediate',
    estimatedRevenue: {
      min: 20000,
      max: 90000,
    },
    dataSources: [
      {
        source: 'github',
        searchVolume: 15000,
        growthRate: 17.4,
        timestamp: new Date().toISOString(),
      },
      {
        source: 'reddit',
        searchVolume: 11000,
        growthRate: 12.1,
        timestamp: new Date().toISOString(),
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Mock function to simulate API calls with filtering
export function getMockThemes(filters?: {
  category?: string
  competition_level?: string
  technical_difficulty?: string
  min_monetization_score?: number
  max_monetization_score?: number
  min_market_size?: number
  max_market_size?: number
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}): Promise<{
  data: Theme[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error: null
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredThemes = [...mockThemes]

      // Apply filters
      if (filters?.category) {
        filteredThemes = filteredThemes.filter(theme => theme.category === filters.category)
      }
      if (filters?.competition_level) {
        filteredThemes = filteredThemes.filter(theme => theme.competitionLevel === filters.competition_level)
      }
      if (filters?.technical_difficulty) {
        filteredThemes = filteredThemes.filter(theme => theme.technicalDifficulty === filters.technical_difficulty)
      }
      if (filters?.min_monetization_score !== undefined) {
        filteredThemes = filteredThemes.filter(theme => theme.monetizationScore >= filters.min_monetization_score!)
      }
      if (filters?.max_monetization_score !== undefined) {
        filteredThemes = filteredThemes.filter(theme => theme.monetizationScore <= filters.max_monetization_score!)
      }
      if (filters?.min_market_size !== undefined) {
        filteredThemes = filteredThemes.filter(theme => theme.marketSize >= filters.min_market_size!)
      }
      if (filters?.max_market_size !== undefined) {
        filteredThemes = filteredThemes.filter(theme => theme.marketSize <= filters.max_market_size!)
      }

      // Apply sorting
      const sortBy = filters?.sort_by || 'monetizationScore'
      const sortOrder = filters?.sort_order || 'desc'
      
      filteredThemes.sort((a, b) => {
        let aValue: any, bValue: any
        
        switch (sortBy) {
          case 'monetizationScore':
            aValue = a.monetizationScore
            bValue = b.monetizationScore
            break
          case 'marketSize':
            aValue = a.marketSize
            bValue = b.marketSize
            break
          case 'title':
            aValue = a.title
            bValue = b.title
            break
          case 'createdAt':
          case 'updatedAt':
            aValue = new Date(a[sortBy])
            bValue = new Date(b[sortBy])
            break
          default:
            aValue = a.monetizationScore
            bValue = b.monetizationScore
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })

      // Apply pagination
      const page = filters?.page || 1
      const limit = filters?.limit || 20
      const offset = (page - 1) * limit
      const paginatedThemes = filteredThemes.slice(offset, offset + limit)
      const totalPages = Math.ceil(filteredThemes.length / limit)

      resolve({
        data: paginatedThemes,
        pagination: {
          page,
          limit,
          total: filteredThemes.length,
          totalPages,
        },
        error: null,
      })
    }, 500) // Simulate network delay
  })
}