'use client'

import { useState } from 'react'

interface UpgradeButtonProps {
  priceId: string
  text?: string
}

export function UpgradeButton({ priceId, text = 'Upgrade to Pro' }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    console.log('Upgrade button clicked, priceId:', priceId)
    setLoading(true)

    try {
      console.log('Making request to /api/stripe/checkout...')
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (data.url) {
        console.log('Redirecting to Stripe checkout:', data.url)
        window.location.href = data.url
      } else {
        console.error('No checkout URL received')
        alert('No checkout URL received')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to create checkout session: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      style={{
        background: loading ? '#6b7280' : '#10b981',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '600',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.3s ease',
      }}
      onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#059669')}
      onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#10b981')}
    >
      {loading ? 'Loading...' : text}
    </button>
  )
}