import { NextRequest, NextResponse } from 'next/server'
import { stripe, constructWebhookEvent } from '@/lib/stripe'
import { createClient } from '@/lib/supabase'
import { updateUserSubscriptionTier } from '@/lib/subscription-utils'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Webhook event types we handle
const HANDLED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.trial_will_end',
] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = constructWebhookEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Log the event for debugging
    console.log(`Processing webhook event: ${event.type}`)

    const supabase = createClient()

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          await handleSubscriptionCreated(supabase, subscription, session)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabase, subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(supabase, invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(supabase, invoice)
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        await handleTrialWillEnd(supabase, subscription)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionCreated(
  supabase: any,
  subscription: Stripe.Subscription,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId
  if (!userId) {
    console.error('No userId in session metadata')
    return
  }

  const planName = session.metadata?.planName as 'basic' | 'pro'
  if (!planName) {
    console.error('No planName in session metadata')
    return
  }

  try {
    // Insert subscription record
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        plan_name: planName,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })

    if (insertError) {
      console.error('Error creating subscription record:', insertError)
      return
    }

    // Update user's subscription tier
    if (subscription.status === 'active') {
      await updateUserSubscriptionTier(userId, planName)
    }

    console.log(`Subscription created for user ${userId}: ${subscription.id}`)
  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error)
  }
}

async function handleSubscriptionUpdated(
  supabase: any,
  subscription: Stripe.Subscription
) {
  try {
    // Get the subscription record to find the user
    const { data: subData, error: fetchError } = await supabase
      .from('subscriptions')
      .select('user_id, plan_name')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (fetchError) {
      console.error('Error fetching subscription record:', fetchError)
      return
    }

    // Update subscription record
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date(),
      })
      .eq('stripe_subscription_id', subscription.id)

    if (updateError) {
      console.error('Error updating subscription record:', updateError)
      return
    }

    // Update user's subscription tier based on status
    if (subscription.status === 'active') {
      await updateUserSubscriptionTier(subData.user_id, subData.plan_name)
    } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
      // Check if user has any other active subscriptions
      const { data: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('plan_name')
        .eq('user_id', subData.user_id)
        .eq('status', 'active')
        .neq('stripe_subscription_id', subscription.id)

      if (!activeSubscriptions || activeSubscriptions.length === 0) {
        await updateUserSubscriptionTier(subData.user_id, 'free')
      }
    }

    console.log(`Subscription updated: ${subscription.id} - ${subscription.status}`)
  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error)
  }
}

async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  try {
    // Get the subscription record to find the user
    const { data: subData, error: fetchError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (fetchError) {
      console.error('Error fetching subscription record:', fetchError)
      return
    }

    // Update subscription status to canceled
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date(),
      })
      .eq('stripe_subscription_id', subscription.id)

    if (updateError) {
      console.error('Error updating subscription record:', updateError)
      return
    }

    // Check if user has any other active subscriptions
    const { data: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('plan_name')
      .eq('user_id', subData.user_id)
      .eq('status', 'active')
      .neq('stripe_subscription_id', subscription.id)

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      await updateUserSubscriptionTier(subData.user_id, 'free')
    }

    console.log(`Subscription deleted: ${subscription.id}`)
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error)
  }
}

async function handleInvoicePaymentSucceeded(
  supabase: any,
  invoice: Stripe.Invoice
) {
  if (!invoice.subscription) return

  try {
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    )
    await handleSubscriptionUpdated(supabase, subscription)
    
    console.log(`Invoice payment succeeded: ${invoice.id}`)
  } catch (error) {
    console.error('Error in handleInvoicePaymentSucceeded:', error)
  }
}

async function handleInvoicePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice
) {
  if (!invoice.subscription) return

  try {
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    )
    await handleSubscriptionUpdated(supabase, subscription)
    
    // TODO: Send notification to user about failed payment
    console.log(`Invoice payment failed: ${invoice.id}`)
  } catch (error) {
    console.error('Error in handleInvoicePaymentFailed:', error)
  }
}

async function handleTrialWillEnd(
  supabase: any,
  subscription: Stripe.Subscription
) {
  try {
    // Get the subscription record to find the user
    const { data: subData, error: fetchError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (fetchError) {
      console.error('Error fetching subscription record:', fetchError)
      return
    }

    // TODO: Send notification to user about trial ending
    console.log(`Trial will end for subscription: ${subscription.id}`)
  } catch (error) {
    console.error('Error in handleTrialWillEnd:', error)
  }
}