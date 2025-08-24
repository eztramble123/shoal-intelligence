import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error('Invalid email or password')
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error('Please verify your email before signing in')
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        
        if (!isPasswordValid) {
          throw new Error('Invalid email or password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async signIn() {
      // Allow sign in
      return true
    },
    async session({ session, token, user }) {
      // Pass user ID to session
      if (session?.user) {
        // When using database sessions
        if (user) {
          session.user.id = user.id
        }
        // When using JWT sessions
        else if (token?.sub) {
          session.user.id = token.sub
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
  },
  session: {
    strategy: 'jwt', // Keep JWT for better performance with database adapter
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login', // Redirect errors back to login page
  },
}