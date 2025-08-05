const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sampleThemes = [
  {
    title: 'AI駆動のタスク管理アプリ',
    description: '機械学習を活用してユーザーの作業パターンを学習し、最適なタスクスケジューリングを提案するアプリケーション',
    category: 'productivity',
    monetization_score: 85,
    market_size: 2500000,
    competition_level: 'medium',
    technical_difficulty: 'advanced',
    estimated_revenue_min: 50000,
    estimated_revenue_max: 200000,
    data_sources: [
      { source: 'google_trends', searchVolume: 15000, growthRate: 12.5, timestamp: new Date().toISOString() },
      { source: 'reddit', searchVolume: 8500, growthRate: 8.2, timestamp: new Date().toISOString() }
    ]
  },
  {
    title: 'バーチャル英会話練習プラットフォーム',
    description: 'AI講師との1対1英会話練習ができるWebアプリケーション。発音矯正とリアルタイムフィードバック機能付き',
    category: 'education',
    monetization_score: 78,
    market_size: 1800000,
    competition_level: 'high',
    technical_difficulty: 'advanced',
    estimated_revenue_min: 30000,
    estimated_revenue_max: 150000,
    data_sources: [
      { source: 'google_trends', searchVolume: 22000, growthRate: 15.3, timestamp: new Date().toISOString() },
      { source: 'product_hunt', searchVolume: 3200, growthRate: 5.7, timestamp: new Date().toISOString() }
    ]
  },
  {
    title: 'ローカル食材マッチングサービス',
    description: '地域の農家と消費者を直接つなぐプラットフォーム。新鮮な食材の直販とレシピ提案機能',
    category: 'social',
    monetization_score: 72,
    market_size: 950000,
    competition_level: 'low',
    technical_difficulty: 'intermediate',
    estimated_revenue_min: 25000,
    estimated_revenue_max: 80000,
    data_sources: [
      { source: 'google_trends', searchVolume: 8900, growthRate: 18.7, timestamp: new Date().toISOString() },
      { source: 'twitter', searchVolume: 5400, growthRate: 22.1, timestamp: new Date().toISOString() }
    ]
  },
  {
    title: 'パーソナル投資アドバイザーアプリ',
    description: 'ユーザーのリスク許容度と目標に基づいて、最適な投資ポートフォリオを提案するアプリ',
    category: 'finance',
    monetization_score: 88,
    market_size: 3200000,
    competition_level: 'high',
    technical_difficulty: 'advanced',
    estimated_revenue_min: 80000,
    estimated_revenue_max: 300000,
    data_sources: [
      { source: 'google_trends', searchVolume: 35000, growthRate: 9.8, timestamp: new Date().toISOString() },
      { source: 'reddit', searchVolume: 12000, growthRate: 14.2, timestamp: new Date().toISOString() }
    ]
  },
  {
    title: 'メンタルヘルス日記アプリ',
    description: '感情の記録と分析を通じて、メンタルヘルスの改善をサポートするアプリケーション',
    category: 'health',
    monetization_score: 75,
    market_size: 1400000,
    competition_level: 'medium',
    technical_difficulty: 'intermediate',
    estimated_revenue_min: 20000,
    estimated_revenue_max: 100000,
    data_sources: [
      { source: 'google_trends', searchVolume: 18500, growthRate: 25.4, timestamp: new Date().toISOString() },
      { source: 'product_hunt', searchVolume: 2800, growthRate: 12.9, timestamp: new Date().toISOString() }
    ]
  },
  {
    title: 'インタラクティブ音楽学習ゲーム',
    description: 'ゲーミフィケーションを活用した楽器学習アプリ。リアルタイム演奏評価とプログレッション機能',
    category: 'entertainment',
    monetization_score: 68,
    market_size: 1100000,
    competition_level: 'medium',
    technical_difficulty: 'advanced',
    estimated_revenue_min: 15000,
    estimated_revenue_max: 75000,
    data_sources: [
      { source: 'google_trends', searchVolume: 12000, growthRate: 7.3, timestamp: new Date().toISOString() },
      { source: 'github', searchVolume: 1500, growthRate: 4.8, timestamp: new Date().toISOString() }
    ]
  },
  {
    title: 'スマート家計簿アプリ',
    description: 'レシート撮影による自動入力と支出分析、節約提案機能を備えた家計管理アプリ',
    category: 'finance',
    monetization_score: 82,
    market_size: 2100000,
    competition_level: 'high',
    technical_difficulty: 'intermediate',
    estimated_revenue_min: 40000,
    estimated_revenue_max: 180000,
    data_sources: [
      { source: 'google_trends', searchVolume: 28000, growthRate: 11.6, timestamp: new Date().toISOString() },
      { source: 'reddit', searchVolume: 9200, growthRate: 16.3, timestamp: new Date().toISOString() }
    ]
  },
  {
    title: 'リモートワーク効率化ツール',
    description: 'チーム協業とタスク管理を統合したリモートワーク専用プラットフォーム',
    category: 'productivity',
    monetization_score: 79,
    market_size: 1900000,
    competition_level: 'high',
    technical_difficulty: 'intermediate',
    estimated_revenue_min: 35000,
    estimated_revenue_max: 160000,
    data_sources: [
      { source: 'google_trends', searchVolume: 24000, growthRate: 19.2, timestamp: new Date().toISOString() },
      { source: 'product_hunt', searchVolume: 4100, growthRate: 8.7, timestamp: new Date().toISOString() }
    ]
  },
  {
    title: 'フィットネス動画プラットフォーム',
    description: 'パーソナライズされたワークアウト動画とプログレス追跡機能を提供するフィットネスアプリ',
    category: 'health',
    monetization_score: 71,
    market_size: 1600000,
    competition_level: 'high',
    technical_difficulty: 'intermediate',
    estimated_revenue_min: 25000,
    estimated_revenue_max: 120000,
    data_sources: [
      { source: 'google_trends', searchVolume: 31000, growthRate: 13.8, timestamp: new Date().toISOString() },
      { source: 'twitter', searchVolume: 8700, growthRate: 21.5, timestamp: new Date().toISOString() }
    ]
  },
  {
    title: 'プログラミング学習コミュニティ',
    description: 'コード共有とピアレビューを中心とした初心者向けプログラミング学習プラットフォーム',
    category: 'education',
    monetization_score: 76,
    market_size: 1300000,
    competition_level: 'medium',
    technical_difficulty: 'intermediate',
    estimated_revenue_min: 20000,
    estimated_revenue_max: 90000,
    data_sources: [
      { source: 'github', searchVolume: 15000, growthRate: 17.4, timestamp: new Date().toISOString() },
      { source: 'reddit', searchVolume: 11000, growthRate: 12.1, timestamp: new Date().toISOString() }
    ]
  }
]

async function seedThemes() {
  try {
    console.log('Seeding sample themes...')
    
    // Insert themes
    const { data: themes, error: themesError } = await supabase
      .from('themes')
      .insert(sampleThemes.map(theme => ({
        ...theme,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })))
      .select()

    if (themesError) {
      console.error('Error inserting themes:', JSON.stringify(themesError, null, 2))
      return
    }

    console.log(`Successfully inserted ${themes.length} themes`)

    // Insert trend data for each theme
    const trendDataInserts = []
    
    themes.forEach(theme => {
      const originalTheme = sampleThemes.find(st => st.title === theme.title)
      if (originalTheme && originalTheme.data_sources) {
        originalTheme.data_sources.forEach(source => {
          trendDataInserts.push({
            theme_id: theme.id,
            source: source.source,
            search_volume: source.searchVolume,
            growth_rate: source.growthRate,
            timestamp: source.timestamp,
            geographic_data: { JP: 0.6, US: 0.3, GB: 0.1 },
            demographic_data: {
              country: 'JP',
              ageGroup: '25-34',
              gender: 'other',
              incomeLevel: 'middle'
            }
          })
        })
      }
    })

    if (trendDataInserts.length > 0) {
      const { data: trendData, error: trendError } = await supabase
        .from('trend_data')
        .insert(trendDataInserts)

      if (trendError) {
        console.error('Error inserting trend data:', trendError)
      } else {
        console.log(`Successfully inserted ${trendDataInserts.length} trend data records`)
      }
    }

    console.log('Sample data seeding completed successfully!')
    
  } catch (error) {
    console.error('Error seeding data:', error)
  }
}

// Run the seeding function
seedThemes().then(() => {
  process.exit(0)
}).catch(error => {
  console.error('Seeding failed:', error)
  process.exit(1)
})