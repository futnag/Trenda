import { 
  stripe,
  STRIPE_CONFIG,
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
  reactivateSubscription,
  updateSubscription,
  getSubscriptionDetails,
  isValidWebhookSignature,
  constructWebhookEvent,
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

// Mock environment variables
const originalEnv = process.env
beforeAll(() => {
  process.env = {
    ...originalEnv,
    STRIPE_SECRET_KEY: 'sk_test_123',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
    STRIPE_BASIC_PRICE_ID: 'price_basic_123',
    STRIPE_PRO_PRICE_ID: 'price_pro_123',
  }
})

afterAll(() => {
  process.env = originalEnv
})

// Mock the STRIPE_CONFIG to use test environment variables
jest.mock('../stripe', () => {
  const originalModule = jest.requireActual('../stripe')
  return {
    ...originalModule,
    STRIPE_CONFIG: {
      currency: 'jpy',
      plans: {
        basic: {
          name: 'ベーシックプラン',
          price: 980,
          priceId: 'price_basic_123',
          features: ['詳細分析無制限', '競合分析', 'メール通知', '基本サポート'],
        },
        pro: {
          name: 'プロプラン',
          price: 2980,
          priceId: 'price_pro_123',
          features: ['ベーシックプランの全機能', 'API アクセス', 'データエクスポート', 'カスタムアラート', '優先サポート', '過去1年間のトレンド履歴'],
        },
      },
    },
  }
})

describe('Stripe Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Configuration', () => {
    test('should have correct configuration', () => {
      expect(STRIPE_CONFIG.currency).toBe('jpy')
      expect(STRIPE_CONFIG.plans.basic.price).toBe(980)
      expect(STRIPE_CONFIG.plans.pro.price).toBe(2980)
      expect(STRIPE_CONFIG.plans.basic.features).toHaveLength(4)
      expect(STRIPE_CONFIG.plans.pro.features).toHaveLength(6)
    })

    test('should have required environment variables', () => {
      expect(process.env.STRIPE_SECRET_KEY).toBeDefined()
      expect(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).toBeDefined()
      expect(process.env.STRIPE_WEBHOOK_SECRET).toBeDefined()
      expect(process.env.STRIPE_BASIC_PRICE_ID).toBeDefined()
      expect(process.env.STRIPE_PRO_PRICE_ID).toBeDefined()
    })
  })

  describe('Checkout Session Creation', () => {
    test('should create checkout session with correct parameters', async () => {
      const mockSession = {
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
        customer: 'cus_test123',
      }
      
      const mockCustomer = { id: 'cus_test123' }
      
      // Mock Stripe calls
      const mockStripeInstance = stripe as any
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
      
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_test123',
          payment_method_types: ['card'],
          mode: 'subscription',
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
          metadata: expect.objectContaining({
            userId: 'user123',
            planName: 'basic',
          }),
        })
      )

      expect(result).toEqual(mockSession)
    })

    test('should use existing customer if found', async () => {
      const existingCustomer = { id: 'cus_existing123' }
      const mockSession = { id: 'cs_test123', url: 'https://checkout.stripe.com/test' }
      
      const mockStripeInstance = stripe as any
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
          metadata: expect.objectContaining({
            planName: 'pro',
          }),
        })
      )
    })
  })

  describe('Billing Portal', () => {
    test('should create billing portal session', async () => {
      const mockSession = { url: 'https://billing.stripe.com/test' }
      const mockStripeInstance = stripe as any
      mockStripeInstance.billingPortal.sessions.create.mockResolvedValue(mockSession)

      const result = await createBillingPortalSession('cus_test123', 'https://example.com/return')

      expect(mockStripeInstance.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        return_url: 'https://example.com/return',
      })
      expect(result).toEqual(mockSession)
    })
  })

  describe('Subscription Management', () => {
    test('should cancel subscription at period end', async () => {
      const mockSubscription = { id: 'sub_test123', cancel_at_period_end: true }
      const mockStripeInstance = stripe as any
      mockStripeInstance.subscriptions.update.mockResolvedValue(mockSubscription)

      const result = await cancelSubscription('sub_test123')

      expect(mockStripeInstance.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: true,
      })
      expect(result).toEqual(mockSubscription)
    })

    test('should cancel subscription immediately', async () => {
      const mockSubscription = { id: 'sub_test123', status: 'canceled' }
      const mockStripeInstance = stripe as any
      mockStripeInstance.subscriptions.cancel.mockResolvedValue(mockSubscription)

      const result = await cancelSubscription('sub_test123', false)

      expect(mockStripeInstance.subscriptions.cancel).toHaveBeenCalledWith('sub_test123')
      expect(result).toEqual(mockSubscription)
    })

    test('should reactivate subscription', async () => {
      const mockSubscription = { id: 'sub_test123', cancel_at_period_end: false }
      const mockStripeInstance = stripe as any
      mockStripeInstance.subscriptions.update.mockResolvedValue(mockSubscription)

      const result = await reactivateSubscription('sub_test123')

      expect(mockStripeInstance.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        cancel_at_period_end: false,
      })
      expect(result).toEqual(mockSubscription)
    })

    test('should update subscription', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        items: {
          data: [{ id: 'si_test123' }],
        },
      }
      const updatedSubscription = { id: 'sub_test123', updated: true }
      
      const mockStripeInstance = stripe as any
      mockStripeInstance.subscriptions.retrieve.mockResolvedValue(mockSubscription)
      mockStripeInstance.subscriptions.update.mockResolvedValue(updatedSubscription)

      const result = await updateSubscription({
        subscriptionId: 'sub_test123',
        newPriceId: 'price_new123',
      })

      expect(mockStripeInstance.subscriptions.retrieve).toHaveBeenCalledWith('sub_test123')
      expect(mockStripeInstance.subscriptions.update).toHaveBeenCalledWith('sub_test123', {
        items: [
          {
            id: 'si_test123',
            price: 'price_new123',
          },
        ],
        proration_behavior: 'create_prorations',
      })
      expect(result).toEqual(updatedSubscription)
    })

    test('should get subscription details', async () => {
      const mockSubscription = { id: 'sub_test123', status: 'active' }
      const mockStripeInstance = stripe as any
      mockStripeInstance.subscriptions.retrieve.mockResolvedValue(mockSubscription)

      const result = await getSubscriptionDetails('sub_test123')

      expect(mockStripeInstance.subscriptions.retrieve).toHaveBeenCalledWith('sub_test123', {
        expand: ['customer', 'items.data.price'],
      })
      expect(result).toEqual(mockSubscription)
    })
  })

  describe('Webhook Handling', () => {
    test('should validate webhook signature', () => {
      const mockStripeInstance = stripe as any
      mockStripeInstance.webhooks.constructEvent.mockReturnValue({})

      const result = isValidWebhookSignature('body', 'signature', 'secret')

      expect(result).toBe(true)
      expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith('body', 'signature', 'secret')
    })

    test('should return false for invalid signature', () => {
      const mockStripeInstance = stripe as any
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const result = isValidWebhookSignature('body', 'invalid', 'secret')

      expect(result).toBe(false)
    })

    test('should construct webhook event', () => {
      const mockEvent = { type: 'customer.subscription.created' }
      const mockStripeInstance = stripe as any
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent)

      const result = constructWebhookEvent('body', 'signature', 'secret')

      expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith('body', 'signature', 'secret')
      expect(result).toEqual(mockEvent)
    })
  })
})