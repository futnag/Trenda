'use client'

import { useState } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import { formatSubscriptionStatus, getUpgradeOptions, getDowngradeOptions } from '@/lib/subscription-utils'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import UsageTracker from './UsageTracker'

export default function SubscriptionManager() {
  const {
    subscription,
    tier,
    limits,
    loading,
    error,
    createSubscription,
    manageSubscription,
    refreshSubscription,
  } = useSubscription()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  const handleUpgrade = async (newTier: 'basic' | 'pro') => {
    setIsProcessing(true)
    setProcessingAction(`upgrade-${newTier}`)

    try {
      const checkoutUrl = await createSubscription(newTier)
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (error) {
      console.error('Failed to upgrade subscription:', error)
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  const handleManageSubscription = async () => {
    setIsProcessing(true)
    setProcessingAction('manage')

    try {
      const portalUrl = await manageSubscription()
      if (portalUrl) {
        window.location.href = portalUrl
      }
    } catch (error) {
      console.error('Failed to open customer portal:', error)
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800">サブスクリプション情報の取得に失敗しました</span>
        </div>
        <button
          onClick={refreshSubscription}
          className="mt-2 text-red-600 hover:text-red-800 font-medium underline"
        >
          再試行
        </button>
      </div>
    )
  }

  const upgradeOptions = getUpgradeOptions(tier)
  const downgradeOptions = getDowngradeOptions(tier)

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          現在のプラン
        </h3>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {tier === 'free' && '無料プラン'}
              {tier === 'basic' && 'ベーシックプラン'}
              {tier === 'pro' && 'プロプラン'}
            </div>
            {tier !== 'free' && (
              <div className="text-gray-600">
                月額 ¥{tier === 'basic' ? '980' : '2,980'}
              </div>
            )}
          </div>
          
          {subscription && (
            <div className="text-right">
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                subscription.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {formatSubscriptionStatus(subscription.status)}
              </div>
              {subscription.current_period_end && (
                <div className="text-sm text-gray-500 mt-1">
                  次回更新: {new Date(subscription.current_period_end).toLocaleDateString('ja-JP')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Plan Features */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">利用可能な機能:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-700">
                詳細分析: {limits.detailedAnalysisPerMonth === -1 ? '無制限' : `月${limits.detailedAnalysisPerMonth}回`}
              </span>
            </div>
            <div className="flex items-center">
              <svg className={`w-4 h-4 mr-2 ${limits.canSetCustomAlerts ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-700">
                カスタムアラート: {limits.canSetCustomAlerts ? '利用可能' : '利用不可'}
              </span>
            </div>
            <div className="flex items-center">
              <svg className={`w-4 h-4 mr-2 ${limits.canExportData ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-700">
                データエクスポート: {limits.canExportData ? '利用可能' : '利用不可'}
              </span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-700">
                API リクエスト: {limits.apiRequestsPerMonth === 0 ? '利用不可' : limits.apiRequestsPerMonth === -1 ? '無制限' : `月${limits.apiRequestsPerMonth.toLocaleString()}回`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {tier !== 'free' && (
            <button
              onClick={handleManageSubscription}
              disabled={isProcessing}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
            >
              {isProcessing && processingAction === 'manage' ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">処理中...</span>
                </div>
              ) : (
                'サブスクリプション管理'
              )}
            </button>
          )}
          
          {upgradeOptions.map((upgradeTier) => (
            <button
              key={upgradeTier}
              onClick={() => handleUpgrade(upgradeTier as 'basic' | 'pro')}
              disabled={isProcessing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {isProcessing && processingAction === `upgrade-${upgradeTier}` ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">処理中...</span>
                </div>
              ) : (
                `${upgradeTier === 'basic' ? 'ベーシック' : 'プロ'}プランにアップグレード`
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Usage Tracking */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          利用状況
        </h3>
        <UsageTracker
          features={['detailedAnalysisPerMonth', 'apiRequestsPerMonth']}
          showUpgradePrompt={true}
        />
      </div>

      {/* Billing History */}
      {subscription && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            請求履歴
          </h3>
          <p className="text-gray-600 mb-4">
            詳細な請求履歴は、サブスクリプション管理ページでご確認いただけます。
          </p>
          <button
            onClick={handleManageSubscription}
            disabled={isProcessing}
            className="text-blue-600 hover:text-blue-800 font-medium underline"
          >
            請求履歴を確認
          </button>
        </div>
      )}
    </div>
  )
}