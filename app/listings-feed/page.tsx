'use client';

import { useState, useEffect, useCallback } from 'react';
import { SharedLayout } from '@/components/shared-layout';
import { Treemap, ResponsiveContainer } from 'recharts';
import { ListingsDashboardData } from '@/app/types/listings';
import { CardSkeleton, Skeleton } from '@/components/skeleton';

const RecentListingsTrackerFeed = () => {
  const [selectedExchange, setSelectedExchange] = useState('All Exchanges');
  const [selectedType, setSelectedType] = useState('All types');
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '90d' | 'ytd'>('30d');
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [listingsData, setListingsData] = useState<ListingsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch listings data
  const fetchListingsData = useCallback(async () => {
    try {
      const response = await fetch(`/api/listings?period=${selectedPeriod}&trends=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch listings data');
      }
      const data = await response.json();
      setListingsData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching listings data:', err);
      setError('Failed to load listings data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  // Initial load and 30-second polling
  useEffect(() => {
    setLoading(true); // Show loading when period changes
    fetchListingsData();
    
    if (liveUpdates) {
      const interval = setInterval(fetchListingsData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [liveUpdates, selectedPeriod, fetchListingsData]);


  // Get period-specific data first
  const getPeriodData = () => {
    if (!listingsData) return null;
    
    let data;
    switch (selectedPeriod) {
      case '30d':
        data = listingsData.last30Days;
        break;
      case '90d':
        data = listingsData.last90Days;
        break;
      case 'ytd':
        data = listingsData.yearToDate;
        break;
      default:
        data = listingsData.last30Days;
    }
    
    return data;
  };
  
  const periodData = getPeriodData();
  
  // Get data from API or use fallbacks
  // Filter all data based on selected period
  const getFilteredData = () => {
    if (!listingsData || !periodData) {
      return {
        tokenCards: [],
        treemapData: [],
        exchangeActivity: [],
        fastestGrowing: [],
        newestListings: [],
        liveListings: []
      };
    }
    
    // Use period-specific listings for all displays
    const periodListings = periodData.newListings || [];
    
    // Generate token cards from period-specific listings
    const tokenCards = periodListings
      .sort((a, b) => b.exchangesCount - a.exchangesCount)
      .slice(0, 8)
      .map(token => ({
        symbol: token.ticker,
        name: token.name,
        exchanges: token.exchanges,
        exchangeCount: token.exchangesCount,
        adoption24h: token.trendDisplay || 'NEW',
        momentum: token.momentum,
        momentumColor: token.momentumColor,
        listedOn: token.exchangesDisplay,
        lastUpdated: token.lastUpdatedDisplay,
        priceChange: token.priceChangePct24h,
        volume: token.volume24hDisplay
      }));
    
    // Generate treemap data from period-specific listings
    const treemapData = periodListings
      .sort((a, b) => b.exchangesCount - a.exchangesCount)
      .slice(0, 20)
      .map(token => ({
        name: token.ticker,
        value: token.exchangesCount,
        size: token.exchangesCount * 10,
        fill: token.momentumColor,
        changeType: token.priceChangePct24h && token.priceChangePct24h > 0 ? 'positive' as const : 
                    token.priceChangePct24h && token.priceChangePct24h < 0 ? 'negative' as const : 'neutral' as const,
        chartData: token.chartData,
        ticker: token.ticker,
        exchangesCount: token.exchangesCount
      }));
    
    // Calculate exchange activity from last 24 hours only (not period-specific)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const last24HourListings = listingsData?.processedListings?.filter(token => {
      const scrapedDate = token.scrapedAt instanceof Date ? token.scrapedAt : new Date(token.scrapedAt);
      return scrapedDate >= twentyFourHoursAgo;
    }) || [];
    
    const exchangeCount: Record<string, number> = {};
    last24HourListings.forEach(token => {
      token.exchanges.forEach(exchange => {
        exchangeCount[exchange] = (exchangeCount[exchange] || 0) + 1;
      });
    });
    
    const exchangeActivity = Object.entries(exchangeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([name, count]) => ({ name, count, status: 'new' as const }));
    
    // Fastest growing based on trend data
    const fastestGrowing = periodListings
      .filter(token => token.trendPercentage !== undefined && token.trendPercentage > 0)
      .sort((a, b) => (b.trendPercentage || 0) - (a.trendPercentage || 0))
      .slice(0, 4)
      .map(token => ({
        symbol: token.ticker,
        exchanges: token.trendDisplay || `+${token.exchangesCount} exchanges`,
        status: 'up' as const
      }));
    
    // Newest listings (most recently scraped within period)
    const newestListings = periodListings
      .sort((a, b) => {
        const dateA = a.scrapedAt instanceof Date ? a.scrapedAt : new Date(a.scrapedAt);
        const dateB = b.scrapedAt instanceof Date ? b.scrapedAt : new Date(b.scrapedAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 4)
      .map(token => {
        const scrapedDate = token.scrapedAt instanceof Date ? token.scrapedAt : new Date(token.scrapedAt);
        return {
          symbol: token.ticker,
          exchange: `on ${token.exchanges[0] || 'Unknown'}`,
          time: `${Math.floor((Date.now() - scrapedDate.getTime()) / (1000 * 60 * 60))}h ago`
        };
      });
    
    // Live listings feed from period-specific data
    const liveListings = periodListings
      .slice(0, 10)
      .map(token => {
        const scrapedDate = token.scrapedAt instanceof Date ? token.scrapedAt : new Date(token.scrapedAt);
        return {
          timestamp: scrapedDate.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          exchange: token.exchanges[0] || 'Unknown',
          asset: token.ticker,
          name: token.name,
          type: 'SPOT' as const,
          status: 'Live' as const,
          price: token.priceDisplay,
          sourceMessage: token.sourceMessage
        };
      });
    
    return {
      tokenCards,
      treemapData,
      exchangeActivity,
      fastestGrowing,
      newestListings,
      liveListings
    };
  };
  
  const { tokenCards, treemapData, exchangeActivity, fastestGrowing, newestListings, liveListings } = getFilteredData();
  
  // Generate adoption metrics from period data
  const adoptionMetrics = periodData ? [
    { title: `New Listings (${selectedPeriod.toUpperCase()})`, value: periodData.totalNewListings || 0 },
    { title: 'Top New Listing', value: periodData.topNewListings?.[0]?.ticker ? `${periodData.topNewListings[0].ticker} (${periodData.topNewListings[0].exchangesCount} exchanges)` : 'N/A' },
    { title: 'Period Coverage', value: selectedPeriod === 'ytd' ? 'Year to Date' : `Last ${selectedPeriod.replace('d', ' days')}` }
  ] : [
    { title: `New Listings (${selectedPeriod.toUpperCase()})`, value: '—' },
    { title: 'Top New Listing', value: '—' },
    { title: 'Period Coverage', value: selectedPeriod === 'ytd' ? 'Year to Date' : `Last ${selectedPeriod.replace('d', ' days')}` }
  ];

  const CustomTreemapContent = (props: {
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    value: number;
    fill: string;
    payload?: {
      chartData?: number[];
      exchangesCount?: number;
    };
  }) => {
    const { x, y, width, height, name, value, fill, payload } = props;
    const chartData = payload?.chartData || [];
    
    // Create sparkline points for the chart
    const createSparklinePoints = (data: number[]) => {
      if (!data.length) return '';
      
      const chartWidth = Math.max(0, width - 20);
      const chartHeight = Math.max(0, height * 0.3);
      const chartX = x + 10;
      const chartY = y + height - chartHeight - 10;
      
      const maxValue = Math.max(...data);
      const minValue = Math.min(...data);
      const range = maxValue - minValue || 1;
      
      return data.map((value, index) => {
        const pointX = chartX + (index / (data.length - 1)) * chartWidth;
        const pointY = chartY + chartHeight - ((value - minValue) / range) * chartHeight;
        return `${pointX},${pointY}`;
      }).join(' ');
    };
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          stroke="#212228"
          strokeWidth={1}
          style={{
            cursor: 'pointer'
          }}
        />
        {width > 80 && height > 50 && (
          <>
            {/* Name label */}
            <text
              x={x + width / 2}
              y={y + 20}
              textAnchor="middle"
              fill="white"
              stroke="none"
              fontSize={Math.min(12, width / 8)}
              fontWeight="500"
              style={{ fill: 'white' }}
            >
              {name}
            </text>
            
            {/* Exchange count */}
            <text
              x={x + width / 2}
              y={y + height / 2 - 5}
              textAnchor="middle"
              fill="white"
              stroke="none"
              fontSize={Math.min(16, width / 6)}
              fontWeight="700"
              style={{ fill: 'white' }}
            >
              {payload?.exchangesCount || Math.floor(value / 10)}
            </text>
            
            {/* Exchanges label */}
            <text
              x={x + width / 2}
              y={y + height / 2 + 12}
              textAnchor="middle"
              fill="white"
              stroke="none"
              fontSize={Math.min(10, width / 10)}
              fontWeight="400"
              style={{ fill: 'white', opacity: 0.8 }}
            >
              Exchanges
            </text>
            
            {/* Mini sparkline chart */}
            {chartData.length > 0 && width > 100 && height > 80 && (
              <polyline
                fill="none"
                stroke="#ffffff"
                strokeWidth={1.5}
                strokeOpacity={0.8}
                points={createSparklinePoints(chartData)}
              />
            )}
            
            {/* Status indicator */}
            <circle
              cx={x + 8}
              cy={y + 8}
              r={3}
              fill="#ffffff"
              opacity={0.8}
            />
          </>
        )}
        {width > 40 && height > 30 && width <= 80 && (
          <>
            {/* Simplified view for smaller rectangles */}
            <text
              x={x + width / 2}
              y={y + height / 2 - 5}
              textAnchor="middle"
              fill="white"
              stroke="none"
              fontSize={10}
              fontWeight="500"
              style={{ fill: 'white' }}
            >
              {name.split(' ')[0]}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="white"
              stroke="none"
              fontSize={12}
              fontWeight="700"
              style={{ fill: 'white' }}
            >
              {payload?.exchangesCount || Math.floor(value / 10)}
            </text>
          </>
        )}
      </g>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SharedLayout currentPage="listings-feed">
        <div style={{
          padding: '30px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif'
        }}>
          {/* Header Skeleton */}
          <div style={{ marginBottom: '30px' }}>
            <Skeleton height="24px" width="300px" style={{ marginBottom: '10px' }} />
            <Skeleton height="14px" width="450px" />
          </div>

          {/* Search and Filters Skeleton */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr auto',
            gap: '16px',
            marginBottom: '40px'
          }}>
            <Skeleton height="36px" width="100%" />
            <Skeleton height="36px" width="100%" />
            <Skeleton height="36px" width="100%" />
            <Skeleton height="36px" width="140px" />
          </div>

          {/* Two Column Layout Skeleton */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
            marginBottom: '40px'
          }}>
            {/* Left Column - Token Cards Skeleton */}
            <CardSkeleton>
              <Skeleton height="18px" width="150px" style={{ marginBottom: '20px' }} />
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
              }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{
                    background: '#13141a',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #2a2b35'
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <Skeleton height="16px" width="80px" style={{ marginBottom: '4px' }} />
                      <Skeleton height="14px" width="120px" />
                    </div>
                    <Skeleton height="12px" width="100%" style={{ marginBottom: '8px' }} />
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <Skeleton height="12px" width="60px" />
                      <Skeleton height="12px" width="50px" />
                    </div>
                  </div>
                ))}
              </div>
            </CardSkeleton>

            {/* Right Column - Treemap Skeleton */}
            <CardSkeleton>
              <Skeleton height="18px" width="180px" style={{ marginBottom: '20px' }} />
              <div style={{
                height: '300px',
                background: '#13141a',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '4px',
                padding: '8px'
              }}>
                {Array.from({ length: 8 }).map((_, i) => {
                  // Use predefined sizes to avoid hydration mismatch
                  const sizes = [
                    { width: '120px', height: '80px' },
                    { width: '100px', height: '70px' },
                    { width: '110px', height: '85px' },
                    { width: '90px', height: '60px' },
                    { width: '130px', height: '90px' },
                    { width: '80px', height: '55px' },
                    { width: '115px', height: '75px' },
                    { width: '95px', height: '65px' }
                  ];
                  const size = sizes[i] || sizes[0];
                  return (
                    <Skeleton
                      key={i}
                      width={size.width}
                      height={size.height}
                      borderRadius="4px"
                    />
                  );
                })}
              </div>
            </CardSkeleton>
          </div>

          {/* Metrics Row Skeleton */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i}>
                <Skeleton height="16px" width="120px" style={{ marginBottom: '16px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j}>
                      <Skeleton height="12px" width="100%" style={{ marginBottom: '4px' }} />
                      <Skeleton height="14px" width="60px" />
                    </div>
                  ))}
                </div>
              </CardSkeleton>
            ))}
          </div>

          {/* Live Feed Skeleton */}
          <CardSkeleton>
            <Skeleton height="18px" width="200px" style={{ marginBottom: '20px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#13141a',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Skeleton width="60px" height="14px" />
                    <Skeleton width="80px" height="14px" />
                    <Skeleton width="100px" height="14px" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Skeleton width="50px" height="14px" />
                    <Skeleton width="20px" height="20px" borderRadius="50%" />
                  </div>
                </div>
              ))}
            </div>
          </CardSkeleton>
        </div>
      </SharedLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <SharedLayout currentPage="listings-feed">
        <div style={{
          padding: '30px',
          textAlign: 'center',
          color: '#ef4444'
        }}>
          {error}
        </div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout currentPage="listings-feed">
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        padding: '30px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '30px'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 10px 0', color: '#ffffff' }}>
              Listings Tracker Feed
            </h1>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>
              Tracking new listings {selectedPeriod === 'ytd' ? 'Year to Date' : `from the last ${selectedPeriod.replace('d', ' days')}`}
            </p>
          </div>
          
          {/* Time Period Selector */}
          <div style={{
            display: 'flex',
            background: '#1A1B1E',
            borderRadius: '8px',
            border: '1px solid #212228',
            padding: '4px'
          }}>
            {(['30d', '90d', 'ytd'] as const).map((period) => {
              const isSelected = selectedPeriod === period;
              const periodLabels = {
                '30d': 'Last 30 Days',
                '90d': 'Last 90 Days', 
                'ytd': 'Year to Date'
              };
              
              return (
                <button
                  key={period}
                  onClick={() => {
                    setSelectedPeriod(period);
                    setLoading(true);
                  }}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    background: isSelected ? '#3b82f6' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: isSelected ? '#ffffff' : '#9ca3af',
                    fontSize: '14px',
                    fontWeight: isSelected ? '500' : '400',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading && !isSelected ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#2a2b35';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#9ca3af';
                    }
                  }}
                >
                  {loading && isSelected ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid transparent',
                        borderTop: '2px solid currentColor',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Loading...
                    </span>
                  ) : (
                    periodLabels[period]
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Adoption Map Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#ffffff' }}>
            Adoption Map ({selectedPeriod.toUpperCase()})
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '20px' }}>
            New Assets by Exchange Listings - {selectedPeriod === 'ytd' ? 'Year to Date' : `Last ${selectedPeriod.replace('d', ' days')}`}
          </p>

          {/* Token Cards Grid */}
          <div style={{ marginBottom: '30px' }}>
            {/* Top Row - 3 cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '16px'
            }}>
              {tokenCards.slice(0, 3).map((token, index) => (
                <div key={index} style={{
                  background: '#1A1B1E',
                  border: '1px solid #212228',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1e1f24';
                  e.currentTarget.style.borderColor = '#3a3b45';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1A1B1E';
                  e.currentTarget.style.borderColor = '#212228';
                }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                      {token.symbol}
                    </span>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                      {token.name}
                    </span>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                      • {token.exchangeCount} exchanges
                    </span>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                      Listed on:
                    </p>
                    <div 
                      style={{ position: 'relative' }}
                      onMouseEnter={(e) => {
                        if (token.exchanges.length > 10) {
                          const tooltip = e.currentTarget.querySelector('.custom-tooltip');
                          if (tooltip) {
                            (tooltip as HTMLElement).style.opacity = '1';
                            (tooltip as HTMLElement).style.visibility = 'visible';
                          }
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (token.exchanges.length > 10) {
                          const tooltip = e.currentTarget.querySelector('.custom-tooltip');
                          if (tooltip) {
                            (tooltip as HTMLElement).style.opacity = '0';
                            (tooltip as HTMLElement).style.visibility = 'hidden';
                          }
                        }
                      }}
                    >
                      <p 
                        style={{ 
                          fontSize: '12px', 
                          color: '#e4e4e7', 
                          lineHeight: '1.4',
                          cursor: token.exchanges.length > 10 ? 'pointer' : 'default'
                        }}
                      >
                        {token.exchanges.length > 10 
                          ? token.exchanges.slice(0, 10).join(', ') + '...'
                          : token.listedOn
                        }
                      </p>
                      {token.exchanges.length > 10 && (
                        <div 
                          className="custom-tooltip"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            right: '0',
                            background: '#13141a',
                            border: '1px solid #2a2b35',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '12px',
                            color: '#e4e4e7',
                            lineHeight: '1.4',
                            zIndex: 1000,
                            opacity: '0',
                            visibility: 'hidden',
                            transition: 'opacity 0.2s ease, visibility 0.2s ease',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            marginTop: '4px'
                          }}
                        >
                          <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            All {token.exchangeCount} Exchanges:
                          </div>
                          {token.listedOn}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '12px'
                  }}>
                    <span style={{ color: '#9ca3af' }}>
                      24h Adoption: <span style={{ color: '#ffffff' }}>{token.adoption24h}</span>
                    </span>
                    <span style={{ color: '#9ca3af' }}>
                      Momentum: <span style={{ color: token.momentumColor, fontWeight: '500' }}>
                        {token.momentum}{token.momentum === 'VERY HIGH' || token.momentum === 'HIGH' ? '↗' : 
                                token.momentum === 'LOW' ? '↘' : ''}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bottom Row - Remaining cards span full width */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${tokenCards.slice(3).length}, 1fr)`,
              gap: '16px'
            }}>
              {tokenCards.slice(3).map((token, index) => (
                <div key={index + 3} style={{
                  background: '#1A1B1E',
                  border: '1px solid #212228',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1e1f24';
                  e.currentTarget.style.borderColor = '#3a3b45';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1A1B1E';
                  e.currentTarget.style.borderColor = '#212228';
                }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                      {token.symbol}
                    </span>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                      {token.name}
                    </span>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                      • {token.exchangeCount} {token.symbol === '$NEWT' ? 'exch...' : 'exchanges'}
                    </span>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                      Listed on:
                    </p>
                    <div 
                      style={{ position: 'relative' }}
                      onMouseEnter={(e) => {
                        if (token.exchanges.length > 10) {
                          const tooltip = e.currentTarget.querySelector('.custom-tooltip');
                          if (tooltip) {
                            (tooltip as HTMLElement).style.opacity = '1';
                            (tooltip as HTMLElement).style.visibility = 'visible';
                          }
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (token.exchanges.length > 10) {
                          const tooltip = e.currentTarget.querySelector('.custom-tooltip');
                          if (tooltip) {
                            (tooltip as HTMLElement).style.opacity = '0';
                            (tooltip as HTMLElement).style.visibility = 'hidden';
                          }
                        }
                      }}
                    >
                      <p 
                        style={{ 
                          fontSize: '12px', 
                          color: '#e4e4e7', 
                          lineHeight: '1.4',
                          cursor: token.exchanges.length > 10 ? 'pointer' : 'default'
                        }}
                      >
                        {token.exchanges.length > 10 
                          ? token.exchanges.slice(0, 10).join(', ') + '...'
                          : token.listedOn
                        }
                      </p>
                      {token.exchanges.length > 10 && (
                        <div 
                          className="custom-tooltip"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            right: '0',
                            background: '#13141a',
                            border: '1px solid #2a2b35',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '12px',
                            color: '#e4e4e7',
                            lineHeight: '1.4',
                            zIndex: 1000,
                            opacity: '0',
                            visibility: 'hidden',
                            transition: 'opacity 0.2s ease, visibility 0.2s ease',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            marginTop: '4px'
                          }}
                        >
                          <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            All {token.exchangeCount} Exchanges:
                          </div>
                          {token.listedOn}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '12px'
                  }}>
                    <span style={{ color: '#9ca3af' }}>
                      24h: <span style={{ 
                        color: token.adoption24h === 'NEW' ? token.momentumColor : '#ffffff' 
                      }}>{token.adoption24h}</span>
                    </span>
                    <span style={{ color: '#9ca3af' }}>
                      Mom.: <span style={{ color: token.momentumColor, fontWeight: '500' }}>
                        {token.momentum}{token.momentum === 'LOW' ? '↘' : ''}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Success Tracking Treemap */}
          <div style={{
            background: '#1A1B1E',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #212228'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
              Matrix Analysis Summary ({selectedPeriod.toUpperCase()})
            </h3>
            
            <div style={{ height: '500px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#212228"
                  content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" value={0} fill="" />}
                />
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {/* Adoption Metrics */}
          <div style={{
            background: '#1A1B1E',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #212228'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#9ca3af', marginBottom: '16px' }}>
              Period Metrics ({selectedPeriod.toUpperCase()})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {adoptionMetrics.map((metric, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                    {metric.title}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Exchange Activity */}
          <div style={{
            background: '#1A1B1E',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #212228'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#9ca3af', marginBottom: '4px' }}>
              Exchange Activity
            </h3>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
              Last 24h new listings
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {exchangeActivity.map((exchange, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>
                      {exchange.name}
                    </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {exchange.count} new
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Listings Feed */}
        <div style={{
          background: '#1A1B1E',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #212228'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                Live Listings Feed
              </h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: liveUpdates ? '#10b981' : '#6b7280'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {liveUpdates ? 'Live updates active' : 'Updates paused'}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  Showing: {selectedPeriod === 'ytd' ? 'Year to Date' : `Last ${selectedPeriod.replace('d', ' days')}`}
                </span>
              </div>
            </div>
            <button
              style={{
                padding: '8px 16px',
                background: '#13141a',
                border: '1px solid #2a2b35',
                borderRadius: '8px',
                color: '#9ca3af',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1a1b23';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#13141a';
                e.currentTarget.style.color = '#9ca3af';
              }}
              onClick={() => {
                setSelectedExchange('All Exchanges');
                setSelectedType('All types');
              }}
            >
              Reset all
            </button>
          </div>

          {/* Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Exchange
              </label>
              <select 
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value)}
                style={{
                  width: '100%',
                  background: '#13141a',
                  border: '1px solid #2a2b35',
                  borderRadius: '8px',
                  padding: '8px 24px 8px 12px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option>All Exchanges</option>
                <option>Aevo pre-market</option>
                <option>AsendEx</option>
                <option>Binance</option>
                <option>Binance alpha projects</option>
                <option>Binance futures</option>
                <option>Binance hodler airdrops</option>
                <option>Bithumb spot</option>
                <option>Bitmart</option>
                <option>Bybit</option>
                <option>Bybit futures</option>
                <option>Bybit pre-market</option>
                <option>Bybit soon on spot</option>
                <option>Bybit spot</option>
                <option>Coinbase</option>
                <option>Coinbase International futures</option>
                <option>Coinbase International pre-market</option>
                <option>Coinbase roadmap</option>
                <option>Coinbase Spot</option>
                <option>Gate</option>
                <option>Hyperliquid</option>
                <option>Hyperliquid futures</option>
                <option>Kraken</option>
                <option>MEXC</option>
                <option>OKX futures</option>
                <option>OKX spot</option>
                <option>Robinhood spot</option>
                <option>Upbit</option>
                <option>Upbit spot</option>
                <option>Upbit spot (KRW)</option>
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  width: '100%',
                  background: '#13141a',
                  border: '1px solid #2a2b35',
                  borderRadius: '8px',
                  padding: '8px 24px 8px 12px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              >
                <option>All types</option>
                <option>SPOT</option>
                <option>FUTURES</option>
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Amount
              </label>
              <select style={{
                width: '100%',
                background: '#13141a',
                border: '1px solid #2a2b35',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '14px',
                color: '#ffffff',
                outline: 'none'
              }}>
                <option>Amount</option>
                <option>$0-$1</option>
                <option>$1-$10</option>
                <option>$10+</option>
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Status
              </label>
              <select style={{
                width: '100%',
                background: '#13141a',
                border: '1px solid #2a2b35',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '14px',
                color: '#ffffff',
                outline: 'none'
              }}>
                <option>All Status</option>
                <option>Live</option>
                <option>Pending</option>
                <option>Failed</option>
              </select>
            </div>
          </div>

          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 2fr 1fr 1fr 1fr',
            gap: '16px',
            padding: '12px 16px',
            background: '#13141a',
            borderRadius: '8px',
            border: '1px solid #2a2b35',
            fontSize: '12px',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px'
          }}>
            <div>Time</div>
            <div>Exchange</div>
            <div>Asset</div>
            <div>Name</div>
            <div>Type</div>
            <div>Price</div>
            <div>Status</div>
          </div>

          {/* Table Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {liveListings
              .filter(listing => 
                (selectedExchange === 'All Exchanges' || listing.exchange === selectedExchange) &&
                (selectedType === 'All types' || listing.type === selectedType)
              )
              .map((listing, index) => (
              <div
                key={`${listing.timestamp}-${listing.asset}-${index}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 2fr 1fr 1fr 1fr',
                  gap: '16px',
                  padding: '12px 16px',
                  background: '#13141a',
                  borderRadius: '8px',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1a1b23'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#13141a'}
              >
                <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                  {listing.timestamp}
                </span>
                <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '500' }}>
                  {listing.exchange}
                </div>
                <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>
                  {listing.asset}
                </div>
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                  {listing.name}
                </div>
                <div>
                  <span style={{
                    padding: '4px 8px',
                    background: '#2a2b35',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#ffffff'
                  }}>
                    {listing.type}
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>
                  {listing.price}
                </div>
                <div>
                  <span style={{
                    padding: '4px 8px',
                    background: listing.status === 'Live' ? 'rgba(16, 185, 129, 0.2)' : 
                               listing.status === 'Pending' ? 'rgba(59, 130, 246, 0.2)' :
                               'rgba(239, 68, 68, 0.2)',
                    color: listing.status === 'Live' ? '#10b981' :
                           listing.status === 'Pending' ? '#3b82f6' : '#ef4444',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {listing.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default RecentListingsTrackerFeed;