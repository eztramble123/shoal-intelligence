import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
})

export const getStripeUrl = () => {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return url
}