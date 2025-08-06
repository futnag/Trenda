import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import PricingPlans from '../PricingPlans'

// Mock the hooks
jest.mock('@/hooks/useAuth')
jest.mock('@/hooks/useSubscription')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseSubscription = useSubscription as jest.MockedFunction<typeof useSubscription>

describe('PricingPlans', () => {
  const mockCreateSubscription = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
    })

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
      createSubscription: mockCreateSubscription,
      manageSubscription: jest.fn(),
      refreshSubscription: jest.fn(),
    })
  })

  it('renders all pricing plans', () => {
    render(<PricingPlans />)

    expect(screen.getByText('無料プラン')).toBeInTheDocument()
    expect(screen.getByText('ベーシックプラン')).toBeInTheDocument()
    expect(screen.getByText('プロプラン')).toBeInTheDocument()
  })

  it('shows correct pricing', () => {
    render(<PricingPlans />)

    expect(screen.getByText('¥0')).toBeInTheDocument()
    expect(screen.getByText('¥980')).toBeInTheDocument()
    expect(screen.getByText('¥2,980')).toBeInTheDocument()
  })

  it('handles plan selection for basic plan', async () => {
    mockCreateSubscription.mockResolvedValue('https://checkout.stripe.com/test')
    
    // Mock window.location.href
    delete (window as any).location
    window.location = { href: '' } as any

    render(<PricingPlans />)

    const basicButton = screen.getByText('このプランを選択')
    fireEvent.click(basicButton)

    await waitFor(() => {
      expect(mockCreateSubscription).toHaveBeenCalledWith('basic')
    })
  })

  it('shows current plan status correctly', () => {
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
      createSubscription: mockCreateSubscription,
      manageSubscription: jest.fn(),
      refreshSubscription: jest.fn(),
    })

    render(<PricingPlans />)

    // Should show "現在のプラン" for basic plan
    const basicSection = screen.getByText('ベーシックプラン').closest('div')
    expect(basicSection).toHaveTextContent('現在のプラン')
  })

  it('redirects to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
    })

    // Mock window.location.href
    delete (window as any).location
    window.location = { href: '' } as any

    render(<PricingPlans />)

    const button = screen.getAllByText('ログインして開始')[0]
    fireEvent.click(button)

    expect(window.location.href).toBe('/auth/login?redirect=/pricing')
  })

  it('shows loading state during subscription creation', async () => {
    mockCreateSubscription.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    render(<PricingPlans />)

    const basicButton = screen.getByText('このプランを選択')
    fireEvent.click(basicButton)

    await waitFor(() => {
      expect(screen.getByText('処理中...')).toBeInTheDocument()
    })
  })

  it('displays FAQ section', () => {
    render(<PricingPlans />)

    expect(screen.getByText('よくある質問')).toBeInTheDocument()
    expect(screen.getByText('プランの変更はいつでも可能ですか？')).toBeInTheDocument()
    expect(screen.getByText('無料トライアルはありますか？')).toBeInTheDocument()
  })
})