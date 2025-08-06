import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { SubscriptionTier, SubscriptionData } from '@/lib/stripe'
import { SubscriptionLimits, getSubscriptionLimits, canAccessFeature } from '@/lib/subscription-utils'

interface UseSubscriptionReturn {
  subscription: SubscriptionData | null
  tier: SubscriptionTier
  limits: SubscriptionLimits
  loading: boolean
  error: string | null
  canAccess: (requiredTier: SubscriptionTier) => boolean
  createSubscription: (planName: 'basic' | 'pro') => Promise<string | null>
  manageSubscription: () => Promise<string | null>
  refreshSubscription: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [tier, setTier] = useState<SubscriptionTier>('free')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const limits = getSubscriptionLimits(tier)

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const response = await fetch('/api/subscriptions/manage')
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }

      const data = await response.json()
      setSubscription(data.subscription)
      
      // Update tier based on subscription
      if (data.subscription?.status === 'active') {
        setTier(data.subscription.plan_name)
      } else {
        setTier('free')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setTier('free')
    } finally {
      setLoading(false)
    }
  }

  const createSubscription = async (planName: 'basic' | 'pro'): Promise<string | null> => {
    try {
      setError(null)
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planName,
          successUrl: `${window.location.origin}/profile?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create subscription')
      }

      const data = await response.json()
      return data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  const manageSubscription = async (): Promise<string | null> => {
    try {
      setError(null)
      const response = await fetch('/api/subscriptions/manage', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create management session')
      }

      const data = await response.json()
      return data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    }
  }

  const canAccess = (requiredTier: SubscriptionTier): boolean => {
    return canAccessFeature(tier, requiredTier)
  }

  const refreshSubscription = async () => {
    await fetchSubscription()
  }

  useEffect(() => {
    fetchSubscription()
  }, [user])

  return {
    subscription,
    tier,
    limits,
    loading,
    error,
    canAccess,
    createSubscription,
    manageSubscription,
    refreshSubscription,
  }
}