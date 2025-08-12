import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
    }
    
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-07-30.basil',
      typescript: true,
    })
  }
  
  return stripeInstance
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe()
    return Reflect.get(instance, prop, instance)
  }
})

export const getStripeUrl = () => {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return url
}