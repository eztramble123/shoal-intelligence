#!/usr/bin/env node

/**
 * Script to create YC demo user in the database
 * Run with: npx tsx scripts/create-yc-demo.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createYCDemoUser() {
  const email = 'yc_demo@shoalintel.xyz'
  const password = 'ShoalDemo2025!'
  const name = 'YC Demo User'
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    
    if (existingUser) {
      console.log('✅ YC demo user already exists')
      
      // Update password and ensure email is verified
      const hashedPassword = await bcrypt.hash(password, 12)
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          emailVerified: new Date(),
          name,
          planType: 'pro', // Give them pro access
        },
      })
      
      console.log('✅ YC demo user password updated')
      return
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create the demo user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerified: new Date(), // Mark as verified
        planType: 'pro', // Give them pro access for demo
      },
    })
    
    console.log('✅ YC demo user created successfully!')
    console.log('Email:', email)
    console.log('Username: yc_demo')
    console.log('Password: ShoalDemo2025!')
    console.log('User ID:', user.id)
    
  } catch (error) {
    console.error('❌ Error creating YC demo user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createYCDemoUser()