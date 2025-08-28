import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendWelcomeEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        new URL('/login?error=Invalid verification link', request.url)
      )
    }

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL('/login?error=Invalid or expired verification link', request.url)
      )
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      })
      
      return NextResponse.redirect(
        new URL('/login?error=Verification link has expired. Please register again.', request.url)
      )
    }

    // Find user by email from token
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=User not found', request.url)
      )
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        emailVerified: new Date(),
        planType: 'free', // Set to free plan after verification
      },
    })

    // Delete used verification token
    await prisma.verificationToken.delete({
      where: { token },
    })

    // Send welcome email (don't block the response if it fails)
    sendWelcomeEmail(user.email, user.name || undefined).catch(error => {
      console.error('Failed to send welcome email:', error)
    })

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL('/login?verified=true&message=Email verified successfully! You can now sign in.', request.url)
    )

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(
      new URL('/login?error=An error occurred during verification', request.url)
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Handle POST request for resending verification email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        message: 'If an account with this email exists and is unverified, a new verification email has been sent.',
      })
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const { randomBytes } = await import('crypto')
    const token = randomBytes(32).toString('hex')
    const expires = new Date()
    expires.setHours(expires.getHours() + 24)

    // Delete existing tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    })

    // Create new token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    })

    // Send verification email
    const { sendVerificationEmail } = await import('@/lib/email')
    await sendVerificationEmail(user.email, token)

    return NextResponse.json({
      message: 'New verification email sent successfully.',
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}