'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'
import { SubscriptionTier } from '@/types'
import { SUBSCRIPTION_LIMITS } from '@/lib/subscription-utils'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface UpgradePromptProps {
  requiredTier: SubscriptionTier
  feature?: string
  variant?: 'card' | 'modal' | 'inline'
  onClose?: () => void
}

const TIER_NAMES: Record<SubscriptionTier, string> = {
  free: '無料プラン',
  basic: 'ベーシックプラン',
  pro: 'プロプラン',
}

const TIER_PRICES: Record<SubscriptionTier, number> = {
  free: 0,
  basic: 980,
  pro: 2980,
}

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  'detailed-analysis': '詳細分析機能',
  'competitor-analysis': '競合分析機能',
  'api-access': 'API アクセス',
  'data-export': 'データエクスポート',
  'custom-alerts': 'カスタムアラート',
  'historical-data': '履歴データアクセス',
  'priority-support': '優先サポート',
}

export default function UpgradePrompt({
  requiredTier,
  feature,
  variant = 'card',
  onClose,
}: UpgradePromptProps) {
  const router = useRouter()
  const { tier: currentTier, createSubscription } = useSubscription()
  const [isUpgrading, setIsUpgrading] = useState(false)

  const requiredLimits = SUBSCRIPTION_LIMITS[requiredTier]
  const featureName = feature ? FEATURE_DESCRIPTIONS[feature] || feature : '高度な機能'

  const handleUpgrade = async () => {
    if (requiredTier === 'free') {
      return
    }

    setIsUpgrading(true)

    try {
      const checkoutUrl = await createSubscription(requiredTier as 'basic' | 'pro')
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (error) {
      console.error('Failed to create subscription:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleViewPlans = () => {
    router.push('/pricing')
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              プランのアップグレードが必要です
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <UpgradeContent
            requiredTier={requiredTier}
            featureName={featureName}
            onUpgrade={handleUpgrade}
            onViewPlans={handleViewPlans}
            isUpgrading={isUpgrading}
          />
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <UpgradeContent
          requiredTier={requiredTier}
          featureName={featureName}
          onUpgrade={handleUpgrade}
          onViewPlans={handleViewPlans}
          isUpgrading={isUpgrading}
          compact
        />
      </div>
    )
  }

  // Default card variant
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <UpgradeContent
        requiredTier={requiredTier}
        featureName={featureName}
        onUpgrade={handleUpgrade}
        onViewPlans={handleViewPlans}
        isUpgrading={isUpgrading}
      />
    </div>
  )
}

interface UpgradeContentProps {
  requiredTier: SubscriptionTier
  featureName: string
  onUpgrade: () => void
  onViewPlans: () => void
  isUpgrading: boolean
  compact?: boolean
}

function UpgradeContent({
  requiredTier,
  featureName,
  onUpgrade,
  onViewPlans,
  isUpgrading,
  compact = false,
}: UpgradeContentProps) {
  const tierName = TIER_NAMES[requiredTier]
  const tierPrice = TIER_PRICES[requiredTier]

  return (
    <div className="text-center">
      <div className="mb-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        
        {!compact && (
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {featureName}をご利用いただくには
          </h3>
        )}
        
        <p className={`text-gray-600 ${compact ? 'text-sm' : ''}`}>
          この機能は{tierName}以上でご利用いただけます。
          {tierPrice > 0 && (
            <span className="block mt-1 font-medium text-gray-900">
              月額¥{tierPrice.toLocaleString()}から
            </span>
          )}
        </p>
      </div>

      {!compact && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">
            {tierName}で利用できる機能:
          </h4>
          <ul className="text-sm text-gray-600 space-y-2">
            {requiredTier === 'basic' && (
              <>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  詳細分析無制限
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  競合分析機能
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  カスタムアラート
                </li>
              </>
            )}
            {requiredTier === 'pro' && (
              <>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  API アクセス
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  データエクスポート
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  履歴データアクセス
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  優先サポート
                </li>
              </>
            )}
          </ul>
        </div>
      )}

      <div className={`space-y-3 ${compact ? 'space-y-2' : ''}`}>
        {requiredTier !== 'free' && (
          <button
            onClick={onUpgrade}
            disabled={isUpgrading}
            className={`w-full bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors ${
              compact ? 'py-2 px-4 text-sm' : 'py-3 px-4'
            }`}
          >
            {isUpgrading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">処理中...</span>
              </div>
            ) : (
              `${tierName}にアップグレード`
            )}
          </button>
        )}
        
        <button
          onClick={onViewPlans}
          className={`w-full border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors ${
            compact ? 'py-2 px-4 text-sm' : 'py-3 px-4'
          }`}
        >
          すべてのプランを見る
        </button>
      </div>
    </div>
  )
}