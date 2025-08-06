import { createClient } from '@/lib/supabase'
import { SubscriptionTier, SubscriptionData } from '@/lib/stripe'

export interface SubscriptionLimits {
  detailedAnalysisPerMonth: number
  apiRequestsPerMonth: number
  canExportData: boolean
  canSetCustomAlerts: boolean
  canAccessHistoricalData: boolean
  supportLevel: 'basic' | 'priority'
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    detailedAnalysisPerMonth: 10,
    apiRequestsPerMonth: 0,
    canExportData: false,
    canSetCustomAlerts: false,
    canAccessHistoricalData: false,
    supportLevel: 'basic',
  },
  basic: {
    detailedAnalysisPerMonth: -1, // unlimited
    apiRequestsPerMonth: 0,
    canExportData: false,
    canSetCustomAlerts: true,
    canAccessHistoricalData: false,
    supportLevel: 'basic',
  },
  pro: {
    detailedAnalysisPerMonth: -1, // unlimited
    apiRequestsPerMonth: 10000,
    canExportData: true,
    canSetCustomAlerts: true,
    canAccessHistoricalData: true,
    supportLevel: 'priority',
  },
}

export async function getUserSubscription(userId: string): Promise<SubscriptionData | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user subscription:', error)
    return null
  }

  return data
}

export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user subscription tier:', error)
    return 'free'
  }

  return (data?.subscription_tier as SubscriptionTier) || 'free'
}

export function getSubscriptionLimits(tier: SubscriptionTier): SubscriptionLimits {
  return SUBSCRIPTION_LIMITS[tier]
}

export function canAccessFeature(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  const tierOrder: SubscriptionTier[] = ['free', 'basic', 'pro']
  const userTierIndex = tierOrder.indexOf(userTier)
  const requiredTierIndex = tierOrder.indexOf(requiredTier)
  
  return userTierIndex >= requiredTierIndex
}

export async function checkUsageLimit(
  userId: string,
  feature: keyof SubscriptionLimits,
  currentUsage: number
): Promise<{ allowed: boolean; limit: number; remaining: number }> {
  const tier = await getUserSubscriptionTier(userId)
  const limits = getSubscriptionLimits(tier)
  
  const limit = limits[feature] as number
  
  // -1 means unlimited
  if (limit === -1) {
    return {
      allowed: true,
      limit: -1,
      remaining: -1,
    }
  }
  
  const remaining = Math.max(0, limit - currentUsage)
  
  return {
    allowed: currentUsage < limit,
    limit,
    remaining,
  }
}

export async function incrementUsage(
  userId: string,
  feature: string,
  amount: number = 1
): Promise<void> {
  const supabase = createClient()
  
  // This would typically be stored in a usage tracking table
  // For now, we'll implement a simple monthly usage counter
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
  
  const { error } = await supabase
    .from('user_usage')
    .upsert({
      user_id: userId,
      feature,
      month: currentMonth,
      count: amount,
    }, {
      onConflict: 'user_id,feature,month',
      ignoreDuplicates: false,
    })

  if (error) {
    console.error('Error incrementing usage:', error)
  }
}

export async function getCurrentUsage(
  userId: string,
  feature: string
): Promise<number> {
  const supabase = createClient()
  
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
  
  const { data, error } = await supabase
    .from('user_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('month', currentMonth)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching current usage:', error)
    return 0
  }

  return data?.count || 0
}

export async function updateUserSubscriptionTier(
  userId: string,
  tier: SubscriptionTier
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('users')
    .update({
      subscription_tier: tier,
      updated_at: new Date(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user subscription tier:', error)
    throw error
  }
}

export async function getSubscriptionHistory(userId: string): Promise<SubscriptionData[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching subscription history:', error)
    return []
  }

  return data || []
}

export async function isSubscriptionActive(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  return subscription?.status === 'active'
}

export async function getSubscriptionEndDate(userId: string): Promise<Date | null> {
  const subscription = await getUserSubscription(userId)
  return subscription?.current_period_end ? new Date(subscription.current_period_end) : null
}

export async function willSubscriptionCancel(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  return subscription?.cancel_at_period_end || false
}

export function formatSubscriptionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'アクティブ',
    canceled: 'キャンセル済み',
    past_due: '支払い遅延',
    unpaid: '未払い',
    incomplete: '不完全',
    incomplete_expired: '期限切れ',
    trialing: 'トライアル中',
    paused: '一時停止',
  }
  
  return statusMap[status] || status
}

export function getUpgradeOptions(currentTier: SubscriptionTier): SubscriptionTier[] {
  const tierOrder: SubscriptionTier[] = ['free', 'basic', 'pro']
  const currentIndex = tierOrder.indexOf(currentTier)
  
  return tierOrder.slice(currentIndex + 1)
}

export function getDowngradeOptions(currentTier: SubscriptionTier): SubscriptionTier[] {
  const tierOrder: SubscriptionTier[] = ['free', 'basic', 'pro']
  const currentIndex = tierOrder.indexOf(currentTier)
  
  return tierOrder.slice(0, currentIndex)
}