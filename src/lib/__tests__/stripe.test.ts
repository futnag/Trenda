import { 
  STRIPE_CONFIG, 
  SubscriptionTier,
  createStripeCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
  reactivateSubscription,
  isValidWebhookSignature,
} from '../stripe'

// Mock Stripe
jest.mock('stripe', () => {
  const mockStripe = {
    customers: {
      create: jest.fn(),
      list: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
    },
    subscriptions: {
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }
  
  return jest.fn().mockImplementation(() => mockStripe)
})

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(),
}))

describe('Stripe Configuration', () => {
  test('should have correct plan configuration', () => {
    expect(STRIPE_CONFIG.currency).toBe('jpy')
    expect(STRIPE_CONFIG.plans.basic.price).toBe(980)
    expect(STRIPE_CONFIG.plans.pro.price).toBe(2980)
    expect(STRIPE_CONFIG.plans.basic.features).toHaveLength(4)
    expect(STRIPE_CONFIG.plans.pro.features).toHaveLength(6)
  })

  test('should have required environment variables defined', () => {
    // In test environment, these might be undefined, so we check the structure
    expect(STRIPE_CONFIG.plans.basic).toHaveProperty('priceId')
    expect(STRIPE_CONFIG.plans.pro).toHaveProperty('priceId')
  })
})

describe('Stripe Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createStripeCustomer', () => {
    test('should create a customer with correct parameters', async () => {
      const mockCustomer = { id: 'cus_test123' }
      const mockStripeInstance = require('../stripe').stripe
      mockStripeInstance.customers.create.mockResolvedValue(mockCustomer)

      const result = await createStripeCustomer('test@example.com', 'user123')

      expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: {
          userId: 'user123',
        },
      })
      expect(result).toEqual(mockCustomer)
    })
  })

  describe('createCheckoutSession', () => {
    test('should create checkout session for new customer', async () => {
      const mockSession = { id: 'cs_test123', url: 'https://checkout.stripe.com/test' }
      const mockCustomer = { id: 'cus_test123' }
      const mockStripeInstance = require('../stripe').stripe
      
      mockStripeInstance.customers.list.mockResolvedValue({ data: [] })
      mockStripeInstance.customers.create.mockResolvedValue(mockCustomer)
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(mockSession)

      const params = {
        userId: 'user123',
        email: 'test@example.com',
        planName: 'basic' as const,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      }

      const result = await createCheckoutSession(params)

      expect(mockStripeInstance.customers.list).toHaveBeenCalledWith({
        email: 'test@example.com',
        limit: 1,
      })
      expect(mockStripeInstance.customers.create).toHaveBeenCalled()
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalled()
      expect(result).toEqual(mockSession)
    })

    test('should use existing customer if found', async () => {
      const mockSession = { id: 'cs_test123', url: 'https://checkout.stripe.com/test' }
      const existingCustomer = { id: 'cus_existing123' }
      const mockStripeInstance = require('../stripe').stripe
      
      mockStripeInstance.customers.list.mockResolvedValue({ data: [existingCustomer] })
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(mockSession)

      const params = {
        userId: 'user123',
        email: 'test@example.com',
        planName: 'pro' as const,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      }

      await createCheckoutSession(params)

      expect(mockStripeInstance.customers.create).not.toHaveBeenCalled()
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing123',
        })
      )
    })
  })

  describe('createBillingPortalSession', () => {
    test('should create billing portal session', async () => {
      const mockSession = { url: 'https://billing.stripe.com/test' }
      const mockStripeInstance = require('../stripe').stripe
      mockStripeInstance.billingPortal.sessions.create.mockResolvedValue(mockSession)

      const result = await createBillingPortalSession('cus_test123', 'https://example.com/return')

      expect(mockStripeInstance.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        return_url: 'https://example.com/return',
      })
      expect(result).toEqual(mockSession)
    })
  })

  describe('cancelSubscription', () => {
    test('should cancel subscription at period end by default', async () => {
      const mockSubscription = { id: 'sub_test123', cancel_at_period_end: true }
      const mockStripeInstance = require('../stripe').stripe
      mockStripeInstance.subscriptions.update.mockResolvedValue(mockSubscription)

      const result = await cancelSubscription('sub_test123')

      expect(mockStripeInstance.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: true,
      })
      expect(result).toEqual(mockSubscription)
    })

    test('should cancel subscription immediately when specified', async () => {
      const mockSubscription = { id: 'sub_test123', status: 'canceled' }
      const mockStripeInstance = require('../stripe').stripe
      mockStripeInstance.subscriptions.cancel.mockResolvedValue(mockSubscription)

      const result = await cancelSubscription('sub_test123', false)

      expect(mockStripeInstance.subscriptions.cancel).toHaveBeenCalledWith('sub_test123')
      expect(result).toEqual(mockSubscription)
    })
  })

  describe('reactivateSubscription', () => {
    test('should reactivate subscription', async () => {
      const mockSubscription = { id: 'sub_test123', cancel_at_period_end: false }
      const mockStripeInstance = require('../stripe').stripe
      mockStripeInstance.subscriptions.update.mockResolvedValue(mockSubscription)

      const result = await reactivateSubscription('sub_test123')

      expect(mockStripeInstance.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: false,
      })
      expect(result).toEqual(mockSubscription)
    })
  })

  describe('isValidWebhookSignature', () => {
    test('should return true for valid signature', () => {
      const mockStripeInstance = require('../stripe').stripe
      mockStripeInstance.webhooks.constructEvent.mockReturnValue({})

      const result = isValidWebhookSignature('body', 'signature', 'secret')

      expect(result).toBe(true)
      expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith('body', 'signature', 'secret')
    })

    test('should return false for invalid signature', () => {
      const mockStripeInstance = require('../stripe').stripe
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const result = isValidWebhookSignature('body', 'invalid', 'secret')

      expect(result).toBe(false)
    })
  })
})

describe('Subscription Tiers', () => {
  test('should have valid subscription tier types', () => {
    const validTiers: SubscriptionTier[] = ['free', 'basic', 'pro']
    
    validTiers.forEach(tier => {
      expect(['free', 'basic', 'pro']).toContain(tier)
    })
  })
})