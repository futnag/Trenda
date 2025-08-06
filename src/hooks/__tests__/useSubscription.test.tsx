import { renderHook, waitFor } from '@testing-library/react'
import { useSubscription } from '../useSubscription'

// Mock the useAuth hook
jest.mock('../useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('useSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useSubscription())

    expect(result.current.subscription).toBeNull()
    expect(result.current.tier).toBe('free')
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  test('should fetch subscription data on mount', async () => {
    const mockSubscription = {
      id: 'sub-123',
      plan_name: 'basic',
      status: 'active',
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subscription: mockSubscription }),
    })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.subscription).toEqual(mockSubscription)
    expect(result.current.tier).toBe('basic')
  })

  test('should handle fetch error', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.tier).toBe('free')
  })

  test('should create subscription', async () => {
    const mockUrl = 'https://checkout.stripe.com/session-123'
    
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: mockUrl }),
      })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const url = await result.current.createSubscription('basic')
    expect(url).toBe(mockUrl)
  })

  test('should manage subscription', async () => {
    const mockUrl = 'https://billing.stripe.com/session-123'
    
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: mockUrl }),
      })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const url = await result.current.manageSubscription()
    expect(url).toBe(mockUrl)
  })

  test('should check feature access correctly', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        subscription: { 
          plan_name: 'basic', 
          status: 'active' 
        } 
      }),
    })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.canAccess('free')).toBe(true)
    expect(result.current.canAccess('basic')).toBe(true)
    expect(result.current.canAccess('pro')).toBe(false)
  })
})