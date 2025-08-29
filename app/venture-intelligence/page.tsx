'use client';

import { useState, useEffect } from 'react';
import { SharedLayout } from '@/components/shared-layout';
import { Treemap, ResponsiveContainer } from 'recharts';
import { FundingDashboardData } from '@/app/types/funding';
import { CardSkeleton, TableSkeleton, ChartSkeleton, Skeleton } from '@/components/skeleton';
import { formatAmount } from '@/app/lib/funding-utils';

// TypeScript interfaces
// interface Investor {
//   rank: number;
//   name: string;
//   deals: number;
//   amount: string;
//   change: string;
//   changeType: 'up' | 'down';
// }


interface FundingRound {
  time: string;
  company: string;
  round: string;
  amount: string;
  leadInvestor: string;
  valuation: string;
  change: string;
  changeType: 'up' | 'down';
}

// Custom Treemap Content Component (matching Matrix Analysis Summary style)
interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  value: number;
  fill: string;
  deals?: number;
  payload?: {
    category?: string;
    totalAmountDisplay?: string;
    dealCount?: number;
    totalAmount?: number;
    deals?: number;
    percentage?: number;
  };
  [key: string]: unknown;
}

const CustomTreemapContent = (props: TreemapContentProps) => {
  const { x, y, width, height, name, value, fill, payload, ...rest } = props;
  
  // Debug what properties are actually available
  console.log('All treemap props:', props);
  
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
      {width > 40 && height > 30 && (
        <>
          {/* Sector name - centered and responsive */}
          <text
            x={x + width / 2}
            y={y + height / 2 - (height > 80 ? 18 : height > 60 ? 12 : 8)}
            textAnchor="middle"
            fill="white"
            stroke="none"
            fontSize={Math.min(width / 8, height / 12, 11)}
            fontWeight="600"
            style={{ fill: 'white' }}
          >
            {width > 80 ? name : name.length > 8 ? name.substring(0, 6) + '...' : name}
          </text>
          
          {/* Total funding amount - centered */}
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            fill="white"
            stroke="none"
            fontSize={Math.min(width / 6, height / 8, 14)}
            fontWeight="700"
            style={{ fill: 'white' }}
          >
            {payload?.totalAmount !== undefined 
              ? payload.totalAmount > 0 
                ? `$${(payload.totalAmount / 1e6).toFixed(0)}M` 
                : '$0M'
              : value > 0 
                ? `$${(value / 1e6).toFixed(0)}M` 
                : '$0M'
            }
          </text>
          
          {/* Deal count - centered below amount */}
          <text
            x={x + width / 2}
            y={y + height / 2 + (height > 80 ? 18 : height > 60 ? 12 : 8)}
            textAnchor="middle"
            fill="white"
            stroke="none"
            fontSize={Math.min(width / 10, height / 14, 9)}
            fontWeight="400"
            style={{ fill: 'white', opacity: 0.85 }}
          >
            {(() => {
              // Try to get deal count from various possible sources
              const dealCount = props?.deals ?? payload?.deals ?? payload?.dealCount ?? rest?.deals ?? 0;
              return `${dealCount} deals`;
            })()}
          </text>
          
          {/* Status indicator circle - top left */}
          <circle
            cx={x + (width > 60 ? 8 : 4)}
            cy={y + (height > 60 ? 8 : 4)}
            r={Math.min(width / 20, height / 20, 3)}
            fill="white"
            opacity={0.8}
          />
          
          {/* Percentage indicator in bottom right - only for larger boxes */}
          {width > 70 && height > 70 && payload?.percentage !== undefined && (
            <text
              x={x + width - 8}
              y={y + height - 8}
              textAnchor="end"
              fill="white"
              stroke="none"
              fontSize={Math.min(width / 12, height / 12, 10)}
              fontWeight="600"
              style={{ fill: 'white', opacity: 0.9 }}
            >
              {payload.percentage.toFixed(1)}%
            </text>
          )}
        </>
      )}
    </g>
  );
};


// Helper function to format investor display
const formatInvestorDisplay = (leadInvestors: string[], otherInvestors: string[]): string => {
  const allInvestors = [...leadInvestors, ...otherInvestors];
  
  if (allInvestors.length === 0) return 'No data';
  if (allInvestors.length === 1) return allInvestors[0];
  if (allInvestors.length === 2) return `${allInvestors[0]}, ${allInvestors[1]}`;
  if (allInvestors.length === 3) return `${allInvestors[0]}, ${allInvestors[1]}, ${allInvestors[2]}`;
  
  // More than 3 investors
  const displayCount = 2;
  const displayInvestors = allInvestors.slice(0, displayCount);
  const remainingCount = allInvestors.length - displayCount;
  
  return `${displayInvestors.join(', ')} + ${remainingCount} others`;
};

const VentureIntelligenceDashboard = () => {
  const [selectedRound, setSelectedRound] = useState('All Rounds');
  const [selectedAmount, setSelectedAmount] = useState('All Amounts');
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fundingData, setFundingData] = useState<FundingDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFundingData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/funding');
        if (!response.ok) {
          throw new Error('Failed to fetch funding data');
        }
        const data = await response.json();
        setFundingData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching funding data:', err);
        setError('Failed to load funding data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFundingData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchFundingData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Get recent 90-day funding rounds
  const recent90DayRounds = fundingData ? (() => {
    console.log('=== DEBUGGING FUNDING DATA ===');
    console.log('fundingData exists:', !!fundingData);
    console.log('fundingData.latestRounds exists:', !!fundingData.latestRounds);
    console.log('fundingData.latestRounds length:', fundingData.latestRounds?.length ?? 0);
    
    if (fundingData.latestRounds && fundingData.latestRounds.length > 0) {
      console.log('First 3 rounds:', fundingData.latestRounds.slice(0, 3).map(r => ({
        name: r.name,
        date: r.date,
        dateDisplay: r.dateDisplay,
        dateType: typeof r.date,
        isValidDate: r.date instanceof Date && !isNaN(r.date.getTime())
      })));
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    console.log('90 days ago:', ninetyDaysAgo);
    console.log('Today:', new Date());

    const filteredRounds = fundingData.latestRounds
      .filter(round => {
        // Convert string date to Date object for proper comparison
        const roundDate = new Date(round.date);
        const isWithin90Days = roundDate >= ninetyDaysAgo;
        console.log(`Round "${round.name}": date=${round.date}, roundDate=${roundDate}, within90Days=${isWithin90Days}`);
        return isWithin90Days;
      });
    
    console.log('Filtered rounds count (within 90 days):', filteredRounds.length);
    
    const mappedRounds = filteredRounds
      .slice(0, 8)
      .map((round, idx) => ({
        rank: idx + 1,
        company: round.name,
        round: round.round,
        amount: round.amountDisplay,
        date: round.dateDisplay,
        leadInvestor: formatInvestorDisplay(round.leadInvestors, round.otherInvestors)
      }));
    
    console.log('Final mapped rounds:', mappedRounds);
    console.log('=== END DEBUG ===');
    
    return mappedRounds;
  })() : [
    { rank: 1, company: 'Loading...', round: 'Loading...', amount: '$0', date: '', leadInvestor: '' }
  ];


  const allFundingRounds: FundingRound[] = fundingData ?
    fundingData.latestRounds.map(round => ({
      time: round.dateDisplay,
      company: round.name,
      round: round.round ?? 'Unknown',
      amount: round.amountDisplay,
      leadInvestor: formatInvestorDisplay(round.leadInvestors, round.otherInvestors),
      valuation: round.valuation ?? 'No data',
      change: '+0.0%', // TODO: Calculate from historical data
      changeType: 'up' as const
    })) :
    [
      { time: 'Loading...', company: 'Loading...', round: 'Loading...', amount: 'Loading...', leadInvestor: 'Loading...', valuation: 'Loading...', change: 'Loading...', changeType: 'up' },
    ];

  // Get unique values for dropdowns
  const uniqueRounds = ['All Rounds', ...new Set(allFundingRounds.map(round => round.round).filter(Boolean))];
  const amountRanges = ['All Amounts', '$0-1M', '$1-5M', '$5-10M', '$10-50M', '$50M+'];

  // Filter and sort funding rounds based on filters
  const filteredAndSortedFundingRounds = allFundingRounds
    .filter(round => {
      // Round filter
      const roundMatch = selectedRound === 'All Rounds' || round.round === selectedRound;

      // Amount filter
      const amountMatch = selectedAmount === 'All Amounts' || (() => {
        const amount = round.amount.toLowerCase();
        const hasB = amount.includes('b');
        const hasM = amount.includes('m');
        const hasK = amount.includes('k');
        const numValue = parseFloat(amount.replace(/[^0-9.]/g, ''));
        const safeNumValue = isNaN(numValue) ? 0 : numValue;
        
        let amountNum = 0;
        if (hasB) amountNum = safeNumValue * 1000; // Convert billions to millions
        else if (hasM) amountNum = safeNumValue;
        else if (hasK) amountNum = safeNumValue / 1000; // Convert thousands to millions
        else amountNum = safeNumValue / 1000000; // Assume dollars, convert to millions
        
        switch (selectedAmount) {
          case '$0-1M': return amountNum <= 1;
          case '$1-5M': return amountNum > 1 && amountNum <= 5;
          case '$5-10M': return amountNum > 5 && amountNum <= 10;
          case '$10-50M': return amountNum > 10 && amountNum <= 50;
          case '$50M+': return amountNum > 50;
          default: return true;
        }
      })();

      return roundMatch && amountMatch;
    })
    .sort((a, b) => {
      // Sort by time only (most recent first)
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

  // Calculate pagination
  const totalRows = filteredAndSortedFundingRounds.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedFundingRounds = filteredAndSortedFundingRounds.slice(startIndex, endIndex);

  // Reset to page 1 when filters change or rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRound, selectedAmount, rowsPerPage]);

  // Reset all filters
  const resetAllFilters = () => {
    setSelectedRound('All Rounds');
    setSelectedAmount('All Amounts');
    setCurrentPage(1);
  };

  // Extended funding timeline data - 90 days with weekly data points (13 weeks)
  const fundingTimelineData = fundingData ? (() => {
    const now = new Date();
    const weeklyData = [];
    
    // Generate 13 weekly data points for 90 days
    for (let i = 12; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      
      // Filter rounds for this week
      const weeklyRounds = fundingData.latestRounds.filter(round => {
        const roundDate = new Date(round.date);
        return roundDate >= weekStart && roundDate <= weekEnd;
      });
      
      // Sum funding for this week
      const weeklyTotal = weeklyRounds.reduce((sum, round) => sum + round.amount, 0);
      // Convert to appropriate scale for chart display (in millions)
      weeklyData.push(weeklyTotal / 1e6);
    }
    
    return weeklyData;
  })() : [100, 150, 200, 170, 240, 300, 280, 200, 230, 280, 250, 180, 150];

  // Prepare treemap data from last90DaysCategories - show all 15 sectors (90-day filtered)
  const treemapData = fundingData ? 
    (() => {
      console.log('=== PREPARING 90-DAY TREEMAP DATA ===');
      console.log('fundingData.last90DaysCategories:', fundingData.last90DaysCategories);
      console.log('Total 90-day categories available:', fundingData.last90DaysCategories.length);
      
      const data = fundingData.last90DaysCategories.map((cat) => ({
        name: cat.category,
        size: cat.totalAmount > 0 ? Math.max(cat.totalAmount, 1000000) : 1000000, // Minimum size for visibility, but preserve real amount
        fill: cat.color || '#6b7280',
        deals: cat.dealCount,
        percentage: cat.percentage,
        totalAmount: cat.totalAmount // Keep the real amount for display
      }));
      
      console.log('90-day treemap data prepared:', data.map(d => `${d.name}: $${(d.totalAmount / 1e6).toFixed(0)}M (${d.deals} deals)`));
      return data;
    })() :
    [
      { name: 'Loading...', size: 100, fill: '#6b7280', deals: 0, percentage: 0, totalAmount: 0 }
    ];


  return (
    <SharedLayout currentPage="venture-intelligence">
      <div style={{
        padding: '30px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 10px 0', color: '#ffffff' }}>
            Venture Intelligence
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            Real-Time Crypto & Blockchain Funding Tracker
          </p>
        </div>

        {/* Loading State with Skeletons */}
        {isLoading && (
          <>
            {/* Two Column Grid Layout Skeleton */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '40px',
              marginBottom: '40px'
            }}>
              {/* Left Column - 90 day Raise announcements */}
              <div>
                <Skeleton height="18px" width="120px" style={{ marginBottom: '20px' }} />
                <CardSkeleton>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                  }}>
                    <Skeleton height="12px" width="140px" />
                    <Skeleton height="10px" width="80px" />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Skeleton width="16px" height="12px" />
                          <Skeleton height="14px" width="100px" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <Skeleton height="12px" width="40px" />
                          <Skeleton height="14px" width="50px" />
                          <Skeleton width="20px" height="12px" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardSkeleton>
              </div>


              {/* Right Column - Trending Categories */}
              <div>
                <Skeleton height="18px" width="160px" style={{ marginBottom: '20px' }} />
                <CardSkeleton>
                  {/* Investment Thesis Trends */}
                  <Skeleton height="12px" width="150px" style={{ marginBottom: '16px' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Skeleton height="14px" width="120px" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Skeleton height="14px" width="40px" />
                          <Skeleton height="12px" width="30px" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardSkeleton>
              </div>
            </div>

            {/* Full Width Funding Timeline Skeleton */}
            <CardSkeleton style={{ marginBottom: '40px' }}>
              <Skeleton height="18px" width="160px" style={{ marginBottom: '20px' }} />
              <ChartSkeleton height="250px" />
            </CardSkeleton>

            {/* Latest Funding Rounds Table Skeleton */}
            <CardSkeleton>
              <Skeleton height="18px" width="180px" style={{ marginBottom: '20px' }} />
              
              {/* Search and Filters Skeleton */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <Skeleton height="36px" width="100%" />
                <Skeleton height="36px" width="100%" />
                <Skeleton height="36px" width="100%" />
                <Skeleton height="36px" width="100%" />
                <Skeleton height="36px" width="100%" />
              </div>

              <TableSkeleton rows={10} columns={6} />
              
              {/* Pagination Skeleton */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '16px'
              }}>
                <Skeleton height="14px" width="150px" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Skeleton height="28px" width="120px" />
                  <Skeleton height="24px" width="80px" />
                </div>
              </div>
            </CardSkeleton>
          </>
        )}

        {error && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: '#ef4444',
            fontSize: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Main Grid Layout */}
        {!isLoading && !error && (
        <>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          marginBottom: '40px'
        }}>
          {/* Left Column - 90 day Raise announcements */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
              Raise Announcements (90-day)
            </h2>
            
            {/* Recent Funding Rounds */}
            <div style={{
              background: '#1A1B1E',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #212228',
              marginBottom: '30px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  margin: 0
                }}>
                  Recent Funding Rounds
                </h3>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>
                  Last 90 days
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recent90DayRounds.length > 0 ? recent90DayRounds.map((round) => (
                  <div key={round.rank} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#13141a'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af', width: '16px' }}>
                        {round.rank}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '14px', color: '#ffffff' }}>
                          {round.company}
                        </span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {round.round} • {round.date}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                        {round.amount}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '12px 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>No recent announcements</span>
                  </div>
                )}
              </div>
            </div>

          </div>


          {/* Right Column - Trending Categories */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
              Trending Categories (90-day)
            </h2>
            
            {/* Combined Trending Categories Card */}
            <div style={{
              background: '#1A1B1E',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #212228'
            }}>
              {/* Investment Thesis Trends Section */}
              <h3 style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#9ca3af',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Investment Thesis Trends
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#ffffff' }}>Total Capital Deployed:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                      {fundingData ? (() => {
                        const total90Day = fundingData.last90DaysCategories.reduce((sum, cat) => sum + cat.totalAmount, 0);
                        return total90Day >= 1e9 ? `$${(total90Day / 1e9).toFixed(1)}B` :
                               total90Day >= 1e6 ? `$${(total90Day / 1e6).toFixed(0)}M` :
                               total90Day >= 1e3 ? `$${(total90Day / 1e3).toFixed(0)}K` :
                               `$${total90Day.toFixed(0)}`;
                      })() : '$0'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>—</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#ffffff' }}>Total Deals:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                      {fundingData ? fundingData.last90DaysCategories.reduce((sum, cat) => sum + cat.dealCount, 0) : 0}
                    </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>—</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#ffffff' }}>Avg Round Size:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                      {fundingData ? (() => {
                        const totalDeals90Day = fundingData.last90DaysCategories.reduce((sum, cat) => sum + cat.dealCount, 0);
                        const total90Day = fundingData.last90DaysCategories.reduce((sum, cat) => sum + cat.totalAmount, 0);
                        const avgRound90Day = totalDeals90Day > 0 ? total90Day / totalDeals90Day : 0;
                        return avgRound90Day >= 1e9 ? `$${(avgRound90Day / 1e9).toFixed(1)}B` :
                               avgRound90Day >= 1e6 ? `$${(avgRound90Day / 1e6).toFixed(0)}M` :
                               avgRound90Day >= 1e3 ? `$${(avgRound90Day / 1e3).toFixed(0)}K` :
                               `$${avgRound90Day.toFixed(0)}`;
                      })() : '$0'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>—</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#ffffff' }}>90-Day Total Raised:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                      {fundingData ? (() => {
                        const total90Day = fundingData.last90DaysCategories.reduce((sum, cat) => sum + cat.totalAmount, 0);
                        return total90Day >= 1e9 ? `$${(total90Day / 1e9).toFixed(1)}B` :
                               total90Day >= 1e6 ? `$${(total90Day / 1e6).toFixed(0)}M` :
                               total90Day >= 1e3 ? `$${(total90Day / 1e3).toFixed(0)}K` :
                               `$${total90Day.toFixed(0)}`;
                      })() : '$0'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>—</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Funding By Sector Treemap */}
        <div style={{
          background: '#1A1B1E',
          borderRadius: '12px',
          padding: '30px',
          border: '1px solid #212228',
          marginBottom: '40px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '25px',
            color: '#ffffff'
          }}>
            Funding By Sector (Last 90 Days)
          </h2>
          
          <div style={{ height: '500px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={16 / 9}
                stroke="#212228"
                content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" value={0} fill="" />}
              />
            </ResponsiveContainer>
          </div>
          
          {/* Summary stats below treemap */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '50px',
            fontSize: '14px',
            color: '#9ca3af',
            paddingTop: '25px',
            borderTop: '1px solid #2a2b35',
            marginTop: '25px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '18px' }}>
                {fundingData ? (() => {
                  const total90Days = fundingData.last90DaysCategories.reduce((sum, cat) => sum + cat.totalAmount, 0);
                  return formatAmount(total90Days);
                })() : '$0'}
              </div>
              <div style={{ fontSize: '12px' }}>90-Day Total</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '18px' }}>
                {fundingData ? fundingData.last90DaysCategories.reduce((sum, cat) => sum + cat.dealCount, 0) : 0}
              </div>
              <div style={{ fontSize: '12px' }}>Total Deals</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#10b981', fontWeight: '600', fontSize: '18px' }}>
                {fundingData ? fundingData.last90DaysCategories.filter(cat => cat.totalAmount > 0).length : 0}
              </div>
              <div style={{ fontSize: '12px' }}>Active Sectors</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '18px' }}>
                {fundingData ? (() => {
                  const totalDeals = fundingData.last90DaysCategories.reduce((sum, cat) => sum + cat.dealCount, 0);
                  const total90Days = fundingData.last90DaysCategories.reduce((sum, cat) => sum + cat.totalAmount, 0);
                  const avgDeal = totalDeals > 0 ? total90Days / totalDeals : 0;
                  return formatAmount(avgDeal);
                })() : '$0'}
              </div>
              <div style={{ fontSize: '12px' }}>Avg Deal Size</div>
            </div>
          </div>
        </div>

        {/* Full Width Funding Timeline */}
        <div style={{
          background: '#1A1B1E',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #212228',
          marginBottom: '40px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#ffffff'
          }}>
            Funding Timeline (90D)
          </h2>
          
          <div style={{ position: 'relative', height: '250px', marginBottom: '20px' }}>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50px',
              right: '20px',
              display: 'flex',
              alignItems: 'end',
              justifyContent: 'space-between',
              height: '200px',
              gap: '2px'
            }}>
              {fundingTimelineData.map((value, index) => {
                // Calculate dynamic scaling with uniform intervals
                const maxValue = Math.max(...fundingTimelineData, 50);
                
                // Use same interval logic as y-axis
                let interval;
                if (maxValue <= 100) interval = 20;
                else if (maxValue <= 200) interval = 50;
                else if (maxValue <= 500) interval = 100;
                else if (maxValue <= 1000) interval = 200;
                else if (maxValue <= 2000) interval = 500;
                else interval = 1000;
                
                const roundedMax = Math.ceil(maxValue / interval) * interval;
                
                return (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(196, 181, 253, 0.8)',
                      borderRadius: '2px 2px 0 0',
                      height: `${(value / roundedMax) * 100}%`,
                      flex: 1,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#c4b5fd';
                      e.currentTarget.style.transform = 'scaleY(1.1) scaleX(1.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(196, 181, 253, 0.8)';
                      e.currentTarget.style.transform = 'scaleY(1) scaleX(1)';
                    }}
                    title={`Week ${index + 1}: $${value.toFixed(1)}M`}
                  />
                );
              })}
            </div>
            
            {/* Y-axis labels */}
            <div style={{
              position: 'absolute',
              left: '0',
              top: 0,
              height: '200px',
              width: '40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#6b7280',
              textAlign: 'right',
              paddingRight: '8px'
            }}>
              {(() => {
                // Calculate dynamic y-axis with uniform intervals
                const maxValue = Math.max(...fundingTimelineData, 50); // minimum 50M
                
                // Determine nice round interval based on max value
                let interval;
                if (maxValue <= 100) interval = 20;
                else if (maxValue <= 200) interval = 50;
                else if (maxValue <= 500) interval = 100;
                else if (maxValue <= 1000) interval = 200;
                else if (maxValue <= 2000) interval = 500;
                else interval = 1000;
                
                // Calculate rounded max that's a multiple of interval
                const roundedMax = Math.ceil(maxValue / interval) * interval;
                
                const labels = [];
                const steps = 6; // 7 labels total (including 0)
                const uniformInterval = roundedMax / steps;
                
                for (let i = steps; i >= 0; i--) {
                  const value = uniformInterval * i;
                  if (value >= 1000) {
                    labels.push(`$${(value / 1000).toFixed(1)}B`);
                  } else if (value >= 1) {
                    const roundedValue = Math.round(Number(value));
                    labels.push(`$${isNaN(roundedValue) ? 0 : roundedValue}M`);
                  } else {
                    labels.push('$0');
                  }
                }
                
                return labels.map((label, idx) => (
                  <span key={idx}>{label}</span>
                ));
              })()}
            </div>

            {/* Chart border */}
            <div style={{
              position: 'absolute',
              left: '40px',
              bottom: 0,
              right: '20px',
              height: '200px',
              borderLeft: '1px solid #2a2b35',
              borderBottom: '1px solid #2a2b35'
            }} />
          </div>
          
          {/* X-axis labels */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#6b7280',
            marginBottom: '20px',
            paddingLeft: '50px',
            paddingRight: '20px'
          }}>
            {(() => {
              const now = new Date();
              const dates = [];
              // Generate 5 date labels for 90 days (every 18 days approximately)
              for (let i = 4; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - (i * 18));
                dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
              }
              return dates.map((date, idx) => <span key={idx}>{date}</span>);
            })()}
          </div>
          
          {/* Summary stats */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '40px',
            fontSize: '14px',
            color: '#9ca3af',
            paddingTop: '20px',
            borderTop: '1px solid #2a2b35'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '18px' }}>
                {fundingData ? (() => {
                  const total90Day = fundingData.last90DaysCategories.reduce((sum, cat) => sum + cat.totalAmount, 0);
                  return total90Day >= 1e9 ? `$${(total90Day / 1e9).toFixed(1)}B` :
                         total90Day >= 1e6 ? `$${(total90Day / 1e6).toFixed(0)}M` :
                         total90Day >= 1e3 ? `$${(total90Day / 1e3).toFixed(0)}K` :
                         `$${total90Day.toFixed(0)}`;
                })() : '$0'}
              </div>
              <div style={{ fontSize: '12px' }}>90-Day Total</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '18px' }}>
                {fundingData ? (() => {
                  const total90Day = fundingData.last90DaysCategories.reduce((sum, cat) => sum + cat.totalAmount, 0);
                  const weeklyAvg = total90Day / 13; // 90 days ≈ 13 weeks
                  return weeklyAvg >= 1e9 ? `$${(weeklyAvg / 1e9).toFixed(1)}B` :
                         weeklyAvg >= 1e6 ? `$${(weeklyAvg / 1e6).toFixed(1)}M` :
                         weeklyAvg >= 1e3 ? `$${(weeklyAvg / 1e3).toFixed(0)}K` :
                         `$${weeklyAvg.toFixed(0)}`;
                })() : '$0'}
              </div>
              <div style={{ fontSize: '12px' }}>Weekly Avg</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#10b981', fontWeight: '600', fontSize: '18px' }}>
                {fundingData ? fundingData.last90DaysCategories.reduce((sum, cat) => sum + cat.dealCount, 0) : 0}
              </div>
              <div style={{ fontSize: '12px' }}>Total Deals</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '18px' }}>
                {fundingData?.activeDeals ?? 'No data'}
              </div>
              <div style={{ fontSize: '12px' }}>Active Total</div>
            </div>
          </div>
        </div>

        {/* Latest Funding Rounds Table */}
        <div style={{
          background: '#1A1B1E',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #212228'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0', color: '#ffffff' }}>
                Latest Funding Rounds
              </h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                Real-time funding activity
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
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
                Round
              </label>
              <select 
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                style={{
                  width: '100%',
                  background: '#13141a',
                  border: '1px solid #2a2b35',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                  maxHeight: '40px',
                  overflow: 'hidden'
                }}>
                {uniqueRounds.map(round => (
                  <option key={round} value={round}>{round}</option>
                ))}
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
              <select 
                value={selectedAmount}
                onChange={(e) => setSelectedAmount(e.target.value)}
                style={{
                  width: '100%',
                  background: '#13141a',
                  border: '1px solid #2a2b35',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                  maxHeight: '40px',
                  overflow: 'hidden'
                }}>
                {amountRanges.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
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
                Actions
              </label>
              <div>
              <button 
                onClick={resetAllFilters}
                style={{
                  width: '100%',
                  background: '#13141a',
                  border: '1px solid #2a2b35',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#9ca3af',
                  padding: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#565ed2';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2a2b35';
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                Reset all
              </button>
            </div>
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: '#13141a',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #2a2b35'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2.5fr 1fr 1fr 2fr',
              gap: '20px',
              padding: '16px 20px',
              background: '#1a1b23',
              borderBottom: '1px solid #2a2b35',
              fontSize: '12px',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <div>Date</div>
              <div>Company</div>
              <div>Round</div>
              <div>Amount</div>
              <div>Investors</div>
            </div>

            {/* Table Rows */}
            <div>
              {paginatedFundingRounds.map((round, index) => (
                <div 
                  key={index} 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2.5fr 1fr 1fr 2fr',
                    gap: '20px',
                    padding: '16px 20px',
                    borderBottom: index < paginatedFundingRounds.length - 1 ? '1px solid #2a2b35' : 'none',
                    alignItems: 'center',
                    transition: 'background 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1a1b23'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    {round.time}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>
                    {round.company}
                  </div>
                  <div style={{ fontSize: '14px', color: '#ffffff' }}>
                    {round.round}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>
                    {round.amount}
                  </div>
                  <div style={{ fontSize: '14px', color: '#ffffff' }}>
                    {round.leadInvestor}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px'
          }}>
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>
              Total: <span style={{ fontWeight: '500', color: '#ffffff' }}>{totalRows}</span> rows
              {totalRows !== allFundingRounds.length && (
                <span> (filtered from {allFundingRounds.length})</span>
              )}
              <span style={{ marginLeft: '10px', fontSize: '12px', color: '#565ed2' }}>
                • Page {currentPage} of {totalPages}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#9ca3af' }}>Rows per page</span>
                <select 
                  style={{
                    background: '#13141a',
                    border: '1px solid #2a2b35',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    outline: 'none',
                    color: '#ffffff'
                  }}
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                  {startIndex + 1}-{Math.min(endIndex, totalRows)} of {totalRows}
                </span>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  style={{
                    padding: '4px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    color: currentPage === 1 ? '#404040' : '#9ca3af',
                    transition: 'background 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage > 1) e.currentTarget.style.background = '#1a1b23';
                  }}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  ←
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  style={{
                    padding: '4px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    color: currentPage === totalPages ? '#404040' : '#9ca3af',
                    transition: 'background 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage < totalPages) e.currentTarget.style.background = '#1a1b23';
                  }}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </SharedLayout>
  );
};

export default VentureIntelligenceDashboard;