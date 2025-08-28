import { Resend } from 'resend'
import { randomBytes } from 'crypto'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Email templates
const emailTemplates = {
  verification: (verificationUrl: string) => ({
    subject: 'Verify your email - Shoal Intelligence',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Shoal Intelligence</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for signing up! Please click the button below to verify your email address and complete your registration.</p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
              <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
              <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
            </div>
            <div class="footer">
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p>© ${new Date().getFullYear()} Shoal Intelligence. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to Shoal Intelligence!
      
      Please verify your email address by clicking the link below:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, you can safely ignore this email.
    `,
  }),

  passwordReset: (resetUrl: string) => ({
    subject: 'Reset your password - Shoal Intelligence',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            .warning { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 10px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password. Click the button below to create a new password.</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
              </div>
            </div>
            <div class="footer">
              <p>For security reasons, this link can only be used once.</p>
              <p>© ${new Date().getFullYear()} Shoal Intelligence. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      We received a request to reset your password. Click the link below to create a new password:
      ${resetUrl}
      
      This link will expire in 1 hour and can only be used once.
      
      If you didn't request a password reset, please ignore this email and your password will remain unchanged.
    `,
  }),

  welcome: (userName: string) => ({
    subject: 'Welcome to Shoal Intelligence',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .feature { margin: 15px 0; padding: 15px; background: white; border-radius: 5px; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Shoal Intelligence!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName || 'there'},</h2>
              <p>Your email has been verified and your account is now active. Here's what you can do next:</p>
              
              <div class="feature">
                <h3>📊 Explore Market Data</h3>
                <p>Access comprehensive digital asset market intelligence and analytics.</p>
              </div>
              
              <div class="feature">
                <h3>🔍 Track Listings</h3>
                <p>Monitor token listings across multiple exchanges in real-time.</p>
              </div>
              
              <div class="feature">
                <h3>💰 Analyze Funding Trends</h3>
                <p>Stay updated with the latest funding trends in the crypto space.</p>
              </div>
              
              <a href="${process.env.NEXTAUTH_URL}/pricing" class="button">Get Started</a>
            </div>
            <div class="footer">
              <p>Need help? Contact our support team at support@shoalintelligence.com</p>
              <p>© ${new Date().getFullYear()} Shoal Intelligence. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to Shoal Intelligence!
      
      Hi ${userName || 'there'},
      
      Your email has been verified and your account is now active.
      
      Get started at: ${process.env.NEXTAUTH_URL}/pricing
      
      Need help? Contact our support team at support@shoalintelligence.com
    `,
  }),
}

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
export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`
  const template = emailTemplates.verification(verificationUrl)

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'noreply@shoalintelligence.com',
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { success: false, error }
  }
}

// Send password reset email
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
  const template = emailTemplates.passwordReset(resetUrl)

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'noreply@shoalintelligence.com',
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return { success: false, error }
  }
}

// Send welcome email
export const sendWelcomeEmail = async (email: string, name?: string) => {
  const template = emailTemplates.welcome(name || '')

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'noreply@shoalintelligence.com',
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return { success: false, error }
  }
}