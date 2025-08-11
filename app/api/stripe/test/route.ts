import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    // Test Stripe connection
    const prices = await stripe.prices.list({
      limit: 1
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stripe connection working',
      pricesCount: prices.data.length
    })
  } catch (error) {
    console.error('Stripe test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}