import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      // If user exists but email not verified, resend verification
      if (!existingUser.emailVerified) {
        const { token, expires } = generateVerificationToken()
        
        await prisma.verificationToken.upsert({
          where: {
            identifier_token: {
              identifier: existingUser.email,
              token: token,
            },
          },
          update: {
            expires,
          },
          create: {
            identifier: existingUser.email,
            token,
            expires,
          },
        })

        await sendVerificationEmail()
        
        return NextResponse.json({
          message: 'Account exists but not verified. New verification email sent.',
          requiresVerification: true,
        })
      }

      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
        planType: 'pending',
      },
    })

    // Generate verification token
    const { token, expires } = generateVerificationToken()
    
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    })

    // Send verification email
    const emailResult = await sendVerificationEmail()
    
    if (!emailResult.success) {
      // Continue registration even if email fails - user can request new verification
    }

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      requiresVerification: true,
    })

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}