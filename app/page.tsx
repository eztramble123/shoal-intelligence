'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SharedLayout } from '@/components/shared-layout';
import { Skeleton } from '@/components/skeleton';
import { SpinningShoalLogo } from '@/components/spinning-shoal-logo';
import ErrorBoundary, { DashboardErrorFallback } from '@/components/error-boundary';
import { ErrorState } from '@/components/error-states';
import { withRetry, isNetworkError } from '@/lib/error-utils';
import { ParityDashboardData } from '@/app/types/parity';
import { FundingDashboardData } from '@/app/types/funding';
import { ListingsDashboardData } from '@/app/types/listings';

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  
  // Data state
  const [parityData, setParityData] = useState<ParityDashboardData | null>(null);
  const [fundingData, setFundingData] = useState<FundingDashboardData | null>(null);
  const [listingsData, setListingsData] = useState<ListingsDashboardData | null>(null);
  const [baseExchange, setBaseExchange] = useState<string>('binance');
  
  // Loading states
  const [parityLoading, setParityLoading] = useState(true);
  const [fundingLoading, setFundingLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(true);
  
  // Error states
  const [parityError, setParityError] = useState<string | null>(null);
  const [fundingError, setFundingError] = useState<string | null>(null);
  const [listingsError, setListingsError] = useState<string | null>(null);

  // Enhanced data fetching functions with better error handling and retry logic
  const fetchParityData = async () => {
    try {
      setParityLoading(true);
      setParityError(null);
      
      const data = await withRetry(async () => {
        const response = await fetch('/api/parity', {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch parity data`);
        }
        
        return response.json();
      }, 3, 1000);
      
      setParityData(data);
      setBaseExchange(data.baseExchange || 'binance');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch parity data';
      
      // Check if it's a network error
      if (isNetworkError(error)) {
        setParityError('Network connection failed. Please check your internet connection and try again.');
      } else if (error instanceof Error && error.message.includes('timeout')) {
        setParityError('Request timed out. The service might be experiencing high load.');
      } else {
        setParityError(errorMessage);
      }
    } finally {
      setParityLoading(false);
    }
  };

  const fetchFundingData = async () => {
    try {
      setFundingLoading(true);
      setFundingError(null);
      
      const data = await withRetry(async () => {
        const response = await fetch('/api/funding', {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch funding data`);
        }
        
        return response.json();
      }, 3, 1000);
      
      setFundingData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch funding data';
      
      if (isNetworkError(error)) {
        setFundingError('Network connection failed. Please check your internet connection and try again.');
      } else if (error instanceof Error && error.message.includes('timeout')) {
        setFundingError('Request timed out. The service might be experiencing high load.');
      } else {
        setFundingError(errorMessage);
      }
    } finally {
      setFundingLoading(false);
    }
  };

  const fetchListingsData = async () => {
    try {
      setListingsLoading(true);
      setListingsError(null);
      
      const data = await withRetry(async () => {
        const response = await fetch('/api/listings?period=30d&trends=true', {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch listings data`);
        }
        
        return response.json();
      }, 3, 1000);
      
      setListingsData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch listings data';
      
      if (isNetworkError(error)) {
        setListingsError('Network connection failed. Please check your internet connection and try again.');
      } else if (error instanceof Error && error.message.includes('timeout')) {
        setListingsError('Request timed out. The service might be experiencing high load.');
      } else {
        setListingsError(errorMessage);
      }
    } finally {
      setListingsLoading(false);
    }
  };

  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchParityData(),
      fetchFundingData(),
      fetchListingsData()
    ]);
  }, []);

  // Check authentication and plan selection
  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/login'); // Redirect to login if not authenticated
      return;
    }

    // Check if user has selected a plan
    const checkUserPlan = async () => {
      try {
        const response = await fetch('/api/user/plan');
        const data = await response.json();
        
        if (!data.planType) {
          // User hasn't selected a plan, redirect to pricing
          router.push('/pricing');
        }
      } catch {
        // If there's an error, still allow access
      }
    };

    checkUserPlan();
  }, [session, status, router]);

  const drawMiniChart = (canvasId: string, color: string, trend: 'up' | 'down' | 'neutral' = 'neutral') => {
    const canvas = canvasRefs.current[canvasId];
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = canvas.offsetWidth + 'px';
    canvas.style.height = canvas.offsetHeight + 'px';
    ctx.scale(2, 2);

    // Generate deterministic data with trend to avoid hydration mismatch
    const points = 50;
    const data = [];
    let lastValue = 50;
    
    // Predefined changes to avoid Math.random() hydration issues
    const predefinedChanges = [
      3.2, -1.8, 2.1, -3.5, 1.7, -2.3, 4.1, -0.9, 2.8, -1.4,
      1.6, -2.7, 3.3, -1.1, 2.4, -3.8, 1.9, -1.6, 2.7, -2.1,
      3.6, -1.3, 2.2, -2.9, 1.8, -3.2, 2.5, -1.7, 3.1, -2.4,
      1.4, -2.6, 3.4, -1.2, 2.3, -3.1, 2.0, -1.9, 2.8, -2.2,
      3.7, -1.5, 2.6, -2.8, 1.5, -3.4, 2.9, -1.0, 3.0, -2.5
    ];
    
    for (let i = 0; i < points; i++) {
      const change = predefinedChanges[i] || 0;
      const trendFactor = trend === 'up' ? 0.2 : trend === 'down' ? -0.2 : 0;
      lastValue = Math.max(20, Math.min(80, lastValue + change + trendFactor));
      data.push(lastValue);
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Draw the line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    const stepX = canvas.offsetWidth / (points - 1);
    data.forEach((value, i) => {
      const x = i * stepX;
      const y = canvas.offsetHeight - (value / 100) * canvas.offsetHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Add gradient fill for main charts only
    if (canvasId === 'coverageChart' || canvasId === 'ventureChart') {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight);
      gradient.addColorStop(0, color + '30');
      gradient.addColorStop(1, color + '00');
      
      ctx.lineTo(canvas.offsetWidth, canvas.offsetHeight);
      ctx.lineTo(0, canvas.offsetHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  };

  useEffect(() => {
    // Only fetch data if authenticated
    if (status === 'loading' || !session) {
      return;
    }
    
    // Initial data fetch
    fetchAllData();
    
    // Set up polling for real-time updates (30 seconds)
    const pollInterval = setInterval(fetchAllData, 30000);
    
    // Initialize charts after a delay
    const chartTimeout = setTimeout(() => {
      drawMiniChart('coverageChart', '#10b981', 'up');
      drawMiniChart('ventureChart', '#3b82f6', 'neutral');
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(chartTimeout);
    };
  }, [fetchAllData, session, status]);

  const navigate = (page: string) => {
    if (page === 'dashboard') {
      router.push('/');
    } else {
      router.push(`/${page}`);
    }
  };



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
    );
  }

  // Don't render dashboard if not authenticated
  if (!session) {
    return null;
  }

  return (
    <SharedLayout currentPage="dashboard">
      <div style={{ 
        padding: '30px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 10px 0', color: '#ffffff' }}>
            Home Screen
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            Crypto analytics dashboard
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '30px',
          marginBottom: '30px'
        }}>
          {/* Listings Parity Analysis */}
          <ErrorBoundary fallback={DashboardErrorFallback}>
            <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#ffffff' }}>
              Listings Parity Analysis
            </h2>
            <div style={{
              background: '#1A1B1E',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #212228',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              height: 'fit-content'
            }}
            onClick={() => navigate('token-matrix')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.borderColor = '#3a3b45';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#212228';
            }}
            >
              {parityError ? (
                <ErrorState
                  error={parityError}
                  onRetry={fetchParityData}
                  variant="compact"
                />
              ) : (
                <>
                  <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
                    {baseExchange.charAt(0).toUpperCase() + baseExchange.slice(1)} listing opportunities vs other exchanges
                  </div>
                  
                  <div style={{ marginTop: '20px', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ fontSize: '14px', color: '#ffffff' }}>Average Market Coverage</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                        {parityLoading ? '...' : parityData?.coverageOverview?.averageCoverage ? 
                          `${Math.round(Number(parityData.coverageOverview.averageCoverage))}%` : 
                          'No data'}
                  </div>
                </div>
                <div style={{ flex: 1, background: '#1a1b23', borderRadius: '8px', height: '8px', position: 'relative' }}>
                  <div style={{ 
                    width: `${parityLoading ? 0 : parityData?.coverageOverview?.averageCoverage ? 
                      Math.round(Number(parityData.coverageOverview.averageCoverage)) : 0}%`, 
                    background: '#10b981', 
                    height: '100%', 
                    borderRadius: '8px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #2a2b35',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1a1b23';
                  e.currentTarget.style.paddingLeft = '10px';
                  e.currentTarget.style.margin = '0 -10px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.paddingLeft = '0';
                  e.currentTarget.style.margin = '0';
                }}
                >
                  <span style={{ fontSize: '14px', color: '#ffffff' }}>Opportunities for {baseExchange.charAt(0).toUpperCase() + baseExchange.slice(1)}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
{parityLoading ? '...' : parityError ? 'Error' : 
                      parityData?.coverageOverview?.tokensMissing ?? 'No data'}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1a1b23';
                  e.currentTarget.style.paddingLeft = '10px';
                  e.currentTarget.style.margin = '0 -10px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.paddingLeft = '0';
                  e.currentTarget.style.margin = '0';
                }}
                >
                  <span style={{ fontSize: '14px', color: '#ffffff' }}>Exclusive Listings</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
{parityLoading ? '...' : parityError ? 'Error' : 
                      parityData?.coverageOverview?.exclusiveListings ?? 'No data'}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #2a2b35' }}>
                {parityLoading ? (
                  <>
                    <div style={{ padding: '12px 0', borderBottom: '1px solid #2a2b35' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Skeleton height="14px" width="80px" />
                        <Skeleton height="14px" width="60px" />
                      </div>
                    </div>
                    <div style={{ padding: '12px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Skeleton height="14px" width="90px" />
                        <Skeleton height="14px" width="50px" />
                      </div>
                    </div>
                  </>
                ) : parityError ? (
                  <div style={{ padding: '12px 0' }}>
                    <span style={{ fontSize: '14px', color: '#ef4444' }}>Unable to load token data</span>
                  </div>
                ) : (
                  parityData?.tokens?.filter(token => {
                    // Only show tokens that are actually missing from the base exchange
                    const isOnBase = (() => {
                      switch (baseExchange.toLowerCase()) {
                        case 'binance': return token.exchanges.binance;
                        case 'coinbase': return token.exchanges.coinbase;
                        case 'kraken': return token.exchanges.kraken;
                        case 'okx': return token.exchanges.okx;
                        case 'bybit': return token.exchanges.bybit;
                        case 'kucoin': return token.exchanges.kucoin;
                        case 'huobi': return token.exchanges.huobi;
                        case 'gate.io': return token.exchanges.gate;
                        case 'mexc': return token.exchanges.mexc;
                        default: return false;
                      }
                    })();
                    return !isOnBase; // Only show tokens NOT on the base exchange
                  }).slice(0, 2).map((token, index) => (
                    <div key={token.symbol} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: index < 1 ? '1px solid #2a2b35' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1a1b23';
                      e.currentTarget.style.paddingLeft = '10px';
                      e.currentTarget.style.margin = '0 -10px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.paddingLeft = '0';
                      e.currentTarget.style.margin = '0';
                    }}
                    >
                      <span style={{ fontSize: '14px', color: '#ffffff' }}>
                        {token.symbol} <span style={{ color: '#9ca3af', fontSize: '12px' }}>({token.name})</span>
                        <span style={{ color: '#ef4444', fontSize: '10px', marginLeft: '6px' }}>• Not on {baseExchange.charAt(0).toUpperCase() + baseExchange.slice(1)}</span>
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{token.coverageRatio}</span>
                    </div>
                  )) || (
                    <div style={{ padding: '12px 0' }}>
                      <span style={{ fontSize: '14px', color: '#9ca3af' }}>No token data available</span>
                    </div>
                  )
                )}
              </div>

              <span style={{
                display: 'inline-block',
                marginTop: '16px',
                color: '#10b981',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                    View Full Matrix →
                  </span>
                </>
              )}
            </div>
          </div>
          </ErrorBoundary>

          {/* Venture Intelligence */}
          <ErrorBoundary fallback={DashboardErrorFallback}>
            <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#ffffff' }}>
              Venture Intelligence
            </h2>
            <div style={{
              background: '#1A1B1E',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #212228',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              height: 'fit-content'
            }}
            onClick={() => navigate('venture-intelligence')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.borderColor = '#3a3b45';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#212228';
            }}
            >
              {fundingError ? (
                <ErrorState
                  error={fundingError}
                  onRetry={fetchFundingData}
                  variant="compact"
                />
              ) : fundingLoading ? (
                <>
                  <Skeleton height="14px" width="180px" style={{ marginBottom: '20px' }} />
                  
                  <div style={{ marginTop: '20px' }}>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: index < 2 ? '1px solid #2a2b35' : 'none'
                      }}>
                        <Skeleton height="14px" width="120px" />
                        <Skeleton height="14px" width="60px" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
                    30-day fundraising activity
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    {[
                      { 
                        label: 'Total Raised (30d)', 
                        value: fundingError ? 'Error' : (fundingData?.last30Days?.totalRaised ?? 'No data'), 
                        isGreen: true 
                      },
                      { 
                        label: 'Deals Closed (30d)', 
                        value: fundingError ? 'Error' : 
                          fundingData?.last30Days?.dealCount?.toString() ?? 'No data', 
                        isGreen: false 
                      },
                      { 
                        label: 'Avg Round (30d)', 
                        value: fundingError ? 'Error' : (fundingData?.last30Days?.avgRoundSize ?? 'No data'), 
                        isGreen: false 
                      }
                    ].map((stat, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: index < 2 ? '1px solid #2a2b35' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#1a1b23';
                        e.currentTarget.style.paddingLeft = '10px';
                        e.currentTarget.style.margin = '0 -10px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.paddingLeft = '0';
                        e.currentTarget.style.margin = '0';
                      }}
                      >
                        <span style={{ fontSize: '14px', color: '#ffffff' }}>{stat.label}</span>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: '600',
                          color: stat.isGreen ? '#10b981' : '#ffffff'
                        }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
              <span style={{
                display: 'inline-block',
                marginTop: '16px',
                color: '#10b981',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                View Full Report →
              </span>
                </>
              )}
            </div>
          </div>
          </ErrorBoundary>

          {/* Recent Listings */}
          <ErrorBoundary fallback={DashboardErrorFallback}>
            <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#ffffff' }}>
              Recent Listings
            </h2>
            <div style={{
              background: '#1A1B1E',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #212228',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              height: 'fit-content'
            }}
            onClick={() => navigate('listings-feed')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.borderColor = '#3a3b45';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#212228';
            }}
            >
              {listingsError ? (
                <ErrorState
                  error={listingsError}
                  onRetry={fetchListingsData}
                  variant="compact"
                />
              ) : (
                <>
                  <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
                    Live listing activity feed
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    {listingsLoading ? (
                  Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: index < 1 ? '1px solid #2a2b35' : 'none'
                    }}>
                      <Skeleton height="14px" width="120px" />
                      <Skeleton height="14px" width="60px" />
                    </div>
                  ))
                ) : (
                  [
                    { 
                      label: 'New Listings (30D)', 
                      value: listingsError ? 'Error' : 
                        (listingsData?.last30Days?.totalNewListings?.toString() ?? 'No data'), 
                      isGreen: true 
                    },
                    { 
                      label: 'Top Recent Listed', 
                      value: listingsError ? 'Error' : (listingsData?.fastestGrowing?.[0]?.symbol ?? 'No data'), 
                      isGreen: false,
                      timeframe: listingsData?.fastestGrowing?.[0]?.timeframe
                    }
                  ].map((stat, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: index < 1 ? '1px solid #2a2b35' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1a1b23';
                      e.currentTarget.style.paddingLeft = '10px';
                      e.currentTarget.style.margin = '0 -10px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.paddingLeft = '0';
                      e.currentTarget.style.margin = '0';
                    }}
                    >
                      <span style={{ fontSize: '14px', color: '#ffffff' }}>
                        {stat.label}
                        {stat.timeframe && (
                          <span style={{ 
                            fontSize: '10px', 
                            color: '#6b7280', 
                            marginLeft: '6px',
                            fontWeight: '400'
                          }}>
                            ({stat.timeframe})
                          </span>
                        )}
                      </span>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: stat.isGreen ? '#10b981' : '#ffffff'
                      }}>{stat.value}</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{ marginTop: '30px' }}>
                {listingsLoading ? (
                  Array.from({ length: 3 }, (_, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: index < 2 ? '1px solid #2a2b35' : 'none'
                    }}>
                      <Skeleton height="14px" width="100px" />
                      <Skeleton height="14px" width="80px" />
                    </div>
                  ))
                ) : listingsError ? (
                  <div style={{ padding: '12px 0' }}>
                    <span style={{ fontSize: '14px', color: '#ef4444' }}>Unable to load listing data</span>
                  </div>
                ) : (listingsData?.fastestGrowing && listingsData.fastestGrowing.length > 0) ? (
                  <>
                    {listingsData.fastestGrowing.slice(0, 3).map((listing, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: index < 2 ? '1px solid #2a2b35' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1a1b23';
                    e.currentTarget.style.paddingLeft = '10px';
                    e.currentTarget.style.margin = '0 -10px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.paddingLeft = '0';
                    e.currentTarget.style.margin = '0';
                  }}
                  >
                    <span style={{ fontSize: '14px', color: '#ffffff' }}>
                      {listing.symbol} <small style={{ color: '#9ca3af' }}>{listing.symbol.replace('$', '')}</small>
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>{listing.exchanges}</span>
                  </div>
                  ))}
                  </>
                ) : (
                    <div style={{ padding: '12px 0' }}>
                      <span style={{ fontSize: '14px', color: '#9ca3af' }}>No listing data available</span>
                    </div>
                )}
              </div>
              <span style={{
                display: 'inline-block',
                marginTop: '16px',
                color: '#10b981',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                    View Live Feed →
                  </span>
                </>
              )}
            </div>
          </div>
          </ErrorBoundary>
        </div>
      </div>
    </SharedLayout>
  );
}