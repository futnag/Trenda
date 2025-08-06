'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { getCurrentUsage, checkUsageLimit } from '@/lib/subscription-utils'

interface UsageData {
  feature: string
  current: number
  limit: number
  remaining: number
  percentage: number
}

interface UsageTrackerProps {
  features?: string[]
  showUpgradePrompt?: boolean
  compact?: boolean
}

const FEATURE_LABELS: Record<string, string> = {
  detailedAnalysisPerMonth: '詳細分析',
  apiRequestsPerMonth: 'API リクエスト',
}

export default function UsageTracker({
  features = ['detailedAnalysisPerMonth'],
  showUpgradePrompt = true,
  compact = false,
}: UsageTrackerProps) {
  const { user } = useAuth()
  const { tier, limits } = useSubscription()
  const [usageData, setUsageData] = useState<UsageData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchUsageData = async () => {
      try {
        const data: UsageData[] = []

        for (const feature of features) {
          const current = await getCurrentUsage(user.id, feature)
          const limit = limits[feature as keyof typeof limits] as number
          
          // Skip unlimited features (-1)
          if (limit === -1) {
            continue
          }

          const remaining = Math.max(0, limit - current)
          const percentage = limit > 0 ? (current / limit) * 100 : 0

          data.push({
            feature,
            current,
            limit,
            remaining,
            percentage: Math.min(percentage, 100),
          })
        }

        setUsageData(data)
      } catch (error) {
        console.error('Failed to fetch usage data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsageData()
  }, [user, features, limits])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-2 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (usageData.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${compact ? 'space-y-2' : ''}`}>
      {usageData.map((usage) => (
        <UsageItem
          key={usage.feature}
          usage={usage}
          tier={tier}
          compact={compact}
          showUpgradePrompt={showUpgradePrompt}
        />
      ))}
    </div>
  )
}

interface UsageItemProps {
  usage: UsageData
  tier: string
  compact: boolean
  showUpgradePrompt: boolean
}

function UsageItem({ usage, tier, compact, showUpgradePrompt }: UsageItemProps) {
  const featureLabel = FEATURE_LABELS[usage.feature] || usage.feature
  const isNearLimit = usage.percentage >= 80
  const isAtLimit = usage.percentage >= 100

  const getProgressBarColor = () => {
    if (isAtLimit) return 'bg-red-500'
    if (isNearLimit) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const getTextColor = () => {
    if (isAtLimit) return 'text-red-600'
    if (isNearLimit) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div className={`${compact ? 'p-3' : 'p-4'} bg-white border border-gray-200 rounded-lg`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`font-medium ${compact ? 'text-sm' : ''}`}>
          {featureLabel}
        </span>
        <span className={`${getTextColor()} ${compact ? 'text-xs' : 'text-sm'}`}>
          {usage.current.toLocaleString()} / {usage.limit.toLocaleString()}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`${getProgressBarColor()} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${usage.percentage}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className={`${getTextColor()} ${compact ? 'text-xs' : 'text-sm'}`}>
          残り: {usage.remaining.toLocaleString()}
        </span>
        
        {isNearLimit && showUpgradePrompt && tier === 'free' && (
          <button
            onClick={() => {
              window.location.href = '/pricing'
            }}
            className={`text-blue-600 hover:text-blue-800 font-medium ${
              compact ? 'text-xs' : 'text-sm'
            }`}
          >
            アップグレード
          </button>
        )}
      </div>

      {isAtLimit && (
        <div className={`mt-2 p-2 bg-red-50 border border-red-200 rounded ${
          compact ? 'text-xs' : 'text-sm'
        }`}>
          <div className="flex items-center text-red-600">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            月間利用上限に達しました
          </div>
          {showUpgradePrompt && tier === 'free' && (
            <button
              onClick={() => {
                window.location.href = '/pricing'
              }}
              className="mt-1 text-blue-600 hover:text-blue-800 font-medium underline"
            >
              プランをアップグレードして制限を解除
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Hook for checking if a feature can be used
export function useFeatureUsage(feature: string) {
  const { user } = useAuth()
  const { limits } = useSubscription()
  const [canUse, setCanUse] = useState(true)
  const [usage, setUsage] = useState<{
    current: number
    limit: number
    remaining: number
  } | null>(null)

  useEffect(() => {
    if (!user) {
      setCanUse(false)
      return
    }

    const checkUsage = async () => {
      try {
        const current = await getCurrentUsage(user.id, feature)
        const result = await checkUsageLimit(user.id, feature as any, current)
        
        setCanUse(result.allowed)
        setUsage({
          current,
          limit: result.limit,
          remaining: result.remaining,
        })
      } catch (error) {
        console.error('Failed to check feature usage:', error)
        setCanUse(false)
      }
    }

    checkUsage()
  }, [user, feature, limits])

  return {
    canUse,
    usage,
    refreshUsage: async () => {
      if (!user) return
      
      const current = await getCurrentUsage(user.id, feature)
      const result = await checkUsageLimit(user.id, feature as any, current)
      
      setCanUse(result.allowed)
      setUsage({
        current,
        limit: result.limit,
        remaining: result.remaining,
      })
    },
  }
}