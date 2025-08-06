'use client'

import { ReactNode } from 'react'
import AccessControl from './AccessControl'
import FeatureGate from './FeatureGate'
import { SubscriptionTier } from '@/types'

interface PremiumFeatureWrapperProps {
  children: ReactNode
  requiredTier: SubscriptionTier
  feature?: string
  usageFeature?: string
  title?: string
  description?: string
}

export default function PremiumFeatureWrapper({
  children,
  requiredTier,
  feature,
  usageFeature,
  title,
  description,
}: PremiumFeatureWrapperProps) {
  return (
    <div className="relative">
      {usageFeature ? (
        <FeatureGate
          requiredTier={requiredTier}
          feature={feature}
          usageFeature={usageFeature}
        >
          {children}
        </FeatureGate>
      ) : (
        <AccessControl
          requiredTier={requiredTier}
          feature={feature}
        >
          {children}
        </AccessControl>
      )}
    </div>
  )
}