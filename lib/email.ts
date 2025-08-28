import { randomBytes } from 'crypto'

// Email service disabled - returning mock success responses

// Generate secure random token
export const generateToken = (): string => {
  return randomBytes(32).toString('hex')
}

// Generate verification token with expiry
export const generateVerificationToken = () => {
  const token = generateToken()
  const expires = new Date()
  expires.setHours(expires.getHours() + 24) // 24 hour expiry
  return { token, expires }
}

// Generate password reset token with expiry
export const generatePasswordResetToken = () => {
  const token = generateToken()
  const expires = new Date()
  expires.setHours(expires.getHours() + 1) // 1 hour expiry
  return { token, expires }
}

// Send verification email
export const sendVerificationEmail = async () => {
  // Return success without actually sending email
  return { success: true }
}

// Send password reset email
export const sendPasswordResetEmail = async () => {
  // Return success without actually sending email
  return { success: true }
}

// Send welcome email
export const sendWelcomeEmail = async () => {
  // Return success without actually sending email
  return { success: true }
}