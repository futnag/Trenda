import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Stripe configuration constants
export const STRIPE_CONFIG = {
  currency: 'jpy',
  plans: {
    basic: {
      name: 'ベーシックプラン',
      price: 980,
      priceId: process.env.STRIPE_BASIC_PRICE_ID!,
      features: [
        '詳細分析無制限',
        '競合分析',
        'メール通知',
        '基本サポート',
      ],
    },
    pro: {
      name: 'プロプラン',
      price: 2980,
      priceId: process.env.STRIPE_PRO_PRICE_ID!,
      features: [
        'ベーシックプランの全機能',
        'API アクセス (10,000リクエスト/月)',
        'データエクスポート',
        'カスタムアラート',
        '優先サポート',
        '過去1年間のトレンド履歴',
      ],
    },
  },
} as const

export type SubscriptionTier = 'free' | 'basic' | 'pro'
export type SubscriptionStatus = 
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'

export interface SubscriptionData {
  id: string
  userId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  planName: SubscriptionTier
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateSubscriptionParams {
  userId: string
  email: string
  planName: SubscriptionTier
  successUrl: string
  cancelUrl: string
}

export interface SubscriptionUpdateParams {
  subscriptionId: string
  newPriceId: string
}

// Stripe utility functions
export async function createStripeCustomer(email: string, userId: string) {
  return await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })
}

export async function createCheckoutSession(params: CreateSubscriptionParams) {
  const { userId, email, planName, successUrl, cancelUrl } = params
  
  // Get or create customer
  let customerId: string
  
  // Try to find existing customer
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })
  
  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id
  } else {
    const customer = await createStripeCustomer(email, userId)
    customerId = customer.id
  }

  const priceId = STRIPE_CONFIG.plans[planName].priceId

  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planName,
    },
    subscription_data: {
      metadata: {
        userId,
        planName,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
  })
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
  if (cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  } else {
    return await stripe.subscriptions.cancel(subscriptionId)
  }
}

export async function reactivateSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

export async function updateSubscription(params: SubscriptionUpdateParams) {
  const { subscriptionId, newPriceId } = params
  
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
  })
}

export async function getSubscriptionDetails(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['customer', 'items.data.price'],
  })
}

// Webhook event handlers
export function isValidWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    stripe.webhooks.constructEvent(body, signature, secret)
    return true
  } catch (error) {
    return false
  }
}

export function constructWebhookEvent(body: string, signature: string, secret: string) {
  return stripe.webhooks.constructEvent(body, signature, secret)
}