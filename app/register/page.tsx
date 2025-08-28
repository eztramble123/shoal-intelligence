'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validate form
    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || null,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Registration successful! Please check your email to verify your account.')
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?message=Please check your email to verify your account')
        }, 3000)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#14151C',
        display: 'flex',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif'
      }}
    >
      {/* Left Panel - Registration Form */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          minWidth: '0',
          minHeight: '100vh',
          position: 'relative'
        }}
      >
        {/* Purple hue background filling entire left panel */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0
        }}>
          <Image 
            src="/purple_hue.png" 
            alt="" 
            fill
            style={{
              objectFit: 'cover',
              opacity: 0.6
            }}
          />
        </div>
        
        {/* Shoal Logo at Top Left Corner */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 2
        }}>
          <Image src="/real_shoal.png" alt="Shoal" width={35} height={10} style={{ height: 'auto', width: '35px' }} />
        </div>
        
        <div style={{ 
          width: '100%', 
          maxWidth: '400px',
          background: 'transparent',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            marginBottom: '32px',
            textAlign: 'left'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: '8px',
              lineHeight: '1.2'
            }}>
              Create Account
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#9ca3af',
              marginBottom: '0'
            }}>
              Already have an account?{' '}
              <Link href="/login" style={{
                color: '#667eea',
                textDecoration: 'underline'
              }}>
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #dcfce7',
              color: '#166534',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div style={{ marginBottom: '16px' }}>
              <Input
                type="text"
                name="name"
                placeholder="Full Name (optional)"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#2a2d3a',
                  border: '1px solid #3a3d4a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#2a2d3a',
                  border: '1px solid #3a3d4a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Input
                type="password"
                name="password"
                placeholder="Password (min 8 characters)"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#2a2d3a',
                  border: '1px solid #3a3d4a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#2a2d3a',
                  border: '1px solid #3a3d4a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#4a5568' : '#667eea',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '24px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#5568d3'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = '#667eea'
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              By creating an account, you agree to our{' '}
              <a href="#" style={{ color: '#667eea', textDecoration: 'underline' }}>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" style={{ color: '#667eea', textDecoration: 'underline' }}>
                Privacy Policy
              </a>
            </p>
          </form>
        </div>
      </div>

      {/* Right Panel - Same as login */}
      <div 
        className="hidden lg:flex"
        style={{
          flex: '1',
          position: 'relative',
          background: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          overflow: 'hidden'
        }}>
        {/* Background Image - Code Shell at Lower Right */}
        <div style={{
          position: 'absolute',
          top: '350px',
          left: '40px',
          width: '600px',
          height: '500px'
        }}>
          <Image 
            src="/ASCII.png" 
            alt="Code Shell" 
            width={600}
            height={500}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: 0.5
            }}
          />
        </div>

        {/* Gradient Overlay for Better Visibility */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.3) 60%, transparent 100%)',
          zIndex: 2
        }} />

        {/* Partners Logo Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3
        }}>
          <Image 
            src="/login_partners.png" 
            alt="Partners" 
            width={400}
            height={40}
            style={{
              width: 'auto',
              height: '40px',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Text Above Partners */}
        <div style={{
          position: 'absolute',
          bottom: '180px',
          left: '40px',
          right: '40px',
          textAlign: 'center',
          zIndex: 4
        }}>
          <p style={{
            fontSize: '14px',
            color: '#ffffff',
            lineHeight: '1.6',
            fontWeight: '400',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            From experts who simplify complex digital asset projects, helping teams overcome challenges and realize bold innovations.
          </p>
        </div>
      </div>
    </div>
  )
}