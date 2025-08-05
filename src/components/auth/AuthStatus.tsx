'use client'

import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface AuthStatusProps {
  showDetails?: boolean
  className?: string
}

export function AuthStatus({ showDetails = false, className = '' }: AuthStatusProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <div className="h-4 w-20 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
        <span className="text-sm text-gray-600">未ログイン</span>
        {showDetails && (
          <Link
            href="/auth/login"
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            ログイン
          </Link>
        )}
      </div>
    )
  }

  const subscriptionTier = user.user_metadata?.subscription_tier || 'free'
  const tierColors = {
    free: 'bg-gray-400',
    basic: 'bg-blue-400',
    pro: 'bg-purple-400'
  }

  const tierLabels = {
    free: '無料',
    basic: 'ベーシック',
    pro: 'プロ'
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-3 h-3 rounded-full ${tierColors[subscriptionTier as keyof typeof tierColors]}`}></div>
      <span className="text-sm text-gray-600">
        {tierLabels[subscriptionTier as keyof typeof tierLabels]}プラン
      </span>
      {showDetails && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-500 truncate max-w-32">
            {user.email}
          </span>
          <Link
            href="/profile"
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            設定
          </Link>
        </div>
      )}
    </div>
  )
}

// Component for displaying subscription-based feature availability
interface FeatureGateProps {
  requiredTier: 'basic' | 'pro'
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgrade?: boolean
}

export function FeatureGate({ 
  requiredTier, 
  children, 
  fallback, 
  showUpgrade = true 
}: FeatureGateProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">この機能を利用するにはログインが必要です</p>
        <Link
          href="/auth/login"
          className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          ログイン
        </Link>
      </div>
    )
  }

  const userTier = user.user_metadata?.subscription_tier || 'free'
  const tierLevels = { free: 0, basic: 1, pro: 2 }
  const requiredLevel = tierLevels[requiredTier]
  const userLevel = tierLevels[userTier as keyof typeof tierLevels] || 0

  if (userLevel >= requiredLevel) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-8V7m0 0V5m0 2h2m-2 0H10" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {requiredTier === 'basic' ? 'ベーシック' : 'プロ'}プラン限定機能
      </h3>
      <p className="text-gray-600 mb-4">
        この機能を利用するには{requiredTier === 'basic' ? 'ベーシック' : 'プロ'}プラン以上が必要です
      </p>
      {showUpgrade && (
        <Link
          href="/pricing"
          className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          プランをアップグレード
        </Link>
      )}
    </div>
  )
}