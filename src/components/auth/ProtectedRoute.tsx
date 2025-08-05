'use client'

import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { LoginForm } from './LoginForm'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
}

export function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {fallback || (
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                ログインが必要です
              </h1>
              <p className="text-gray-600">
                この機能を利用するにはログインしてください
              </p>
            </div>
            <LoginForm />
          </div>
        )}
      </div>
    )
  }

  return <>{children}</>
}

interface AuthGuardProps {
  children: React.ReactNode
  subscriptionTier?: 'free' | 'basic' | 'pro'
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  subscriptionTier,
  fallback 
}: AuthGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-4">この機能を利用するにはログインが必要です</p>
        <LoginForm />
      </div>
    )
  }

  // Check subscription tier if specified
  if (subscriptionTier) {
    const tierLevels = { free: 0, basic: 1, pro: 2 }
    const userTier = user.user_metadata?.subscription_tier || 'free'
    const requiredLevel = tierLevels[subscriptionTier]
    const userLevel = tierLevels[userTier as keyof typeof tierLevels] || 0

    if (userLevel < requiredLevel) {
      return (
        <div className="text-center p-8">
          {fallback || (
            <div className="max-w-md mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-8V7m0 0V5m0 2h2m-2 0H10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  プレミアム機能
                </h3>
                <p className="text-gray-600 mb-4">
                  この機能は{subscriptionTier === 'basic' ? 'ベーシック' : 'プロ'}プラン以上で利用できます
                </p>
                <button 
                  type="button"
                  onClick={() => window.location.href = '/pricing'}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  プランをアップグレード
                </button>
              </div>
            </div>
          )}
        </div>
      )
    }
  }

  return <>{children}</>
}