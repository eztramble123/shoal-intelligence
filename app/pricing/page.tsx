'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { SpinningShoalLogo } from '@/components/spinning-shoal-logo'

export default function Pricing() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)

  // Check authentication and redirect to dashboard for early access
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    } else {
      // For early access, skip plan selection and go straight to dashboard
      router.push('/')
    }
  }, [session, status, router])

  const handleUpgradeClick = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: 'price_1RuKGCGGk1IM6dHdCOILBF7Z' }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert('No checkout URL received')
      }
    } catch {
      alert('Failed to create checkout session')
    } finally {
      setLoading(false)
    }
  }

  const handleFreeClick = async () => {
    setLoading(true)
    
    try {
      // Update user plan to free
      const response = await fetch('/api/user/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType: 'free' }),
      })

      if (response.ok) {
        // Redirect to dashboard
        router.push('/')
      } else {
        alert('Failed to select free plan')
      }
    } catch {
      alert('Failed to select free plan')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#14151C'
      }}>
        <SpinningShoalLogo size={48} />
      </div>
    )
  }

  // Don't render if not authenticated
  if (!session) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#14151C',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
      padding: '30px'
    }}>
        <div style={{ marginBottom: '50px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 15px 0', color: '#ffffff' }}>
            Choose Your Plan
          </h1>
          <p style={{ fontSize: '16px', color: '#9ca3af', maxWidth: '600px', margin: '0 auto' }}>
            Get access to advanced crypto analytics and intelligence. Start with our free tier or upgrade to Pro for unlimited access.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {/* Free Plan */}
          <div style={{
            background: '#1A1B1E',
            borderRadius: '16px',
            padding: '40px',
            border: '1px solid #212228',
            position: 'relative'
          }}>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 10px 0', color: '#ffffff' }}>
                Free
              </h2>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#ffffff', marginBottom: '5px' }}>
                $0
                <span style={{ fontSize: '16px', fontWeight: '400', color: '#9ca3af' }}>/month</span>
              </div>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                Basic analytics and limited access
              </p>
            </div>

            <ul style={{ 
              listStyle: 'none', 
              padding: '0', 
              margin: '0 0 40px 0',
              fontSize: '14px',
              color: '#ffffff'
            }}>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#10b981', marginRight: '10px' }}>✓</span>
                Basic token coverage analysis
              </li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#10b981', marginRight: '10px' }}>✓</span>
                Limited venture intelligence
              </li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#10b981', marginRight: '10px' }}>✓</span>
                Recent listings feed
              </li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', marginRight: '10px' }}>✗</span>
                <span style={{ color: '#6b7280' }}>Advanced analytics</span>
              </li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', marginRight: '10px' }}>✗</span>
                <span style={{ color: '#6b7280' }}>Real-time alerts</span>
              </li>
            </ul>

            <button
              onClick={handleFreeClick}
              disabled={loading}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#ffffff',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid #3a3b45',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#3a3b45'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = 'transparent'
              }}
            >
              {loading ? 'Processing...' : 'Continue with Free'}
            </button>
          </div>

          {/* Pro Plan */}
          <div style={{
            background: '#1A1B1E',
            borderRadius: '16px',
            padding: '40px',
            border: '2px solid #10b981',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#10b981',
              color: '#ffffff',
              padding: '6px 20px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              RECOMMENDED
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 10px 0', color: '#ffffff' }}>
                Pro
              </h2>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#ffffff', marginBottom: '5px' }}>
                $29.99
                <span style={{ fontSize: '16px', fontWeight: '400', color: '#9ca3af' }}>/month</span>
              </div>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                Advanced analytics and unlimited access
              </p>
            </div>

            <ul style={{ 
              listStyle: 'none', 
              padding: '0', 
              margin: '0 0 40px 0',
              fontSize: '14px',
              color: '#ffffff'
            }}>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#10b981', marginRight: '10px' }}>✓</span>
                Everything in Free
              </li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#10b981', marginRight: '10px' }}>✓</span>
                Advanced token matrix analysis
              </li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#10b981', marginRight: '10px' }}>✓</span>
                Complete venture intelligence
              </li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#10b981', marginRight: '10px' }}>✓</span>
                Real-time market alerts
              </li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#10b981', marginRight: '10px' }}>✓</span>
                Priority support
              </li>
            </ul>

            <button
              onClick={handleUpgradeClick}
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#6b7280' : '#10b981',
                color: '#ffffff',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#059669'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = '#10b981'
              }}
            >
              {loading ? 'Processing...' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '50px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <p>Cancel anytime &bull; 30-day money-back guarantee &bull; Secure payment with Stripe</p>
        </div>
    </div>
  )
}