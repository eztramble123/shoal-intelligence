'use client';

import { useState, useEffect } from 'react';
import { SharedLayout } from '@/components/shared-layout';
import { FundingDashboardData } from '@/app/types/funding';
import { CardSkeleton, TableSkeleton, ChartSkeleton, Skeleton } from '@/components/skeleton';

// TypeScript interfaces
interface Investor {
  rank: number;
  name: string;
  deals: number;
  amount: string;
  change: string;
  changeType: 'up' | 'down';
}

interface TrendingCategory {
  rank: number;
  name: string;
  amount: string;
  deals: number;
  change: string;
  changeType: 'up' | 'down';
}

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


const VentureIntelligenceDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All Companies');
  const [selectedRound, setSelectedRound] = useState('All Rounds');
  const [selectedInvestor, setSelectedInvestor] = useState('All Investors');
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

  // Use real data or fallback to mock
  const investors: Investor[] = fundingData ? 
    fundingData.mostActiveInvestors.slice(0, 8).map((inv, idx) => ({
      rank: idx + 1,
      name: inv.name,
      deals: inv.dealCount,
      amount: inv.totalInvestedDisplay,
      change: '+0.0%', // TODO: Calculate from historical data
      changeType: 'up' as const
    })) :
    [
      { rank: 1, name: 'Loading...', deals: 0, amount: '$0', change: '+0.0%', changeType: 'up' },
    ];

  const trendingCategories: TrendingCategory[] = fundingData ?
    fundingData.trendingCategories.slice(0, 5).map((cat, idx) => ({
      rank: idx + 1,
      name: cat.category,
      amount: cat.totalAmountDisplay,
      deals: cat.dealCount,
      change: `${cat.percentage > 25 ? '+' : '-'}${Math.abs(25 - cat.percentage).toFixed(1)}%`,
      changeType: cat.percentage > 25 ? 'up' : 'down' as const
    })) :
    [
      { rank: 1, name: 'Loading...', amount: '$0', deals: 0, change: '+0.0%', changeType: 'up' },
    ];

  const allFundingRounds: FundingRound[] = fundingData ?
    fundingData.latestRounds.map(round => ({
      time: round.dateDisplay,
      company: round.name,
      round: round.round || 'Unknown',
      amount: round.amountDisplay,
      leadInvestor: round.leadInvestors[0] || 'Various',
      valuation: round.valuation || 'N/A',
      change: '+0.0%', // TODO: Calculate from historical data
      changeType: 'up' as const
    })) :
    [
      { time: 'Loading...', company: 'Loading...', round: 'Loading...', amount: '$0', leadInvestor: 'Loading...', valuation: 'N/A', change: '+0.0%', changeType: 'up' },
    ];

  // Get unique values for dropdowns
  const uniqueCompanies = ['All Companies', ...new Set(allFundingRounds.map(round => round.company).filter(Boolean))];
  const uniqueRounds = ['All Rounds', ...new Set(allFundingRounds.map(round => round.round).filter(Boolean))];
  const uniqueInvestors = ['All Investors', ...new Set(allFundingRounds.map(round => round.leadInvestor).filter(Boolean))];
  const amountRanges = ['All Amounts', '$0-1M', '$1-5M', '$5-10M', '$10-50M', '$50M+'];

  // Filter and sort funding rounds based on search and filters
  const filteredAndSortedFundingRounds = allFundingRounds
    .filter(round => {
      // Search filter
      const searchMatch = searchQuery === '' || 
        round.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        round.round.toLowerCase().includes(searchQuery.toLowerCase()) ||
        round.leadInvestor.toLowerCase().includes(searchQuery.toLowerCase());

      // Company filter
      const companyMatch = selectedCompany === 'All Companies' || round.company === selectedCompany;

      // Round filter
      const roundMatch = selectedRound === 'All Rounds' || round.round === selectedRound;

      // Investor filter
      const investorMatch = selectedInvestor === 'All Investors' || round.leadInvestor === selectedInvestor;

      // Amount filter
      const amountMatch = selectedAmount === 'All Amounts' || (() => {
        const amount = round.amount.toLowerCase();
        const hasB = amount.includes('b');
        const hasM = amount.includes('m');
        const hasK = amount.includes('k');
        const numValue = parseFloat(amount.replace(/[^0-9.]/g, ''));
        
        let amountNum = 0;
        if (hasB) amountNum = numValue * 1000; // Convert billions to millions
        else if (hasM) amountNum = numValue;
        else if (hasK) amountNum = numValue / 1000; // Convert thousands to millions
        else amountNum = numValue / 1000000; // Assume dollars, convert to millions
        
        switch (selectedAmount) {
          case '$0-1M': return amountNum <= 1;
          case '$1-5M': return amountNum > 1 && amountNum <= 5;
          case '$5-10M': return amountNum > 5 && amountNum <= 10;
          case '$10-50M': return amountNum > 10 && amountNum <= 50;
          case '$50M+': return amountNum > 50;
          default: return true;
        }
      })();

      return searchMatch && companyMatch && roundMatch && investorMatch && amountMatch;
    })
    .sort((a, b) => {
      // If there's a search query, sort by company name first, then by time
      if (searchQuery && searchQuery.trim() !== '') {
        const companyCompare = a.company.localeCompare(b.company);
        if (companyCompare !== 0) return companyCompare;
        // If company names are the same, sort by time (most recent first)
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      }
      
      // If no search, sort by time only (most recent first)
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
  }, [searchQuery, selectedCompany, selectedRound, selectedInvestor, selectedAmount, rowsPerPage]);

  // Reset all filters
  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCompany('All Companies');
    setSelectedRound('All Rounds');
    setSelectedInvestor('All Investors');
    setSelectedAmount('All Amounts');
    setCurrentPage(1);
  };

  // Extended funding timeline data
  const fundingTimelineData = fundingData ?
    fundingData.monthlyFunding.map(m => m.total * 100).slice(0, 20) :
    [100, 150, 200, 170, 240, 300, 280, 200, 230, 280, 250, 180, 150, 120, 195, 240, 245, 215, 170, 125];

  // Generate market share bars from real category data
  const marketShareBars = fundingData ? 
    fundingData.trendingCategories.slice(0, 10).map((cat, idx) => {
      const percentage = (idx + 1) * 10;
      return {
        percentage,
        sectors: [{ 
          name: cat.category, 
          color: cat.color, 
          value: cat.percentage 
        }]
      };
    }) : [
    { percentage: 10, sectors: [{ name: 'AI/ML', color: '#f97316', value: 10 }] },
    { percentage: 20, sectors: [{ name: 'AI/ML', color: '#f97316', value: 15 }, { name: 'Gaming', color: '#8b5cf6', value: 5 }] },
    { percentage: 30, sectors: [{ name: 'Gaming', color: '#8b5cf6', value: 25 }, { name: 'AI/ML', color: '#f97316', value: 5 }] },
    { percentage: 40, sectors: [{ name: 'Gaming', color: '#8b5cf6', value: 35 }, { name: 'DeFi', color: '#3b82f6', value: 5 }] },
    { percentage: 50, sectors: [{ name: 'Gaming', color: '#8b5cf6', value: 30 }, { name: 'DeFi', color: '#3b82f6', value: 20 }] },
    { percentage: 60, sectors: [{ name: 'DeFi', color: '#3b82f6', value: 40 }, { name: 'Gaming', color: '#8b5cf6', value: 20 }] },
    { percentage: 70, sectors: [{ name: 'DeFi', color: '#3b82f6', value: 50 }, { name: 'Infrastructure', color: '#10b981', value: 20 }] },
    { percentage: 80, sectors: [{ name: 'DeFi', color: '#3b82f6', value: 45 }, { name: 'Infrastructure', color: '#10b981', value: 35 }] },
    { percentage: 90, sectors: [{ name: 'Infrastructure', color: '#10b981', value: 55 }, { name: 'DeFi', color: '#3b82f6', value: 35 }] },
    { percentage: 100, sectors: [{ name: 'Infrastructure', color: '#10b981', value: 70 }, { name: 'DeFi', color: '#3b82f6', value: 30 }] }
  ];

  const ChangeIndicator = ({ value, type }: { value: string; type: 'up' | 'down' }) => {
    const isPositive = type === 'up';
    return (
      <span style={{ 
        color: isPositive ? '#10b981' : '#ef4444',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '2px'
      }}>
        {value}
        <span style={{ fontSize: '10px' }}>
          {isPositive ? '↗' : '↘'}
        </span>
      </span>
    );
  };

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
            {/* Three Column Grid Layout Skeleton */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '30px',
              marginBottom: '40px'
            }}>
              {/* Left Column - Investor Metrics */}
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

              {/* Middle Column - Hot Sectors */}
              <div>
                <Skeleton height="18px" width="180px" style={{ marginBottom: '20px' }} />
                <CardSkeleton>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '200px',
                    gap: '4px'
                  }}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Skeleton 
                        key={i}
                        width="100%" 
                        height={`${Math.random() * 60 + 20}%`}
                        borderRadius="2px"
                      />
                    ))}
                  </div>
                  
                  <Skeleton height="12px" width="200px" style={{ marginTop: '20px', marginBottom: '16px', marginLeft: 'auto', marginRight: 'auto' }} />
                  
                  {/* Legend */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px'
                  }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Skeleton width="8px" height="8px" borderRadius="2px" />
                        <Skeleton height="10px" width="60px" />
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

                  {/* Divider */}
                  <Skeleton height="1px" width="100%" style={{ marginBottom: '24px' }} />

                  {/* Trending Categories List */}
                  <Skeleton height="12px" width="140px" style={{ marginBottom: '16px' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Skeleton width="12px" height="12px" />
                          <Skeleton height="14px" width="80px" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Skeleton height="14px" width="50px" />
                          <Skeleton height="12px" width="40px" />
                          <Skeleton width="20px" height="12px" />
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
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '30px',
          marginBottom: '40px'
        }}>
          {/* Left Column - Investor Metrics */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
              Investor metrics
            </h2>
            
            {/* Most Active Investors */}
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
                  Most Active Investors
                </h3>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>
                  300 SUM (CHANGE)
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {investors.map((investor) => (
                  <div key={investor.rank} style={{
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af', width: '16px' }}>
                        {investor.rank}
                      </span>
                      <span style={{ fontSize: '14px', color: '#ffffff' }}>
                        {investor.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {investor.deals} deals
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                        {investor.amount}
                      </span>
                      <ChangeIndicator value={investor.change} type={investor.changeType} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Middle Column - Hot Sectors */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
              Hot sectors - market share
            </h2>
            
            <div style={{
              background: '#1A1B1E',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #212228'
            }}>
              <div style={{ marginBottom: '20px' }}>
                {/* 10 Horizontal bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {marketShareBars.map((bar, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        fontSize: '10px',
                        color: '#9ca3af',
                        width: '30px',
                        textAlign: 'right'
                      }}>
                        {bar.percentage}%
                      </div>
                      <div style={{
                        position: 'relative',
                        height: '16px',
                        background: '#13141a',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        flex: 1,
                        cursor: 'pointer',
                        transition: 'opacity 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      title={`${bar.percentage}% - ${bar.sectors.map(s => s.name).join(', ')}`}
                      >
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${bar.percentage}%`,
                          display: 'flex',
                          transition: 'width 0.5s ease'
                        }}>
                          {bar.sectors.map((sector, sectorIndex) => (
                            <div
                              key={sectorIndex}
                              style={{
                                background: sector.color,
                                height: '100%',
                                flex: sector.value,
                                borderRight: sectorIndex < bar.sectors.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                              }}
                            />
                          ))}
                        </div>
                        
                        {/* Percentage value on the bar */}
                        <div style={{
                          position: 'absolute',
                          right: '6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '8px',
                          color: '#ffffff',
                          fontWeight: '600'
                        }}>
                          {bar.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* X-axis - 4 weeks timeline */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#6b7280',
                marginTop: '16px',
                paddingLeft: '42px'
              }}>
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Week 4</span>
              </div>
              
              {/* Chart title and legend */}
              <div style={{
                textAlign: 'center',
                fontSize: '12px',
                color: '#9ca3af',
                marginTop: '20px',
                marginBottom: '16px'
              }}>
                Market Share Distribution - 10 Bars (10% Each)
              </div>
              
              {/* Key sectors legend */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                fontSize: '10px'
              }}>
                {[
                  { name: 'Infrastructure', color: '#10b981' },
                  { name: 'DeFi', color: '#3b82f6' },
                  { name: 'Gaming', color: '#8b5cf6' },
                  { name: 'AI/ML', color: '#f97316' }
                ].map((sector, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: sector.color,
                      borderRadius: '2px'
                    }} />
                    <span style={{ color: '#9ca3af' }}>{sector.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Trending Categories */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#ffffff' }}>
              Trending Categories
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
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>$2.8B</span>
                    <span style={{ fontSize: '12px', color: '#10b981' }}>+2.1% ↗</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#ffffff' }}>Total Deals:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>187</span>
                    <span style={{ fontSize: '12px', color: '#10b981' }}>+4% ↗</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#ffffff' }}>Avg Round Size:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>$15M</span>
                    <span style={{ fontSize: '12px', color: '#10b981' }}>+2.1% ↗</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#ffffff' }}>New Funds Raised:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>$8.5B</span>
                    <span style={{ fontSize: '12px', color: '#ef4444' }}>-0.8% ↘</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#2a2b35', marginBottom: '24px' }}></div>

              {/* Trending Categories Section */}
              <h3 style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#9ca3af',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Trending categories
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {trendingCategories.map((category) => (
                  <div key={category.rank} style={{
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af', width: '16px' }}>
                        {category.rank}
                      </span>
                      <span style={{ fontSize: '14px', color: '#ffffff' }}>
                        {category.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                        {category.amount}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {category.deals} deals
                      </span>
                      <ChangeIndicator value={category.change} type={category.changeType} />
                    </div>
                  </div>
                ))}
              </div>
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
            Funding Timeline (30D)
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
              {fundingTimelineData.map((value, index) => (
                <div
                  key={index}
                  style={{
                    background: 'rgba(196, 181, 253, 0.8)',
                    borderRadius: '2px 2px 0 0',
                    height: `${(value / 300) * 100}%`,
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
                  title={`Data Point ${index + 1}: $${value}M`}
                />
              ))}
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
              <span>$300M</span>
              <span>$250M</span>
              <span>$200M</span>
              <span>$150M</span>
              <span>$100M</span>
              <span>$50M</span>
              <span>$0</span>
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
              // Generate 5 date labels for 30 days (every 7 days approximately)
              for (let i = 4; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - (i * 7));
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
                {fundingData?.last30Days.totalRaised || '$0'}
              </div>
              <div style={{ fontSize: '12px' }}>30-Day Total</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '18px' }}>
                {fundingData ? (() => {
                  const total = fundingData.last30Days.totalRaised;
                  const num = parseFloat(total.replace(/[^0-9.]/g, ''));
                  const isB = total.includes('B');
                  const weeklyAvg = isB ? num / 4 : num / 4000; // Divide by 4 weeks, convert to B if needed
                  return `$${weeklyAvg.toFixed(1)}B`;
                })() : '$0'}
              </div>
              <div style={{ fontSize: '12px' }}>Weekly Avg</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#10b981', fontWeight: '600', fontSize: '18px' }}>
                {fundingData?.last30Days.dealCount || 0}
              </div>
              <div style={{ fontSize: '12px' }}>Total Deals</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '18px' }}>
                {fundingData?.activeDeals || 0}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button style={{
                padding: '6px 12px',
                background: '#13141a',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}>
                BPS
              </button>
              <button style={{
                padding: '6px 12px',
                background: '#13141a',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}>
                Last 30D ▼
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
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
                Search
              </label>
              <input
                type="text"
                placeholder="Search token name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: '#13141a',
                  border: '1px solid #2a2b35',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
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
                Company
              </label>
              <select 
                value={selectedCompany}
                size={1}
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
                }}
                onFocus={(e) => {
                  e.target.size = Math.min(6, uniqueCompanies.length);
                  e.target.style.position = 'absolute';
                  e.target.style.zIndex = '1000';
                  e.target.style.maxHeight = '160px';
                  e.target.style.overflowY = 'auto';
                }}
                onBlur={(e) => {
                  e.target.size = 1;
                  e.target.style.position = 'static';
                  e.target.style.zIndex = 'auto';
                  e.target.style.maxHeight = '40px';
                  e.target.style.overflowY = 'hidden';
                }}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  e.target.size = 1;
                  e.target.style.position = 'static';
                  e.target.style.zIndex = 'auto';
                  e.target.style.maxHeight = '40px';
                  e.target.style.overflowY = 'hidden';
                  e.target.blur();
                }}>
                {uniqueCompanies.map(company => (
                  <option key={company} value={company}>{company}</option>
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
                Investor
              </label>
              <select 
                value={selectedInvestor}
                onChange={(e) => setSelectedInvestor(e.target.value)}
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
                {uniqueInvestors.map(investor => (
                  <option key={investor} value={investor}>{investor}</option>
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
              <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{
                flex: 1,
                background: 'rgba(86, 94, 210, 0.20)',
                border: '1px solid rgba(86, 94, 210, 0.60)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff',
                padding: '8px',
                cursor: 'pointer'
              }}>
                Search
              </button>
              <button 
                onClick={resetAllFilters}
                style={{
                  flex: 1,
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
              <div>Time</div>
              <div>Company</div>
              <div>Round</div>
              <div>Amount</div>
              <div>Lead Investor</div>
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