import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    const { priceId } = await request.json()

    return NextResponse.json({
      hasSession: !!session,
      userEmail: session?.user?.email,
      priceId: priceId,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY ? 'Present' : 'Missing',
      message: 'Debug info'
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}