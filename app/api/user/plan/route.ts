import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { planType: true, planSelectedAt: true }
    })

    return NextResponse.json({
      planType: user?.planType || null,
      planSelectedAt: user?.planSelectedAt || null
    })
  } catch (error) {
    console.error('Error fetching user plan:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch plan',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { planType } = await request.json()

    if (!planType || !['free', 'pro'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    // Update user plan
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { 
        planType,
        planSelectedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      planType: user.planType,
      message: `Plan updated to ${planType}`
    })
  } catch (error) {
    console.error('Error updating user plan:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update plan',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}