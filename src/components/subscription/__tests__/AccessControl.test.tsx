import { render, screen } from '@testing-library/react'
import { useSubscription } from '@/hooks/useSubscription'
import AccessControl, { useAccessControl } from '../AccessControl'
import { renderHook } from '@testing-library/react'

// Mock the useSubscription hook
jest.mock('@/hooks/useSubscription')

const mockUseSubscription = useSubscription as jest.MockedFunction<typeof useSubscription>

describe('AccessControl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when user has access', () => {
    mockUseSubscription.mockReturnValue({
      subscription: null,
      tier: 'pro',
      limits: {
        detailedAnalysisPerMonth: -1,
        apiRequestsPerMonth: 10000,
        canExportData: true,
        canSetCustomAlerts: true,
        canAccessHistoricalData: true,
        supportLevel: 'priority',
      },
      loading: false,
      error: null,
      canAccess: jest.fn((tier) => true),
      createSubscription: jest.fn(),
      manageSubscription: jest.fn(),
      refreshSubscription: jest.fn(),
    })

    render(
      <AccessControl requiredTier="basic">
        <div>Premium Content</div>
      </AccessControl>
    )

    expect(screen.getByText('Premium Content')).toBeInTheDocument()
  })

  it('shows upgrade prompt when user lacks access', () => {
    mockUseSubscription.mockReturnValue({
      subscription: null,
      tier: 'free',
      limits: {
        detailedAnalysisPerMonth: 10,
        apiRequestsPerMonth: 0,
        canExportData: false,
        canSetCustomAlerts: false,
        canAccessHistoricalData: false,
        supportLevel: 'basic',
      },
      loading: false,
      error: null,
      canAccess: jest.fn((tier) => tier === 'free'),
      createSubscription: jest.fn(),
      manageSubscription: jest.fn(),
      refreshSubscription: jest.fn(),
    })

    render(
      <AccessControl requiredTier="pro">
        <div>Premium Content</div>
      </AccessControl>
    )

    expect(screen.queryByText('Premium Content')).not.toBeInTheDocument()
    expect(screen.getByText('プランのアップグレードが必要です')).toBeInTheDocument()
  })

  it('shows fallback content when provided and user lacks access', () => {
    mockUseSubscription.mockReturnValue({
      subscription: null,
      tier: 'free',
      limits: {
        detailedAnalysisPerMonth: 10,
        apiRequestsPerMonth: 0,
        canExportData: false,
        canSetCustomAlerts: false,
        canAccessHistoricalData: false,
        supportLevel: 'basic',
      },
      loading: false,
      error: null,
      canAccess: jest.fn((tier) => tier === 'free'),
      createSubscription: jest.fn(),
      manageSubscription: jest.fn(),
      refreshSubscription: jest.fn(),
    })

    render(
      <AccessControl 
        requiredTier="pro" 
        fallback={<div>Fallback Content</div>}
        showUpgradePrompt={false}
      >
        <div>Premium Content</div>
      </AccessControl>
    )

    expect(screen.queryByText('Premium Content')).not.toBeInTheDocument()
    expect(screen.getByText('Fallback Content')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseSubscription.mockReturnValue({
      subscription: null,
      tier: 'free',
      limits: {
        detailedAnalysisPerMonth: 10,
        apiRequestsPerMonth: 0,
        canExportData: false,
        canSetCustomAlerts: false,
        canAccessHistoricalData: false,
        supportLevel: 'basic',
      },
      loading: true,
      error: null,
      canAccess: jest.fn(),
      createSubscription: jest.fn(),
      manageSubscription: jest.fn(),
      refreshSubscription: jest.fn(),
    })

    render(
      <AccessControl requiredTier="pro">
        <div>Premium Content</div>
      </AccessControl>
    )

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })
})

describe('useAccessControl', () => {
  it('returns correct access control information', () => {
    mockUseSubscription.mockReturnValue({
      subscription: null,
      tier: 'basic',
      limits: {
        detailedAnalysisPerMonth: -1,
        apiRequestsPerMonth: 0,
        canExportData: false,
        canSetCustomAlerts: true,
        canAccessHistoricalData: false,
        supportLevel: 'basic',
      },
      loading: false,
      error: null,
      canAccess: jest.fn((tier) => ['free', 'basic'].includes(tier)),
      createSubscription: jest.fn(),
      manageSubscription: jest.fn(),
      refreshSubscription: jest.fn(),
    })

    const { result } = renderHook(() => useAccessControl())

    expect(result.current.currentTier).toBe('basic')
    expect(result.current.isBasicTier).toBe(true)
    expect(result.current.isFreeTier).toBe(false)
    expect(result.current.isProTier).toBe(false)
    expect(result.current.canAccessFeature('free')).toBe(true)
    expect(result.current.canAccessFeature('basic')).toBe(true)
    expect(result.current.canAccessFeature('pro')).toBe(false)
  })
})