import { 
  getSubscriptionLimits, 
  canAccessFeature, 
  SUBSCRIPTION_LIMITS,
  formatSubscriptionStatus,
  getUpgradeOptions,
  getDowngradeOptions,
} from '../subscription-utils'
import { SubscriptionTier } from '../stripe'

// Mock Supabase
jest.mock('../supabase', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}))

describe('Subscription Utils', () => {
  test('should return correct limits for each tier', () => {
    const freeLimits = getSubscriptionLimits('free')
    expect(freeLimits.detailedAnalysisPerMonth).toBe(10)
    expect(freeLimits.apiRequestsPerMonth).toBe(0)
    expect(freeLimits.canExportData).toBe(false)

    const basicLimits = getSubscriptionLimits('basic')
    expect(basicLimits.detailedAnalysisPerMonth).toBe(-1)
    expect(basicLimits.canSetCustomAlerts).toBe(true)
    expect(basicLimits.canExportData).toBe(false)

    const proLimits = getSubscriptionLimits('pro')
    expect(proLimits.apiRequestsPerMonth).toBe(10000)
    expect(proLimits.canExportData).toBe(true)
    expect(proLimits.canAccessHistoricalData).toBe(true)
  })

  test('should correctly check feature access', () => {
    expect(canAccessFeature('free', 'free')).toBe(true)
    expect(canAccessFeature('free', 'basic')).toBe(false)
    expect(canAccessFeature('free', 'pro')).toBe(false)

    expect(canAccessFeature('basic', 'free')).toBe(true)
    expect(canAccessFeature('basic', 'basic')).toBe(true)
    expect(canAccessFeature('basic', 'pro')).toBe(false)

    expect(canAccessFeature('pro', 'free')).toBe(true)
    expect(canAccessFeature('pro', 'basic')).toBe(true)
    expect(canAccessFeature('pro', 'pro')).toBe(true)
  })

  test('should have correct subscription limits configuration', () => {
    expect(SUBSCRIPTION_LIMITS.free.detailedAnalysisPerMonth).toBe(10)
    expect(SUBSCRIPTION_LIMITS.free.supportLevel).toBe('basic')
    
    expect(SUBSCRIPTION_LIMITS.basic.detailedAnalysisPerMonth).toBe(-1)
    expect(SUBSCRIPTION_LIMITS.basic.canSetCustomAlerts).toBe(true)
    
    expect(SUBSCRIPTION_LIMITS.pro.apiRequestsPerMonth).toBe(10000)
    expect(SUBSCRIPTION_LIMITS.pro.supportLevel).toBe('priority')
  })

  test('should validate subscription tier types', () => {
    const validTiers: SubscriptionTier[] = ['free', 'basic', 'pro']
    
    validTiers.forEach(tier => {
      expect(['free', 'basic', 'pro']).toContain(tier)
      expect(getSubscriptionLimits(tier)).toBeDefined()
    })
  })
})

describe('Subscription Status Formatting', () => {
  test('should format subscription statuses correctly', () => {
    expect(formatSubscriptionStatus('active')).toBe('アクティブ')
    expect(formatSubscriptionStatus('canceled')).toBe('キャンセル済み')
    expect(formatSubscriptionStatus('past_due')).toBe('支払い遅延')
    expect(formatSubscriptionStatus('unpaid')).toBe('未払い')
    expect(formatSubscriptionStatus('incomplete')).toBe('不完全')
    expect(formatSubscriptionStatus('trialing')).toBe('トライアル中')
    expect(formatSubscriptionStatus('unknown_status')).toBe('unknown_status')
  })
})

describe('Tier Management', () => {
  test('should return correct upgrade options', () => {
    expect(getUpgradeOptions('free')).toEqual(['basic', 'pro'])
    expect(getUpgradeOptions('basic')).toEqual(['pro'])
    expect(getUpgradeOptions('pro')).toEqual([])
  })

  test('should return correct downgrade options', () => {
    expect(getDowngradeOptions('free')).toEqual([])
    expect(getDowngradeOptions('basic')).toEqual(['free'])
    expect(getDowngradeOptions('pro')).toEqual(['free', 'basic'])
  })
})