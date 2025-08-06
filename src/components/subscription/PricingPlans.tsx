'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { SubscriptionTier } from '@/types'
import { SUBSCRIPTION_LIMITS } from '@/lib/subscription-utils'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface PricingPlan {
  tier: SubscriptionTier
  name: string
  price: number
  description: string
  features: string[]
  limitations: string[]
  popular?: boolean
  buttonText: string
  buttonVariant: 'primary' | 'secondary' | 'disabled'
}

const PRICING_PLANS: PricingPlan[] = [
  {
    tier: 'free',
    name: '無料プラン',
    price: 0,
    description: '個人開発者の方に最適なスタータープラン',
    features: [
      '基本的なトレンド表示',
      'カテゴリー別フィルタリング',
      'マネタイズスコア表示',
      '基本的な市場データ',
    ],
    limitations: [
      '月10回まで詳細分析',
      'APIアクセスなし',
      'データエクスポートなし',
      'カスタムアラートなし',
      '履歴データなし',
    ],
    buttonText: '現在のプラン',
    buttonVariant: 'disabled',
  },
  {
    tier: 'basic',
    name: 'ベーシックプラン',
    price: 980,
    description: '本格的な市場分析を始めたい方におすすめ',
    features: [
      '詳細分析無制限',
      '競合分析機能',
      '高度なフィルタリング',
      'メール通知',
      'カスタムアラート設定',
      '地域別分析',
      '人口統計学的分析',
    ],
    limitations: [
      'APIアクセスなし',
      'データエクスポートなし',
      '履歴データなし（過去30日のみ）',
    ],
    popular: true,
    buttonText: 'このプランを選択',
    buttonVariant: 'primary',
  },
  {
    tier: 'pro',
    name: 'プロプラン',
    price: 2980,
    description: 'プロフェッショナル向けの全機能プラン',
    features: [
      'ベーシックプランの全機能',
      'API アクセス（月間10,000リクエスト）',
      'データエクスポート（CSV/JSON）',
      '過去1年間の履歴データ',
      '優先サポート',
      '高度な収益予測',
      '詳細な競合分析レポート',
      'カスタムダッシュボード',
    ],
    limitations: [],
    buttonText: 'このプランを選択',
    buttonVariant: 'primary',
  },
]

export default function PricingPlans() {
  const { user } = useAuth()
  const { tier: currentTier, createSubscription, loading } = useSubscription()
  const [processingPlan, setProcessingPlan] = useState<SubscriptionTier | null>(null)

  const handlePlanSelection = async (planTier: SubscriptionTier) => {
    if (!user) {
      // Redirect to login
      window.location.href = '/auth/login?redirect=/pricing'
      return
    }

    if (planTier === 'free' || planTier === currentTier) {
      return
    }

    setProcessingPlan(planTier)

    try {
      const checkoutUrl = await createSubscription(planTier as 'basic' | 'pro')
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (error) {
      console.error('Failed to create subscription:', error)
    } finally {
      setProcessingPlan(null)
    }
  }

  const getPlanButtonProps = (plan: PricingPlan) => {
    if (!user) {
      return {
        text: 'ログインして開始',
        variant: 'primary' as const,
        disabled: false,
      }
    }

    if (plan.tier === currentTier) {
      return {
        text: '現在のプラン',
        variant: 'disabled' as const,
        disabled: true,
      }
    }

    if (plan.tier === 'free') {
      const tierOrder: SubscriptionTier[] = ['free', 'basic', 'pro']
      const currentIndex = tierOrder.indexOf(currentTier)
      const planIndex = tierOrder.indexOf(plan.tier)
      
      if (currentIndex > planIndex) {
        return {
          text: 'ダウングレード',
          variant: 'secondary' as const,
          disabled: false,
        }
      } else {
        return {
          text: '現在のプラン',
          variant: 'disabled' as const,
          disabled: true,
        }
      }
    }

    return {
      text: plan.buttonText,
      variant: plan.buttonVariant,
      disabled: false,
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          料金プラン
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          あなたのニーズに合ったプランをお選びください。すべてのプランで14日間の無料トライアルをご利用いただけます。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {PRICING_PLANS.map((plan) => {
          const buttonProps = getPlanButtonProps(plan)
          const isProcessing = processingPlan === plan.tier

          return (
            <div
              key={plan.tier}
              className={`relative bg-white rounded-lg shadow-lg p-8 ${
                plan.popular
                  ? 'border-2 border-blue-500 transform scale-105'
                  : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    おすすめ
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ¥{plan.price.toLocaleString()}
                  </span>
                  <span className="text-gray-600 ml-2">/ 月</span>
                </div>
                <p className="text-gray-600 text-sm">
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-4">含まれる機能:</h4>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">制限事項:</h4>
                    <ul className="space-y-3">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-gray-500">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={() => handlePlanSelection(plan.tier)}
                disabled={buttonProps.disabled || isProcessing}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  buttonProps.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                    : buttonProps.variant === 'secondary'
                    ? 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">処理中...</span>
                  </div>
                ) : (
                  buttonProps.text
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="text-center mt-12">
        <div className="bg-gray-50 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            よくある質問
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                プランの変更はいつでも可能ですか？
              </h4>
              <p className="text-sm text-gray-600">
                はい、いつでもプランの変更が可能です。アップグレードは即座に反映され、ダウングレードは次の請求サイクルから適用されます。
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                無料トライアルはありますか？
              </h4>
              <p className="text-sm text-gray-600">
                すべての有料プランで14日間の無料トライアルをご利用いただけます。トライアル期間中はいつでもキャンセル可能です。
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                支払い方法は何が利用できますか？
              </h4>
              <p className="text-sm text-gray-600">
                クレジットカード（Visa、MasterCard、American Express）とデビットカードがご利用いただけます。
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                データのエクスポートはどの形式に対応していますか？
              </h4>
              <p className="text-sm text-gray-600">
                プロプランでは、CSV、JSON、Excel形式でのデータエクスポートに対応しています。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}