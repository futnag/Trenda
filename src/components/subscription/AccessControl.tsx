'use client'

import { ReactNode } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import { SubscriptionTier } from '@/types'
import UpgradePrompt from './UpgradePrompt'

interface AccessControlProps {
  requiredTier: SubscriptionTier
  children: ReactNode
  fallback?: ReactNode
  showUpgradePrompt?: boolean
  feature?: string
}

export default function AccessControl({
  requiredTier,
  children,
  fallback,
  showUpgradePrompt = true,
  feature,
}: AccessControlProps) {
  const { canAccess, loading } = useSubscription()

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded-lg h-32 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  const hasAccess = canAccess(requiredTier)

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showUpgradePrompt) {
    return <UpgradePrompt requiredTier={requiredTier} feature={feature} />
  }

  return null
}

// Higher-order component version
export function withAccessControl<P extends object>(
  Component: React.ComponentType<P>,
  requiredTier: SubscriptionTier,
  options?: {
    fallback?: ReactNode
    showUpgradePrompt?: boolean
    feature?: string
  }
) {
  return function AccessControlledComponent(props: P) {
    return (
      <AccessControl
        requiredTier={requiredTier}
        fallback={options?.fallback}
        showUpgradePrompt={options?.showUpgradePrompt}
        feature={options?.feature}
      >
        <Component {...props} />
      </AccessControl>
    )
  }
}

// Hook for conditional rendering
export function useAccessControl() {
  const { canAccess, tier, limits } = useSubscription()

  return {
    canAccess,
    currentTier: tier,
    limits,
    canAccessFeature: (requiredTier: SubscriptionTier) => canAccess(requiredTier),
    isFreeTier: tier === 'free',
    isBasicTier: tier === 'basic',
    isProTier: tier === 'pro',
  }
}