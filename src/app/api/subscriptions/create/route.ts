import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, CreateSubscriptionParams } from '@/lib/stripe'
import { createClient } from '@/lib/supabase'
import { z } from 'zod'

const createSubscriptionSchema = z.object({
  planName: z.enum(['basic', 'pro']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate request body
    const body = await request.json()
    const { planName, successUrl, cancelUrl } = createSubscriptionSchema.parse(body)

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, plan_name, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Create checkout session using utility function
    const session = await createCheckoutSession({
      userId: user.id,
      email: userData.email,
      planName,
      successUrl,
      cancelUrl,
    })

    // Update user with Stripe customer ID if not already set
    if (!userData.stripe_customer_id && session.customer) {
      await supabase
        .from('users')
        .update({ stripe_customer_id: session.customer as string })
        .eq('id', user.id)
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })

  } catch (error) {
    console.error('Subscription creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}