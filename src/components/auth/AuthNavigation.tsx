'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface AuthNavigationProps {
  className?: string
  showLabels?: boolean
  variant?: 'header' | 'sidebar' | 'mobile'
}

export function AuthNavigation({ 
  className = '', 
  showLabels = true, 
  variant = 'header' 
}: AuthNavigationProps) {
  const { user, signOut, loading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <Link
          href="/auth/login"
          className="text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
          {showLabels && 'ログイン'}
        </Link>
        <Link
          href="/auth/login"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {showLabels && '新規登録'}
        </Link>
      </div>
    )
  }

  // Authenticated user navigation
  const userInitial = user.email?.charAt(0).toUpperCase() || 'U'
  
  if (variant === 'mobile') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
          {user.email}
        </div>
        <Link
          href="/profile"
          className="block px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
        >
          プロフィール設定
        </Link>
        <Link
          href="/dashboard"
          className="block px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
        >
          ダッシュボード
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="block w-full text-left px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
        >
          {isSigningOut ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
    )
  }

  if (variant === 'sidebar') {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center px-4 py-2 text-sm text-gray-700">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.email}
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          プロフィール設定
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
        >
          {isSigningOut ? 'ログアウト中...' : 'ログアウト'}
        </button>
      </div>
    )
  }

  // Default header variant
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1 transition-colors">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {userInitial}
        </div>
        {showLabels && (
          <span className="ml-2 text-sm font-medium truncate max-w-32">
            {user.email}
          </span>
        )}
      </div>
    </div>
  )
}

// Hook for checking authentication requirements
export function useAuthRequirement(requirement?: 'authenticated' | 'unauthenticated' | 'subscription') {
  const { user, loading } = useAuth()
  
  if (loading) {
    return { canAccess: false, loading: true, reason: null }
  }

  switch (requirement) {
    case 'authenticated':
      return {
        canAccess: !!user,
        loading: false,
        reason: !user ? 'ログインが必要です' : null
      }
    case 'unauthenticated':
      return {
        canAccess: !user,
        loading: false,
        reason: user ? '既にログインしています' : null
      }
    case 'subscription':
      const hasSubscription = user?.user_metadata?.subscription_tier !== 'free'
      return {
        canAccess: !!user && hasSubscription,
        loading: false,
        reason: !user ? 'ログインが必要です' : !hasSubscription ? '有料プランが必要です' : null
      }
    default:
      return { canAccess: true, loading: false, reason: null }
  }
}