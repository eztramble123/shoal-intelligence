'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signIn } from "next-auth/react"
import Image from "next/image"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle URL parameters for messages
  useEffect(() => {
    const error = searchParams.get('error')
    const verified = searchParams.get('verified')
    const message = searchParams.get('message')

    if (error) {
      setError(decodeURIComponent(error))
    }
    if (verified === 'true' && message) {
      setMessage(decodeURIComponent(message))
    }
    if (message && !verified) {
      setMessage(decodeURIComponent(message))
    }
  }, [searchParams])

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/pricing' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      setLoading(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        router.push('/pricing')
      }
    } catch (error) {
      setError('An error occurred during sign in')
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
      className={cn("", className)} 
      {...props}
      style={{
        minHeight: '100vh',
        background: '#14151C',
        display: 'flex',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif'
      }}
    >
      {/* Left Panel - Login Form */}
      <div 
        className="lg:flex-1"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          minWidth: '0',
          minHeight: '100vh',
          position: 'relative'
        }}>
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
            <div style={{
              position: 'relative',
              marginBottom: '8px'
            }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#ffffff',
                lineHeight: '1.2',
                position: 'relative',
                zIndex: 1
              }}>
                Sign in
              </h1>
            </div>
            <p style={{
              fontSize: '14px',
              color: '#9ca3af',
              marginBottom: '0'
            }}>
              New user?{' '}
              <Link href="/register" style={{
                color: '#667eea',
                textDecoration: 'underline'
              }}>
                Sign up for free
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

          {message && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #dcfce7',
              color: '#166534',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div style={{ marginBottom: '24px' }}>
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
              <div style={{ marginBottom: '8px' }}>
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <input type="checkbox" id="stay-signed-in" style={{
                    accentColor: '#10b981'
                  }} />
                  <label htmlFor="stay-signed-in" style={{
                    fontSize: '14px',
                    color: '#9ca3af',
                    cursor: 'pointer'
                  }}>
                    Stay signed in
                  </label>
                </div>
                <Link href="/forgot-password" style={{
                  fontSize: '14px',
                  color: '#9ca3af',
                  textDecoration: 'none'
                }}>
                  Forgot your password?
                </Link>
              </div>
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
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                flex: 1,
                height: '1px',
                background: '#3a3d4a'
              }}></div>
              <span style={{
                fontSize: '14px',
                color: '#9ca3af'
              }}>
                or
              </span>
              <div style={{
                flex: 1,
                height: '1px',
                background: '#3a3d4a'
              }}></div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleSignIn}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2a2d3a',
                border: '1px solid #3a3d4a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.3s ease'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Sign in with google
            </Button>
          </form>
        </div>
      </div>

      {/* Right Panel - Code Shell Visual */}
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