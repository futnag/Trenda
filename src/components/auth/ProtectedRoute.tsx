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
            <div>
              <p className="text-gray-600 mb-4">
                この機能は{subscriptionTier}プラン以上で利用できます
              </p>
              <button 
                type="button"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                プランをアップグレード
              </button>
            </div>
          )}
        </div>
      )
    }
  }

  return <>{children}</>
}