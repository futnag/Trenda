'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { SubscriptionTier } from '@/types'
import { incrementUsage, getCurrentUsage, checkUsageLimit } from '@/lib/subscription-utils'
import { useState, useEffect } from 'react'
import UpgradePrompt from './UpgradePrompt'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface FeatureGateProps {
  requiredTier: SubscriptionTier
  feature?: string
  usageFeature?: string
  children: ReactNode
  fallback?: ReactNode
  onUsageExceeded?: () => void
  showUpgradePrompt?: boolean
}

export default function FeatureGate({
  requiredTier,
  feature,
  usageFeature,
  children,
  fallback,
  onUsageExceeded,
  showUpgradePrompt = true,
}: FeatureGateProps) {
  const { user } = useAuth()
  const { canAccess, loading: subscriptionLoading } = useSubscription()
  const [usageLoading, setUsageLoading] = useState(false)
  const [canUseFeature, setCanUseFeature] = useState(true)
  const [usageInfo, setUsageInfo] = useState<{
    current: number
    limit: number
    remaining: number
  } | null>(null)

  // Check access permission
  const hasAccess = canAccess(requiredTier)

  // Check usage limits if applicable
  useEffect(() => {
    if (!user || !usageFeature || !hasAccess) {
      return
    }

    const checkUsage = async () => {
      setUsageLoading(true)
      try {
        const current = await getCurrentUsage(user.id, usageFeature)
        const result = await checkUsageLimit(user.id, usageFeature as any, current)
        
        setCanUseFeature(result.allowed)
        setUsageInfo({
          current,
          limit: result.limit,
          remaining: result.remaining,
        })

        if (!result.allowed && onUsageExceeded) {
          onUsageExceeded()
        }
      } catch (error) {
        console.error('Failed to check usage:', error)
        setCanUseFeature(false)
      } finally {
        setUsageLoading(false)
      }
    }

    checkUsage()
  }, [user, usageFeature, hasAccess, onUsageExceeded])

  // Function to increment usage when feature is used
  const useFeature = async () => {
    if (!user || !usageFeature) {
      return true
    }

    try {
      await incrementUsage(user.id, usageFeature, 1)
      
      // Update usage info
      const current = await getCurrentUsage(user.id, usageFeature)
      const result = await checkUsageLimit(user.id, usageFeature as any, current)
      
      setCanUseFeature(result.allowed)
      setUsageInfo({
        current,
        limit: result.limit,
        remaining: result.remaining,
      })

      return result.allowed
    } catch (error) {
      console.error('Failed to increment usage:', error)
      return false
    }
  }

  if (subscriptionLoading || usageLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  // Check tier access first
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    if (showUpgradePrompt) {
      return <UpgradePrompt requiredTier={requiredTier} feature={feature} />
    }
    
    return null
  }

  // Check usage limits
  if (usageFeature && !canUseFeature) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (showUpgradePrompt) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              月間利用上限に達しました
            </h3>
            
            <p className="text-gray-600 mb-4">
              {usageInfo && (
                <>
                  今月の利用回数: {usageInfo.current.toLocaleString()} / {usageInfo.limit.toLocaleString()}
                </>
              )}
            </p>

            <button
              onClick={() => {
                window.location.href = '/pricing'
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              プランをアップグレード
            </button>
          </div>
        </div>
      )
    }

    return null
  }

  // Render children with usage tracking capability
  if (usageFeature) {
    return (
      <FeatureWrapper useFeature={useFeature}>
        {children}
      </FeatureWrapper>
    )
  }

  return <>{children}</>
}

// Wrapper component that provides usage tracking to children
interface FeatureWrapperProps {
  children: ReactNode
  useFeature: () => Promise<boolean>
}

function FeatureWrapper({ children, useFeature }: FeatureWrapperProps) {
  // Clone children and inject useFeature prop if they accept it
  const enhancedChildren = typeof children === 'object' && children !== null && 'type' in children
    ? {
        ...children,
        props: {
          ...children.props,
          useFeature,
        },
      }
    : children

  return <>{enhancedChildren}</>
}

// Hook for manual usage tracking
export function useFeatureUsage(feature: string) {
  const { user } = useAuth()
  const [canUse, setCanUse] = useState(true)
  const [usage, setUsage] = useState<{
    current: number
    limit: number
    remaining: number
  } | null>(null)

  const checkUsage = async () => {
    if (!user) {
      setCanUse(false)
      return false
    }

    try {
      const current = await getCurrentUsage(user.id, feature)
      const result = await checkUsageLimit(user.id, feature as any, current)
      
      setCanUse(result.allowed)
      setUsage({
        current,
        limit: result.limit,
        remaining: result.remaining,
      })

      return result.allowed
    } catch (error) {
      console.error('Failed to check usage:', error)
      setCanUse(false)
      return false
    }
  }

  const useFeature = async () => {
    if (!user) {
      return false
    }

    try {
      await incrementUsage(user.id, feature, 1)
      return await checkUsage()
    } catch (error) {
      console.error('Failed to use feature:', error)
      return false
    }
  }

  useEffect(() => {
    checkUsage()
  }, [user, feature])

  return {
    canUse,
    usage,
    useFeature,
    refreshUsage: checkUsage,
  }
}