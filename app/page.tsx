'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SharedLayout } from '@/components/shared-layout';
import { Skeleton } from '@/components/skeleton';
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

  // Data fetching functions
  const fetchParityData = async () => {
    try {
      setParityLoading(true);
      const response = await fetch('/api/parity');
      if (!response.ok) {
        throw new Error('Failed to fetch parity data');
      }
      const data = await response.json();
      setParityData(data);
      setBaseExchange(data.baseExchange || 'binance');
      setParityError(null);
    } catch (error) {
      console.error('Parity data error:', error);
      setParityError(error instanceof Error ? error.message : 'Failed to fetch parity data');
    } finally {
      setParityLoading(false);
    }
  };

  const fetchFundingData = async () => {
    try {
      setFundingLoading(true);
      const response = await fetch('/api/funding');
      if (!response.ok) {
        throw new Error('Failed to fetch funding data');
      }
      const data = await response.json();
      setFundingData(data);
      setFundingError(null);
    } catch (error) {
      console.error('Funding data error:', error);
      setFundingError(error instanceof Error ? error.message : 'Failed to fetch funding data');
    } finally {
      setFundingLoading(false);
    }
  };

  const fetchListingsData = async () => {
    try {
      setListingsLoading(true);
      const response = await fetch('/api/listings?period=30d&trends=true');
      if (!response.ok) {
        throw new Error('Failed to fetch listings data');
      }
      const data = await response.json();
      setListingsData(data);
      setListingsError(null);
    } catch (error) {
      console.error('Listings data error:', error);
      setListingsError(error instanceof Error ? error.message : 'Failed to fetch listings data');
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
      } catch (error) {
        console.error('Error checking user plan:', error);
        // If there's an error, still allow access but log it
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
        background: '#14151C',
        color: '#9ca3af'
      }}>
        Loading...
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
            Main Page
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
              <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
                Token coverage vs {baseExchange.charAt(0).toUpperCase() + baseExchange.slice(1)}
              </div>
              
              <div style={{ marginTop: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '14px', color: '#ffffff' }}>Coverage Rate</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
{parityLoading ? '...' : parityError ? 'Error' : `${Math.round(parityData?.coverageOverview?.averageCoverage || 0)}%`}
                  </div>
                </div>
                <div style={{ flex: 1, background: '#1a1b23', borderRadius: '8px', height: '8px', position: 'relative' }}>
                  <div style={{ 
                    width: `${parityLoading ? 0 : Math.round(parityData?.coverageOverview?.averageCoverage || 0)}%`, 
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
                  <span style={{ fontSize: '14px', color: '#ffffff' }}>Missing Tokens</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
{parityLoading ? '...' : parityError ? '—' : (parityData?.coverageOverview?.tokensMissing || 0)}
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
{parityLoading ? '...' : parityError ? '—' : (parityData?.coverageOverview?.exclusiveListings || 0)}
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
                  parityData?.tokens?.slice(0, 2).map((token, index) => (
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
            </div>
          </div>

          {/* Venture Intelligence */}
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
              {fundingLoading ? (
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
                  
                  <div style={{ height: '150px', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Skeleton height="100%" width="100%" borderRadius="8px" />
                  </div>
                  
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ padding: '12px 0', borderBottom: '1px solid #2a2b35' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Skeleton height="14px" width="100px" />
                        <Skeleton height="14px" width="40px" />
                      </div>
                    </div>
                    <div style={{ padding: '12px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Skeleton height="14px" width="80px" />
                        <Skeleton height="14px" width="50px" />
                      </div>
                    </div>
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
                        value: fundingError ? 'Error' : (fundingData?.last30Days?.totalRaised || '$0'), 
                        isGreen: true 
                      },
                      { 
                        label: 'Active Deals (30d)', 
                        value: fundingError ? '—' : (fundingData?.last30Days?.dealCount || 0).toString(), 
                        isGreen: false 
                      },
                      { 
                        label: 'Avg Round (30d)', 
                        value: fundingError ? 'Error' : (fundingData?.last30Days?.avgRoundSize || '$0'), 
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
                  <div style={{ height: '150px', position: 'relative', marginTop: '20px' }}>
                    <canvas 
                      ref={el => { canvasRefs.current.ventureChart = el; }}
                      id="ventureChart" 
                      style={{ width: '100%', height: '100%' }}
                    ></canvas>
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    {fundingError ? (
                  <div style={{ padding: '12px 0' }}>
                    <span style={{ fontSize: '14px', color: '#ef4444' }}>Unable to load announcement data</span>
                  </div>
                ) : (
                  (() => {
                    // Filter for last 90 days
                    const ninetyDaysAgo = new Date();
                    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                    const recent90DayRounds = (fundingData?.latestRounds || [])
                      .filter(round => round.date >= ninetyDaysAgo)
                      .slice(0, 2);
                    
                    return recent90DayRounds.length > 0 ? (
                      recent90DayRounds.map((round, index) => (
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
                            {round.name}
                            <span style={{ color: '#9ca3af', fontSize: '12px', marginLeft: '6px' }}>
                              {round.round}
                            </span>
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                            {round.amountDisplay}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '12px 0' }}>
                        <span style={{ fontSize: '14px', color: '#9ca3af' }}>No recent announcements</span>
                      </div>
                    );
                  })()
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
                View Full Report →
              </span>
                </>
              )}
            </div>
          </div>

          {/* Recent Listings */}
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
                      value: listingsError ? '—' : (listingsData?.last30Days?.totalNewListings || 0).toString(), 
                      isGreen: true 
                    },
                    { 
                      label: 'Top Recent Listed', 
                      value: listingsError ? '—' : (listingsData?.fastestGrowing?.[0]?.symbol || 'N/A'), 
                      isGreen: false 
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
                      <span style={{ fontSize: '14px', color: '#ffffff' }}>{stat.label}</span>
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
                ) : (
                  (listingsData?.fastestGrowing?.slice(0, 3) || []).map((listing, index) => (
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
                  )) || (
                    <div style={{ padding: '12px 0' }}>
                      <span style={{ fontSize: '14px', color: '#9ca3af' }}>No listing data available</span>
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
                View Live Feed →
              </span>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}