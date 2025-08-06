'use client'

import type { Theme } from '@/types'
import Card from '@/components/common/Card'

interface TechnicalRequirementsSectionProps {
  theme: Theme
  className?: string
}

export function TechnicalRequirementsSection({ theme, className = '' }: TechnicalRequirementsSectionProps) {
  // Get technical difficulty details
  const getTechnicalDetails = (difficulty: string) => {
    const details: Record<string, {
      label: string
      color: string
      bgColor: string
      description: string
      skills: string[]
      timeEstimate: string
      complexity: string
      recommendedStack: string[]
      challenges: string[]
      resources: string[]
    }> = {
      beginner: {
        label: '初級',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: '基本的なWeb開発スキルで実装可能なプロジェクトです',
        skills: [
          'HTML/CSS',
          'JavaScript基礎',
          'React/Vue.js基礎',
          'REST API基礎',
          'データベース基礎'
        ],
        timeEstimate: '2-4週間',
        complexity: '低',
        recommendedStack: [
          'Next.js + TypeScript',
          'TailwindCSS',
          'Supabase',
          'Vercel'
        ],
        challenges: [
          'レスポンシブデザインの実装',
          '基本的なユーザー認証',
          'シンプルなデータ管理'
        ],
        resources: [
          'Next.js公式ドキュメント',
          'MDN Web Docs',
          'YouTube チュートリアル',
          'Udemy コース'
        ]
      },
      intermediate: {
        label: '中級',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        description: '中程度のWeb開発経験と複数技術の組み合わせが必要です',
        skills: [
          'React/Vue.js中級',
          'Node.js/Express',
          'データベース設計',
          'API設計',
          '状態管理',
          'テスト実装'
        ],
        timeEstimate: '4-8週間',
        complexity: '中',
        recommendedStack: [
          'Next.js + TypeScript',
          'Prisma + PostgreSQL',
          'tRPC/GraphQL',
          'Redis',
          'Docker'
        ],
        challenges: [
          '複雑な状態管理',
          'パフォーマンス最適化',
          'セキュリティ実装',
          'スケーラブルなアーキテクチャ'
        ],
        resources: [
          '技術書籍',
          'GitHub オープンソース',
          'Tech ブログ',
          'オンライン コミュニティ'
        ]
      },
      advanced: {
        label: '上級',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        description: '高度な技術スキルと豊富な開発経験が必要な複雑なプロジェクトです',
        skills: [
          'マイクロサービス設計',
          'DevOps/CI/CD',
          'クラウドアーキテクチャ',
          'パフォーマンス最適化',
          'セキュリティ専門知識',
          'スケーラビリティ設計'
        ],
        timeEstimate: '8-16週間',
        complexity: '高',
        recommendedStack: [
          'マイクロサービス',
          'Kubernetes',
          'AWS/GCP',
          'Elasticsearch',
          'Message Queue',
          'Monitoring Stack'
        ],
        challenges: [
          'システム設計',
          'スケーラビリティ',
          'セキュリティ',
          'パフォーマンス',
          '運用・監視'
        ],
        resources: [
          'システム設計書籍',
          'アーキテクチャ パターン',
          'クラウド認定資格',
          'エンジニア コミュニティ'
        ]
      }
    }
    
    return details[difficulty] || details.intermediate
  }

  // Get category-specific technical requirements
  const getCategoryRequirements = (category: string) => {
    const requirements: Record<string, {
      specificSkills: string[]
      integrations: string[]
      considerations: string[]
    }> = {
      productivity: {
        specificSkills: [
          'タスク管理システム',
          'カレンダー統合',
          'ファイル管理',
          'チーム協業機能'
        ],
        integrations: [
          'Google Workspace',
          'Microsoft 365',
          'Slack API',
          'Notion API'
        ],
        considerations: [
          'データ同期の信頼性',
          'オフライン対応',
          'マルチデバイス対応',
          'プライバシー保護'
        ]
      },
      entertainment: {
        specificSkills: [
          'メディア処理',
          'リアルタイム通信',
          'ゲーム開発',
          'コンテンツ配信'
        ],
        integrations: [
          'YouTube API',
          'Spotify API',
          'Twitch API',
          'Discord API'
        ],
        considerations: [
          'コンテンツ著作権',
          'ストリーミング最適化',
          'ユーザー生成コンテンツ',
          'コミュニティ管理'
        ]
      },
      education: {
        specificSkills: [
          'LMS開発',
          'ビデオ配信',
          '進捗管理',
          'アセスメント機能'
        ],
        integrations: [
          'Zoom API',
          'Canvas LTI',
          'Google Classroom',
          'Khan Academy API'
        ],
        considerations: [
          'アクセシビリティ',
          '学習分析',
          'プライバシー（COPPA）',
          'マルチ言語対応'
        ]
      },
      health: {
        specificSkills: [
          'データ可視化',
          'ウェアラブル連携',
          'プライバシー保護',
          'データ分析'
        ],
        integrations: [
          'Apple HealthKit',
          'Google Fit',
          'Fitbit API',
          'MyFitnessPal API'
        ],
        considerations: [
          'HIPAA準拠',
          'データセキュリティ',
          '医療規制',
          'プライバシー保護'
        ]
      },
      finance: {
        specificSkills: [
          '決済処理',
          'セキュリティ',
          'データ暗号化',
          '規制対応'
        ],
        integrations: [
          'Stripe API',
          'PayPal API',
          'Plaid API',
          '銀行API'
        ],
        considerations: [
          'PCI DSS準拠',
          'KYC/AML対応',
          '金融規制',
          'データ保護'
        ]
      },
      social: {
        specificSkills: [
          'リアルタイム通信',
          'コンテンツ管理',
          'モデレーション',
          'スケーラビリティ'
        ],
        integrations: [
          'Firebase',
          'Socket.io',
          'Pusher',
          'AWS SNS'
        ],
        considerations: [
          'コンテンツモデレーション',
          'スパム対策',
          'プライバシー設定',
          'コミュニティガイドライン'
        ]
      }
    }
    
    return requirements[category] || {
      specificSkills: [],
      integrations: [],
      considerations: []
    }
  }

  const technicalDetails = getTechnicalDetails(theme.technicalDifficulty)
  const categoryRequirements = getCategoryRequirements(theme.category)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Technical Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">技術要件概要</h3>
          <div className={`px-4 py-2 rounded-lg ${technicalDetails.bgColor}`}>
            <span className={`text-sm font-medium ${technicalDetails.color}`}>
              {technicalDetails.label}レベル
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="text-gray-600 mb-4">{technicalDetails.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">推定開発期間</div>
                <div className="text-lg font-bold text-blue-600">{technicalDetails.timeEstimate}</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">複雑度</div>
                <div className={`text-lg font-bold ${technicalDetails.color}`}>
                  {technicalDetails.complexity}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">必要スキル数</div>
                <div className="text-lg font-bold text-purple-600">
                  {technicalDetails.skills.length}個
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
            <h4 className="text-md font-semibold text-gray-900 mb-3">開発難易度指標</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">技術的複雑さ</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className={`h-2 rounded-full ${
                        theme.technicalDifficulty === 'beginner' ? 'bg-green-500' :
                        theme.technicalDifficulty === 'intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: theme.technicalDifficulty === 'beginner' ? '33%' :
                               theme.technicalDifficulty === 'intermediate' ? '66%' : '100%'
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {theme.technicalDifficulty === 'beginner' ? '33%' :
                     theme.technicalDifficulty === 'intermediate' ? '66%' : '100%'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">学習コスト</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ 
                        width: theme.technicalDifficulty === 'beginner' ? '25%' :
                               theme.technicalDifficulty === 'intermediate' ? '60%' : '90%'
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {theme.technicalDifficulty === 'beginner' ? '25%' :
                     theme.technicalDifficulty === 'intermediate' ? '60%' : '90%'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">開発時間</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ 
                        width: theme.technicalDifficulty === 'beginner' ? '30%' :
                               theme.technicalDifficulty === 'intermediate' ? '65%' : '95%'
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {theme.technicalDifficulty === 'beginner' ? '30%' :
                     theme.technicalDifficulty === 'intermediate' ? '65%' : '95%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Required Skills */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">必要スキル</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">基本スキル</h4>
            <div className="space-y-2">
              {technicalDetails.skills.map((skill, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  <span className="text-sm text-gray-700">{skill}</span>
                </div>
              ))}
            </div>
          </div>
          
          {categoryRequirements.specificSkills.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">
                {theme.category}分野特有スキル
              </h4>
              <div className="space-y-2">
                {categoryRequirements.specificSkills.map((skill, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                    <span className="text-sm text-gray-700">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Recommended Tech Stack */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">推奨技術スタック</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {technicalDetails.recommendedStack.map((tech, index) => (
            <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-900">{tech}</div>
            </div>
          ))}
        </div>
        
        {categoryRequirements.integrations.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">推奨API・統合</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categoryRequirements.integrations.map((integration, index) => (
                <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-900">{integration}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Technical Challenges */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">技術的課題と考慮事項</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">主な技術的課題</h4>
            <div className="space-y-3">
              {technicalDetails.challenges.map((challenge, index) => (
                <div key={index} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-start">
                    <div className="w-5 h-5 text-yellow-600 mr-2 mt-0.5">⚠️</div>
                    <span className="text-sm text-yellow-800">{challenge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {categoryRequirements.considerations.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">分野特有の考慮事項</h4>
              <div className="space-y-3">
                {categoryRequirements.considerations.map((consideration, index) => (
                  <div key={index} className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-start">
                      <div className="w-5 h-5 text-red-600 mr-2 mt-0.5">🔒</div>
                      <span className="text-sm text-red-800">{consideration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Learning Resources */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">学習リソース</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">推奨学習リソース</h4>
            <div className="space-y-2">
              {technicalDetails.resources.map((resource, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  <span className="text-sm text-gray-700">{resource}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">学習ロードマップ</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-blue-600">1</span>
                </div>
                <span className="text-sm text-gray-700">基礎技術の習得</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-green-600">2</span>
                </div>
                <span className="text-sm text-gray-700">プロトタイプ開発</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-yellow-600">3</span>
                </div>
                <span className="text-sm text-gray-700">機能拡張・最適化</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-purple-600">4</span>
                </div>
                <span className="text-sm text-gray-700">本番環境デプロイ</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}