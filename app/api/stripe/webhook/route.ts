import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

interface StripeSubscriptionWithPeriods extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        // Update user with subscription info
        await prisma.user.update({
          where: { stripeCustomerId: session.customer as string },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date((subscription as unknown as StripeSubscriptionWithPeriods).current_period_end * 1000),
          }
        })

        // Create subscription record
        await prisma.subscription.create({
          data: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: session.customer as string,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodStart: new Date((subscription as unknown as StripeSubscriptionWithPeriods).current_period_start * 1000),
            stripeCurrentPeriodEnd: new Date((subscription as unknown as StripeSubscriptionWithPeriods).current_period_end * 1000),
            status: subscription.status,
            userId: session.metadata?.userId || '',
          }
        })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Update user subscription info
        await prisma.user.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date((subscription as unknown as StripeSubscriptionWithPeriods).current_period_end * 1000),
          }
        })

        // Update subscription record
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodStart: new Date((subscription as unknown as StripeSubscriptionWithPeriods).current_period_start * 1000),
            stripeCurrentPeriodEnd: new Date((subscription as unknown as StripeSubscriptionWithPeriods).current_period_end * 1000),
            status: subscription.status,
          }
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Clear subscription info from user
        await prisma.user.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
          }
        })

        // Update subscription record status
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'canceled',
          }
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Update subscription status
        if ((invoice as unknown as { subscription?: string }).subscription) {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: (invoice as unknown as { subscription: string }).subscription },
            data: {
              status: 'past_due',
            }
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}