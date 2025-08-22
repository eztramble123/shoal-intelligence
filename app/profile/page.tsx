'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { SharedLayout } from '@/components/shared-layout'
import { SpinningShoalLogo } from '@/components/spinning-shoal-logo'
import { Toast } from '@/components/ui/toast'
import Image from 'next/image'

const EXCHANGE_OPTIONS = [
  { value: 'binance', label: 'Binance' },
  { value: 'coinbase', label: 'Coinbase' },
  { value: 'kraken', label: 'Kraken' },
  { value: 'okx', label: 'OKX' },
  { value: 'bybit', label: 'Bybit' },
  { value: 'kucoin', label: 'KuCoin' },
  { value: 'huobi', label: 'Huobi' },
  { value: 'gate', label: 'Gate.io' },
  { value: 'mexc', label: 'MEXC' }
]

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [baseExchange, setBaseExchange] = useState('binance')
  interface UserProfileData {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    planType?: string | null;
    baseExchange?: string;
    createdAt?: Date | string;
  }
  
  const [userData, setUserData] = useState<UserProfileData | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) return
      
      setLoading(true)
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setUserData(data)
          setBaseExchange(data.baseExchange || 'binance')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [session])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ baseExchange }),
      })

      if (response.ok) {
        // Show success toast
        const exchangeLabel = EXCHANGE_OPTIONS.find(ex => ex.value === baseExchange)?.label || baseExchange
        setToast({ 
          message: `Trading preferences updated! Base exchange set to ${exchangeLabel}`, 
          type: 'success' 
        })
      } else {
        setToast({ 
          message: 'Failed to save settings. Please try again.', 
          type: 'error' 
        })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setToast({ 
        message: 'Failed to save settings. Please try again.', 
        type: 'error' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  // Show loading while checking auth
  if (status === 'loading' || loading) {
    return (
      <SharedLayout currentPage="profile">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <SpinningShoalLogo size={48} />
        </div>
      </SharedLayout>
    )
  }

  // Don't render if not authenticated
  if (!session) {
    return null
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <SharedLayout currentPage="profile">
      <div style={{
        padding: '30px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          margin: '0 0 30px 0', 
          color: '#ffffff' 
        }}>
          Profile & Settings
        </h1>

        {/* User Information */}
        <div style={{
          background: '#1A1B1E',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #212228',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '20px', 
            color: '#ffffff' 
          }}>
            User Information
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={64}
                height={64}
                style={{ borderRadius: '50%' }}
              />
            )}
            <div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                {session.user?.name || 'User'}
              </div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                {session.user?.email}
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            paddingTop: '16px',
            borderTop: '1px solid #2a2b35'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                Member Since
              </div>
              <div style={{ fontSize: '14px', color: '#ffffff' }}>
                {userData?.createdAt ? formatDate(userData.createdAt) : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                Account Type
              </div>
              <div style={{ fontSize: '14px', color: '#ffffff' }}>
                Google OAuth
              </div>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div style={{
          background: '#1A1B1E',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #212228',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '20px', 
            color: '#ffffff' 
          }}>
            Subscription
          </h2>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                Current Plan
              </div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: userData?.planType === 'pro' ? '#10b981' : '#ffffff',
                textTransform: 'capitalize'
              }}>
                {userData?.planType || 'Free'}
              </div>
            </div>
            {userData?.planType !== 'pro' && (
              <button
                onClick={() => router.push('/pricing')}
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>

        {/* Trading Preferences */}
        <div style={{
          background: '#1A1B1E',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #212228',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '20px', 
            color: '#ffffff' 
          }}>
            Trading Preferences
          </h2>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '14px', 
              color: '#9ca3af', 
              marginBottom: '8px' 
            }}>
              Base Exchange for Comparisons
            </label>
            <select
              value={baseExchange}
              onChange={(e) => setBaseExchange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#212228',
                border: '1px solid #2a2b35',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {EXCHANGE_OPTIONS.map(exchange => (
                <option key={exchange.value} value={exchange.value}>
                  {exchange.label}
                </option>
              ))}
            </select>
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280', 
              marginTop: '8px' 
            }}>
              This exchange will be used as the base for token coverage comparisons
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? '#6b7280' : '#10b981',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s ease'
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Account Actions */}
        <div style={{
          background: '#1A1B1E',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #212228'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '20px', 
            color: '#ffffff' 
          }}>
            Account Actions
          </h2>
          
          <button
            onClick={handleSignOut}
            style={{
              background: 'transparent',
              color: '#ef4444',
              padding: '10px 20px',
              borderRadius: '8px',
              border: '2px solid #ef4444',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef4444'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#ef4444'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </SharedLayout>
  )
}