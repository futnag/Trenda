'use client'

import type { Theme } from '@/types'
import Card from '@/components/common/Card'

interface DevelopmentTimelineSectionProps {
  theme: Theme
  className?: string
}

interface TimelinePhase {
  id: string
  title: string
  description: string
  duration: string
  tasks: string[]
  deliverables: string[]
  risks: string[]
  dependencies: string[]
}

export function DevelopmentTimelineSection({ theme, className = '' }: DevelopmentTimelineSectionProps) {
  // Generate development timeline based on theme characteristics
  const generateTimeline = (): TimelinePhase[] => {
    const baseTimeline: TimelinePhase[] = [
      {
        id: 'planning',
        title: '企画・設計フェーズ',
        description: '要件定義、技術選定、アーキテクチャ設計を行います',
        duration: theme.technicalDifficulty === 'beginner' ? '3-5日' : 
                 theme.technicalDifficulty === 'intermediate' ? '1-2週間' : '2-3週間',
        tasks: [
          '要件定義書作成',
          '技術スタック選定',
          'データベース設計',
          'API設計',
          'UI/UXワイヤーフレーム作成'
        ],
        deliverables: [
          '要件定義書',
          '技術仕様書',
          'データベーススキーマ',
          'API仕様書',
          'デザインモックアップ'
        ],
        risks: [
          '要件の曖昧さ',
          '技術選定ミス',
          'スコープクリープ'
        ],
        dependencies: []
      },
      {
        id: 'setup',
        title: '環境構築フェーズ',
        description: '開発環境、CI/CD、インフラの初期セットアップを行います',
        duration: theme.technicalDifficulty === 'beginner' ? '2-3日' : 
                 theme.technicalDifficulty === 'intermediate' ? '3-5日' : '1-2週間',
        tasks: [
          'プロジェクト初期化',
          '開発環境構築',
          'データベースセットアップ',
          'CI/CDパイプライン構築',
          'デプロイ環境準備'
        ],
        deliverables: [
          '開発環境',
          'データベース',
          'CI/CDパイプライン',
          'ステージング環境'
        ],
        risks: [
          '環境構築の複雑さ',
          'インフラコスト',
          '設定ミス'
        ],
        dependencies: ['planning']
      },
      {
        id: 'mvp',
        title: 'MVP開発フェーズ',
        description: '最小限の機能を持つプロダクトを開発します',
        duration: theme.technicalDifficulty === 'beginner' ? '1-2週間' : 
                 theme.technicalDifficulty === 'intermediate' ? '2-4週間' : '4-6週間',
        tasks: [
          'コア機能実装',
          '基本UI実装',
          'データベース連携',
          'ユーザー認証実装',
          '基本テスト実装'
        ],
        deliverables: [
          'MVP版アプリケーション',
          '基本機能',
          'ユーザー認証',
          'データ管理機能'
        ],
        risks: [
          '機能の複雑化',
          'パフォーマンス問題',
          'セキュリティ脆弱性'
        ],
        dependencies: ['setup']
      },
      {
        id: 'testing',
        title: 'テスト・改善フェーズ',
        description: 'テスト実装、バグ修正、パフォーマンス最適化を行います',
        duration: theme.technicalDifficulty === 'beginner' ? '3-5日' : 
                 theme.technicalDifficulty === 'intermediate' ? '1-2週間' : '2-3週間',
        tasks: [
          'ユニットテスト実装',
          '統合テスト実装',
          'E2Eテスト実装',
          'バグ修正',
          'パフォーマンス最適化'
        ],
        deliverables: [
          'テストスイート',
          'バグ修正版',
          'パフォーマンス最適化版',
          'テストレポート'
        ],
        risks: [
          'テストカバレッジ不足',
          '重大なバグ発見',
          'パフォーマンス問題'
        ],
        dependencies: ['mvp']
      },
      {
        id: 'launch',
        title: 'ローンチフェーズ',
        description: '本番環境へのデプロイとローンチ準備を行います',
        duration: theme.technicalDifficulty === 'beginner' ? '2-3日' : 
                 theme.technicalDifficulty === 'intermediate' ? '3-5日' : '1週間',
        tasks: [
          '本番環境デプロイ',
          'ドメイン設定',
          'SSL証明書設定',
          'モニタリング設定',
          'ローンチ準備'
        ],
        deliverables: [
          '本番環境',
          'ローンチ版アプリケーション',
          'モニタリングダッシュボード',
          '運用ドキュメント'
        ],
        risks: [
          'デプロイ失敗',
          'DNS設定ミス',
          'セキュリティ設定ミス'
        ],
        dependencies: ['testing']
      }
    ]

    // Add category-specific phases
    if (theme.category === 'finance') {
      baseTimeline.splice(3, 0, {
        id: 'compliance',
        title: 'コンプライアンス対応フェーズ',
        description: '金融規制への対応とセキュリティ強化を行います',
        duration: '2-4週間',
        tasks: [
          'PCI DSS対応',
          'KYC/AML実装',
          'セキュリティ監査',
          '規制対応ドキュメント作成'
        ],
        deliverables: [
          'コンプライアンス対応版',
          'セキュリティ監査レポート',
          '規制対応ドキュメント'
        ],
        risks: [
          '規制要件の変更',
          'セキュリティ脆弱性',
          '監査不合格'
        ],
        dependencies: ['mvp']
      })
    }

    if (theme.category === 'health') {
      baseTimeline.splice(3, 0, {
        id: 'medical_compliance',
        title: '医療規制対応フェーズ',
        description: 'HIPAA等の医療規制への対応を行います',
        duration: '1-3週間',
        tasks: [
          'HIPAA対応',
          'データ暗号化強化',
          'プライバシー設定',
          '医療機器連携テスト'
        ],
        deliverables: [
          'HIPAA対応版',
          'プライバシー保護機能',
          '医療機器連携機能'
        ],
        risks: [
          '規制要件の複雑さ',
          'データ漏洩リスク',
          '医療機器互換性'
        ],
        dependencies: ['mvp']
      })
    }

    return baseTimeline
  }

  const timeline = generateTimeline()

  // Calculate total duration
  const calculateTotalDuration = () => {
    const difficultyMultiplier = {
      beginner: 1,
      intermediate: 1.5,
      advanced: 2.5
    }
    
    const baseDuration = theme.technicalDifficulty === 'beginner' ? 4 : 
                        theme.technicalDifficulty === 'intermediate' ? 8 : 16
    
    const categoryMultiplier = ['finance', 'health'].includes(theme.category) ? 1.3 : 1
    
    const totalWeeks = Math.ceil(baseDuration * difficultyMultiplier[theme.technicalDifficulty] * categoryMultiplier)
    
    return {
      weeks: totalWeeks,
      months: Math.ceil(totalWeeks / 4),
      description: totalWeeks <= 4 ? '短期プロジェクト' :
                   totalWeeks <= 12 ? '中期プロジェクト' : '長期プロジェクト'
    }
  }

  const totalDuration = calculateTotalDuration()

  // Get milestone recommendations
  const getMilestones = () => {
    return [
      {
        week: Math.ceil(totalDuration.weeks * 0.2),
        title: '設計完了',
        description: '技術仕様とデザインが確定'
      },
      {
        week: Math.ceil(totalDuration.weeks * 0.4),
        title: 'MVP完成',
        description: '基本機能が動作する状態'
      },
      {
        week: Math.ceil(totalDuration.weeks * 0.7),
        title: 'テスト完了',
        description: '品質保証が完了した状態'
      },
      {
        week: totalDuration.weeks,
        title: 'ローンチ',
        description: '本番環境でサービス開始'
      }
    ]
  }

  const milestones = getMilestones()

  // Get risk assessment
  const getRiskAssessment = () => {
    const riskLevel = theme.technicalDifficulty === 'beginner' ? 'low' :
                     theme.technicalDifficulty === 'intermediate' ? 'medium' : 'high'
    
    const riskInfo = {
      low: {
        label: '低リスク',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: '技術的リスクは低く、予定通りの完了が期待できます'
      },
      medium: {
        label: '中リスク',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        description: '一部技術的課題があり、スケジュール調整が必要な可能性があります'
      },
      high: {
        label: '高リスク',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        description: '複雑な技術的課題があり、十分な準備と余裕のあるスケジュールが必要です'
      }
    }
    
    return riskInfo[riskLevel]
  }

  const riskAssessment = getRiskAssessment()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Timeline Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">開発期間概要</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">総開発期間</span>
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {totalDuration.weeks}週間
            </div>
            <div className="text-sm text-blue-700">
              約{totalDuration.months}ヶ月
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">プロジェクト規模</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {totalDuration.description}
            </div>
            <div className="text-sm text-green-700">
              {timeline.length}フェーズ
            </div>
          </div>

          <div className={`p-4 rounded-lg ${riskAssessment.bgColor}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">リスクレベル</span>
              <span className="text-2xl">⚠️</span>
            </div>
            <div className={`text-lg font-bold ${riskAssessment.color}`}>
              {riskAssessment.label}
            </div>
            <div className={`text-sm ${riskAssessment.color}`}>
              技術的複雑度
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">マイルストーン</span>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {milestones.length}個
            </div>
            <div className="text-sm text-purple-700">
              主要チェックポイント
            </div>
          </div>
        </div>

        <div className={`mt-6 p-4 rounded-lg ${riskAssessment.bgColor}`}>
          <p className={`text-sm ${riskAssessment.color}`}>
            {riskAssessment.description}
          </p>
        </div>
      </Card>

      {/* Development Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">開発タイムライン</h3>
        
        <div className="space-y-6">
          {timeline.map((phase, index) => (
            <div key={phase.id} className="relative">
              {/* Timeline connector */}
              {index < timeline.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-300" />
              )}
              
              <div className="flex items-start">
                {/* Phase number */}
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                </div>
                
                {/* Phase content */}
                <div className="flex-1 bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">{phase.title}</h4>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      {phase.duration}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{phase.description}</p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tasks */}
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">主要タスク</h5>
                      <ul className="space-y-1">
                        {phase.tasks.map((task, taskIndex) => (
                          <li key={taskIndex} className="flex items-center text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Deliverables */}
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">成果物</h5>
                      <ul className="space-y-1">
                        {phase.deliverables.map((deliverable, delIndex) => (
                          <li key={delIndex} className="flex items-center text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Risks */}
                  {phase.risks.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">リスク要因</h5>
                      <div className="flex flex-wrap gap-2">
                        {phase.risks.map((risk, riskIndex) => (
                          <span key={riskIndex} className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                            {risk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Dependencies */}
                  {phase.dependencies.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">依存関係</h5>
                      <div className="flex flex-wrap gap-2">
                        {phase.dependencies.map((dep, depIndex) => (
                          <span key={depIndex} className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                            {timeline.find(p => p.id === dep)?.title || dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Milestones */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">主要マイルストーン</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {milestones.map((milestone, index) => (
            <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">{milestone.title}</span>
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                  {milestone.week}週目
                </span>
              </div>
              <p className="text-sm text-blue-700">{milestone.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Resource Planning */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">リソース計画</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">推奨チーム構成</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-700">フルスタック開発者</span>
                <span className="text-sm font-medium text-gray-900">
                  {theme.technicalDifficulty === 'beginner' ? '1名' : 
                   theme.technicalDifficulty === 'intermediate' ? '1-2名' : '2-3名'}
                </span>
              </div>
              
              {theme.technicalDifficulty !== 'beginner' && (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-700">UI/UXデザイナー</span>
                  <span className="text-sm font-medium text-gray-900">0.5-1名</span>
                </div>
              )}
              
              {theme.technicalDifficulty === 'advanced' && (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-700">DevOpsエンジニア</span>
                  <span className="text-sm font-medium text-gray-900">0.5名</span>
                </div>
              )}
              
              {['finance', 'health'].includes(theme.category) && (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-700">コンプライアンス専門家</span>
                  <span className="text-sm font-medium text-gray-900">0.3名</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">予算見積もり</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-700">開発コスト</span>
                <span className="text-sm font-medium text-gray-900">
                  {theme.technicalDifficulty === 'beginner' ? '50-100万円' : 
                   theme.technicalDifficulty === 'intermediate' ? '100-300万円' : '300-800万円'}
                </span>
              </div>
              
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-700">インフラコスト（月額）</span>
                <span className="text-sm font-medium text-gray-900">
                  {theme.technicalDifficulty === 'beginner' ? '1-3万円' : 
                   theme.technicalDifficulty === 'intermediate' ? '3-10万円' : '10-30万円'}
                </span>
              </div>
              
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm text-gray-700">運用・保守（月額）</span>
                <span className="text-sm font-medium text-gray-900">
                  {theme.technicalDifficulty === 'beginner' ? '5-15万円' : 
                   theme.technicalDifficulty === 'intermediate' ? '15-40万円' : '40-100万円'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}