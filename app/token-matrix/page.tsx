'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check, X, Minus, TrendingUp, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { SharedLayout } from '@/components/shared-layout';
import { ParityDashboardData, ProcessedParityRecord } from '@/app/types/parity';
import { filterTokensByComparison } from '@/app/lib/parity-utils';
import { CardSkeleton, StatsGridSkeleton, TableSkeleton, Skeleton } from '@/components/skeleton';

const TokenListingDashboard = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [currentPage, setCurrentPage] = useState(1);
  const [parityData, setParityData] = useState<ParityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery] = useState('');
  const [primaryExchange, setPrimaryExchange] = useState<string>('Binance');
  const [compareExchanges, setCompareExchanges] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectionStep, setSelectionStep] = useState<'primary' | 'compare' | 'complete'>('complete'); // Start complete since we have default
  
  const exchanges = [
    'Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit', 'KuCoin', 'Huobi', 'Gate.io', 'MEXC'
  ];

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  // Fetch parity data
  useEffect(() => {
    const fetchParityData = async () => {
      try {
        const response = await fetch('/api/parity');
        const data = await response.json();
        setParityData(data);
      } catch (error) {
        console.error('Error fetching parity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParityData();
  }, []);

  // Sort function for tokens
  const sortTokens = (tokens: ProcessedParityRecord[], column: string | null, direction: 'asc' | 'desc') => {
    if (!column) return tokens;
    
    return [...tokens].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      
      switch (column) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'marketCap':
          // Parse market cap from display string (e.g., "$1.2B", "$500M", "$50K")
          aVal = parseMarketCapValue(a.marketCapDisplay);
          bVal = parseMarketCapValue(b.marketCapDisplay);
          break;
        case 'volume':
          aVal = parseMarketCapValue(a.volume24hDisplay);
          bVal = parseMarketCapValue(b.volume24hDisplay);
          break;
        case 'coverage':
          aVal = a.coveragePercentage || 0;
          bVal = b.coveragePercentage || 0;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string') {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };
  
  // Helper function to parse market cap display values
  const parseMarketCapValue = (displayValue: string): number => {
    if (!displayValue || displayValue === '$0' || displayValue === 'N/A') return 0;
    
    const cleanValue = displayValue.replace('$', '').toLowerCase();
    const numericValue = parseFloat(cleanValue);
    
    if (cleanValue.includes('t')) return numericValue * 1e12;
    if (cleanValue.includes('b')) return numericValue * 1e9;
    if (cleanValue.includes('m')) return numericValue * 1e6;
    if (cleanValue.includes('k')) return numericValue * 1e3;
    
    return numericValue || 0;
  };
  
  // Handle column sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc'); // Default to descending for most columns
    }
  };
  
  // Filter and sort tokens using new comparison model
  const baseFilteredTokens = parityData ? filterTokensByComparison(parityData.tokens, primaryExchange, compareExchanges, searchQuery) : [];
  const filteredTokens = sortTokens(baseFilteredTokens, sortColumn, sortDirection);
  
  
  // Calculate coverage overview for filtered tokens
  const getCoverageOverviewForFiltered = () => {
    if (!parityData || filteredTokens.length === 0) {
      return parityData?.coverageOverview;
    }

    // If no compare exchanges selected, show all tokens stats
    if (compareExchanges.length === 0) {
      return parityData.coverageOverview;
    }

    // Calculate stats for filtered tokens (tokens missing from selected exchanges)
    const totalFiltered = filteredTokens.length;
    const totalCoverage = filteredTokens.reduce((sum, token) => sum + token.coveragePercentage, 0);
    const averageCoverage = totalFiltered > 0 ? Math.round(totalCoverage / totalFiltered) : 0;
    const exclusiveListings = filteredTokens.filter(t => t.coverageCount <= 2).length;
    // For filtered tokens, coverage rate is the average coverage percentage of the filtered set
    const coverageRate = averageCoverage;

    return {
      tokensMissing: totalFiltered,
      totalTokens: totalFiltered,
      averageCoverage,
      exclusiveListings,
      coverageRate,
      topMissingExchanges: parityData.coverageOverview.topMissingExchanges
    };
  };

  const displayedCoverageOverview = getCoverageOverviewForFiltered();
  
  // Pagination
  const totalFilteredTokens = filteredTokens.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTokens = filteredTokens.slice(startIndex, endIndex);

  // Step-based selection handlers
  const handlePrimarySelection = (exchange: string) => {
    setPrimaryExchange(exchange);
    // Remove from compare if it was there
    setCompareExchanges(prev => prev.filter(e => e !== exchange));
  };
  
  const handleCompareSelection = (exchange: string) => {
    const isInCompare = compareExchanges.includes(exchange);
    if (isInCompare) {
      // Remove from compare
      setCompareExchanges(prev => prev.filter(e => e !== exchange));
    } else {
      // Add to compare (if not primary and space available)
      if (exchange !== primaryExchange && compareExchanges.length < 4) {
        setCompareExchanges(prev => [...prev, exchange]);
      }
    }
  };
  
  const goToCompareStep = () => {
    setSelectionStep('compare');
  };
  
  const goToPrimaryStep = () => {
    setSelectionStep('primary');
    setCompareExchanges([]); // Clear compare selections
  };
  
  const completeSelection = () => {
    setSelectionStep('complete');
    setCurrentPage(1); // Reset pagination
  };
  
  const startNewSelection = () => {
    setSelectionStep('primary');
    setPrimaryExchange('');
    setCompareExchanges([]);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  // Check auth loading
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

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <SharedLayout currentPage="token-matrix">
        <div style={{
          padding: '30px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif'
        }}>
          {/* Header Skeleton */}
          <div style={{ marginBottom: '30px' }}>
            <Skeleton height="24px" width="300px" style={{ marginBottom: '10px' }} />
            <Skeleton height="14px" width="400px" />
          </div>

          {/* Two Column Layout Skeleton */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
            marginBottom: '30px'
          }}>
            {/* Left Column - Filter Controls Skeleton */}
            <CardSkeleton>
              <Skeleton height="18px" width="140px" style={{ marginBottom: '24px' }} />
              
              {/* Search Bar Skeleton */}
              <div style={{ marginBottom: '24px' }}>
                <Skeleton height="14px" width="100px" style={{ marginBottom: '8px' }} />
                <Skeleton height="36px" width="100%" borderRadius="8px" />
              </div>

              {/* Exchange Buttons Skeleton */}
              <div>
                <Skeleton height="14px" width="180px" style={{ marginBottom: '12px' }} />
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Skeleton 
                      key={i}
                      height="32px" 
                      width={`${60 + Math.random() * 40}px`}
                      borderRadius="8px"
                    />
                  ))}
                </div>
              </div>
            </CardSkeleton>

            {/* Right Column - Coverage Overview Skeleton */}
            <CardSkeleton>
              <div style={{ marginBottom: '24px' }}>
                <Skeleton height="18px" width="180px" style={{ marginBottom: '4px' }} />
                <Skeleton height="12px" width="120px" />
              </div>
              <StatsGridSkeleton />
            </CardSkeleton>
          </div>

          {/* Token Gaps Analysis Skeleton */}
          <CardSkeleton>
            <div style={{ marginBottom: '24px' }}>
              <Skeleton height="18px" width="200px" style={{ marginBottom: '4px' }} />
              <Skeleton height="14px" width="300px" />
            </div>
            <TableSkeleton rows={8} columns={13} />
            
            {/* Pagination Skeleton */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '16px'
            }}>
              <Skeleton height="14px" width="120px" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Skeleton height="28px" width="140px" />
                <Skeleton height="24px" width="100px" />
              </div>
            </div>
          </CardSkeleton>
        </div>
      </SharedLayout>
    );
  }

  const ExchangeIcon: React.FC<{ available: boolean; partial?: boolean }> = ({ available, partial }) => {
    if (partial) return <Minus className="w-4 h-4" style={{ color: '#9ca3af' }} />;
    if (available) return <Check className="w-4 h-4" style={{ color: '#10b981' }} />;
    return <X className="w-4 h-4" style={{ color: '#6b7280' }} />;
  };


  return (
    <SharedLayout currentPage="token-matrix">
      <div style={{
        padding: '30px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '30px'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 10px 0', color: '#ffffff' }}>
            Listings Parity Analysis
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>
            Exchange coverage and token listing analysis
          </p>
        </div>

        {/* Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          marginBottom: '30px'
        }}>
          {/* Left Column - Exchange Comparison */}
          <div style={{
            background: '#1A1B1E',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #212228'
          }}>
            {/* Step Progress Indicator */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: selectionStep === 'primary' ? '#3b82f6' : primaryExchange ? '#10b981' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#ffffff'
                  }}>
                    {primaryExchange && selectionStep !== 'primary' ? '✓' : '1'}
                  </div>
                  <span style={{ fontSize: '14px', color: selectionStep === 'primary' ? '#ffffff' : '#9ca3af' }}>Select Primary</span>
                </div>
                
                <div style={{ width: '20px', height: '2px', background: '#2a2b35' }} />
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: selectionStep === 'compare' ? '#3b82f6' : (selectionStep === 'complete' && compareExchanges.length > 0) ? '#10b981' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#ffffff'
                  }}>
                    {selectionStep === 'complete' && compareExchanges.length > 0 ? '✓' : '2'}
                  </div>
                  <span style={{ fontSize: '14px', color: selectionStep === 'compare' ? '#ffffff' : '#9ca3af' }}>Select Compare</span>
                </div>
                
                <div style={{ width: '20px', height: '2px', background: '#2a2b35' }} />
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: selectionStep === 'complete' ? '#10b981' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#ffffff'
                  }}>
                    {selectionStep === 'complete' ? '✓' : '3'}
                  </div>
                  <span style={{ fontSize: '14px', color: selectionStep === 'complete' ? '#ffffff' : '#9ca3af' }}>Compare</span>
                </div>
              </div>
            </div>
            
            {/* Step Content */}
            {selectionStep === 'primary' && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0' }}>
                  Step 1: Select Primary Exchange
                </h2>
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 24px 0' }}>
                  Choose the main exchange to use as your reference point
                </p>
              </div>
            )}
            
            {selectionStep === 'compare' && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0' }}>
                  Step 2: Select Compare Exchanges
                </h2>
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 24px 0' }}>
                  Choose up to 4 exchanges to compare against <span style={{ color: '#10b981', fontWeight: '500' }}>{primaryExchange}</span>
                </p>
              </div>
            )}
            
            {selectionStep === 'complete' && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0' }}>
                  Exchange Comparison
                </h2>
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 24px 0' }}>
                  Comparing <span style={{ color: '#10b981', fontWeight: '500' }}>{primaryExchange}</span> against{' '}
                  <span style={{ color: '#3b82f6', fontWeight: '500' }}>
                    {compareExchanges.length > 0 ? compareExchanges.join(', ') : 'all exchanges'}
                  </span>
                </p>
              </div>
            )}

            {/* Exchange Chips */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {exchanges.map(exchange => {
                const isPrimary = primaryExchange === exchange;
                const isCompare = compareExchanges.includes(exchange);
                const isSelected = selectionStep === 'primary' ? isPrimary : selectionStep === 'compare' ? (isPrimary || isCompare) : (isPrimary || isCompare);
                const isDisabled = false; // Don't disable, just don't respond to clicks when inappropriate
                
                return (
                  <button
                    key={exchange}
                    onClick={() => {
                      if (selectionStep === 'primary') {
                        handlePrimarySelection(exchange);
                      } else if (selectionStep === 'compare' && exchange !== primaryExchange) {
                        handleCompareSelection(exchange);
                      }
                      // Do nothing if clicking PRIMARY during compare step
                    }}
                    disabled={isDisabled}
                    style={{
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '44px',
                      padding: '0 28px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '400',
                      cursor: (selectionStep === 'compare' && isPrimary) ? 'default' : 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      opacity: 1,
                      
                      // Dynamic styling based on step and selection
                      background: isSelected ? 
                        (selectionStep === 'primary' || isPrimary ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)') : 
                        '#13141a',
                      border: isSelected ? 
                        (selectionStep === 'primary' || isPrimary ? '1.5px solid #10b981' : '1.5px solid #3b82f6') :
                        '1px solid #212228',
                      color: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !(selectionStep === 'compare' && isPrimary)) {
                        e.currentTarget.style.borderColor = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !(selectionStep === 'compare' && isPrimary)) {
                        e.currentTarget.style.borderColor = '#212228';
                      }
                    }}
                  >
                    {/* PRIMARY bubble - always show when is primary */}
                    {isPrimary && (
                      <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '4px',
                        fontSize: '9px',
                        fontWeight: '700',
                        color: '#ffffff',
                        backgroundColor: '#10b981',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        lineHeight: '12px',
                        border: '2px solid #1A1B1E',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: 10
                      }}>
                        PRIMARY
                      </span>
                    )}
                    
                    {/* COMPARE bubble - always show when is compare */}
                    {isCompare && (
                      <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '4px',
                        fontSize: '9px',
                        fontWeight: '700',
                        color: '#ffffff',
                        backgroundColor: '#3b82f6',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        lineHeight: '12px',
                        border: '2px solid #1A1B1E',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: 10
                      }}>
                        COMPARE
                      </span>
                    )}
                    
                    {/* Selection checkmark for active selection steps (only when no primary/compare label) */}
                    {!isPrimary && !isCompare && selectionStep !== 'complete' && isSelected && (
                      <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: selectionStep === 'primary' ? '#10b981' : '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: '#ffffff',
                        border: '2px solid #1A1B1E',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        ✓
                      </span>
                    )}
                    
                    {exchange}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {selectionStep === 'primary' && primaryExchange && (
                <button
                  onClick={goToCompareStep}
                  style={{
                    padding: '8px 16px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                >
                  Next: Select Compare
                </button>
              )}
              
              {selectionStep === 'compare' && (
                <>
                  <button
                    onClick={goToPrimaryStep}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      color: '#9ca3af',
                      border: '1px solid #2a2b35',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '400',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#ffffff';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2b35';
                      e.currentTarget.style.color = '#9ca3af';
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={completeSelection}
                    disabled={compareExchanges.length === 0}
                    style={{
                      padding: '8px 16px',
                      background: compareExchanges.length > 0 ? '#10b981' : '#374151',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: compareExchanges.length > 0 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease',
                      opacity: compareExchanges.length > 0 ? 1 : 0.5
                    }}
                    onMouseEnter={(e) => {
                      if (compareExchanges.length > 0) {
                        e.currentTarget.style.background = '#059669';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (compareExchanges.length > 0) {
                        e.currentTarget.style.background = '#10b981';
                      }
                    }}
                  >
                    Start Comparison ({compareExchanges.length} selected)
                  </button>
                </>
              )}
              
              {selectionStep === 'complete' && (
                <button
                  onClick={startNewSelection}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Change Selection
                </button>
              )}
            </div>
            
            {/* Status Messages */}
            {selectionStep === 'compare' && compareExchanges.length >= 4 && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontSize: '12px', color: '#f97316', margin: 0 }}>
                  ⚠️ Maximum of 4 exchanges can be compared
                </p>
              </div>
            )}
            {selectionStep === 'compare' && compareExchanges.length > 0 && compareExchanges.length < 4 && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                  You can select {4 - compareExchanges.length} more exchange{4 - compareExchanges.length !== 1 ? 's' : ''} or proceed with current selection
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Coverage Overview */}
          <div style={{
            background: '#1A1B1E',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #212228'
          }}>
            <div style={{
              marginBottom: '24px'
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                  {compareExchanges.length > 0 
                    ? `Comparison Overview` 
                    : 'Coverage Overview'
                  }
                </h2>
                {compareExchanges.length > 0 ? (
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                    Tokens where <span style={{ color: '#10b981' }}>{primaryExchange}</span> differs from{' '}
                    <span style={{ color: '#3b82f6' }}>{compareExchanges.join(', ')}</span>
                  </p>
                ) : (
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                    Overall exchange coverage statistics
                  </p>
                )}
              </div>
            </div>
            
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px'
            }}>
              <div style={{
                background: '#13141a',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #2a2b35'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px'
                }}>
                  TOKENS MISSING
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff' }}>
                    {displayedCoverageOverview?.tokensMissing || 0}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: compareExchanges.length > 0 ? '#f97316' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {compareExchanges.length > 0 ? 'filtered' : '+12%'} 
                    {compareExchanges.length === 0 && <TrendingUp style={{ width: '12px', height: '12px' }} />}
                  </span>
                </div>
              </div>
              
              <div style={{
                background: '#13141a',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #2a2b35'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px'
                }}>
                  {compareExchanges.length > 0 ? 'COVERAGE MATCH' : 'AVG COVERAGE'}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff' }}>
                    {(() => {
                      if (compareExchanges.length === 0) {
                        return `${displayedCoverageOverview?.averageCoverage || 0}%`;
                      }
                      // Calculate coverage match percentage between primary and compare exchanges
                      const totalTokens = filteredTokens.length || 1;
                      const matchingTokens = filteredTokens.filter(token => {
                        const isOnPrimary = (() => {
                          switch (primaryExchange.toLowerCase()) {
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
                        const isOnAnyCompare = compareExchanges.some(exchange => {
                          switch (exchange.toLowerCase()) {
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
                        });
                        // Both primary and at least one compare have the token
                        return isOnPrimary && isOnAnyCompare;
                      }).length;
                      return `${Math.round((matchingTokens / totalTokens) * 100)}%`;
                    })()
                  }
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: compareExchanges.length > 0 ? '#3b82f6' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {compareExchanges.length > 0 ? 'overlap' : '+2.1%'} 
                    {compareExchanges.length === 0 && <TrendingUp style={{ width: '12px', height: '12px' }} />}
                  </span>
                </div>
              </div>
              
              <div style={{
                background: '#13141a',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #2a2b35'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px'
                }}>
                  EXCLUSIVE
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff' }}>
                    {displayedCoverageOverview?.exclusiveListings || 0}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: compareExchanges.length > 0 ? '#f97316' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {compareExchanges.length > 0 ? 'filtered' : '+2.1%'} 
                    {compareExchanges.length === 0 && <TrendingUp style={{ width: '12px', height: '12px' }} />}
                  </span>
                </div>
              </div>

              <div style={{
                background: '#13141a',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #2a2b35'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px'
                }}>
                  COVERAGE RATE
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff' }}>
                    {displayedCoverageOverview?.coverageRate || 0}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  background: '#2a2b35',
                  borderRadius: '8px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div 
                    style={{
                      height: '100%',
                      background: compareExchanges.length > 0 
                        ? 'linear-gradient(90deg, #f97316, #fb923c)' 
                        : 'linear-gradient(90deg, #10b981, #14d395)',
                      borderRadius: '8px',
                      transition: 'width 0.5s ease',
                      width: `${displayedCoverageOverview?.coverageRate || 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Comparison Results - Only show when comparing */}
        {compareExchanges.length > 0 && (
          <div style={{
            background: '#1A1B1E',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #212228',
            marginBottom: '30px'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: '0 0 8px 0' }}>
                Exchange Comparison Results
              </h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                Side-by-side analysis of token availability differences
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {/* Primary Exchange Column */}
              <div style={{
                background: '#13141a',
                borderRadius: '8px',
                padding: '20px',
                border: '1.5px solid rgba(16, 185, 129, 0.3)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981'
                  }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                    {primaryExchange}
                  </h3>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#ffffff',
                    backgroundColor: '#10b981',
                    padding: '2px 6px',
                    borderRadius: '3px'
                  }}>
                    PRIMARY
                  </span>
                </div>
                
                {/* Primary exchange stats */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>TOKENS MISSING</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>
                    {filteredTokens.filter(token => {
                      const isOnPrimary = (() => {
                        switch (primaryExchange.toLowerCase()) {
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
                      return !isOnPrimary;
                    }).length}
                  </div>
                </div>
                
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  Missing tokens available on compared exchanges
                </div>
              </div>

              {/* Compare Exchanges Columns */}
              {compareExchanges.map(exchange => (
                <div key={exchange} style={{
                  background: '#13141a',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1.5px solid rgba(59, 130, 246, 0.3)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6'
                    }} />
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                      {exchange}
                    </h3>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#ffffff',
                      backgroundColor: '#3b82f6',
                      padding: '2px 6px',
                      borderRadius: '3px'
                    }}>
                      COMPARE
                    </span>
                  </div>
                  
                  {/* Compare exchange stats */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>TOKENS MISSING</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>
                      {filteredTokens.filter(token => {
                        const isOnCompare = (() => {
                          switch (exchange.toLowerCase()) {
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
                        return !isOnCompare;
                      }).length}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Missing compared to {primaryExchange}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Quick Insights */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.1)'
            }}>
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '500', marginBottom: '8px' }}>
                Quick Insights
              </div>
              <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '18px' }}>
                {(() => {
                  const primaryMissing = filteredTokens.filter(token => {
                    const isOnPrimary = (() => {
                      switch (primaryExchange.toLowerCase()) {
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
                    return !isOnPrimary;
                  }).length;
                  
                  if (primaryMissing > 0) {
                    return `${primaryExchange} could list ${primaryMissing} additional tokens to match competitor coverage.`;
                  } else {
                    return `${primaryExchange} has comprehensive coverage of tokens available on compared exchanges.`;
                  }
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Token Gaps Analysis */}
        <div style={{
          background: '#1A1B1E',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #212228'
        }}>
          {/* Token Gaps Header */}
          <div style={{
            marginBottom: '24px'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                Token Gaps Analysis
              </h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                Showing {totalFilteredTokens} of {parityData?.totalRecords || 0} tokens
                {compareExchanges.length > 0 && ` • Comparing ${primaryExchange} vs ${compareExchanges.join(', ')}`}
                {sortColumn && ` • Sorted by ${sortColumn === 'marketCap' ? 'Market Cap' : sortColumn === 'name' ? 'Name' : sortColumn === 'volume' ? 'Volume' : 'Coverage'} (${sortDirection === 'desc' ? 'High to Low' : 'Low to High'})`}
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                Click column headers to sort • Market Cap, Volume, Name, Coverage
              </p>
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
              gridTemplateColumns: '2.5fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr',
              gap: '8px',
              padding: '12px 16px',
              background: '#1a1b23',
              borderBottom: '1px solid #2a2b35',
              fontSize: '11px',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <div 
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  padding: '4px 2px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  background: sortColumn === 'name' ? '#212440' : 'transparent',
                  color: sortColumn === 'name' ? '#ffffff' : '#9ca3af',
                  margin: '0 -2px'
                }}
                onClick={() => handleSort('name')}
                onMouseEnter={(e) => {
                  if (sortColumn !== 'name') {
                    e.currentTarget.style.background = '#1a1b23';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortColumn !== 'name') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                Token
                {sortColumn === 'name' ? (
                  sortDirection === 'asc' ? 
                    <ChevronUp style={{ width: '12px', height: '12px', color: '#10b981' }} /> : 
                    <ChevronDown style={{ width: '12px', height: '12px', color: '#10b981' }} />
                ) : (
                  <div style={{ width: '12px', height: '12px', opacity: 0.3 }}>
                    <ChevronUp style={{ width: '12px', height: '12px' }} />
                  </div>
                )}
              </div>
              <div 
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  padding: '4px 2px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  background: sortColumn === 'marketCap' ? '#212440' : 'transparent',
                  color: sortColumn === 'marketCap' ? '#ffffff' : '#9ca3af',
                  border: sortColumn === 'marketCap' ? '1px solid #414798' : '1px solid transparent',
                  margin: '0 -2px'
                }}
                onClick={() => handleSort('marketCap')}
                onMouseEnter={(e) => {
                  if (sortColumn !== 'marketCap') {
                    e.currentTarget.style.background = '#1a1b23';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = '#414798';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortColumn !== 'marketCap') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                Market Cap
                {sortColumn === 'marketCap' ? (
                  sortDirection === 'asc' ? 
                    <ChevronUp style={{ width: '12px', height: '12px', color: '#10b981' }} /> : 
                    <ChevronDown style={{ width: '12px', height: '12px', color: '#10b981' }} />
                ) : (
                  <div style={{ width: '12px', height: '12px', opacity: 0.3 }}>
                    <ChevronUp style={{ width: '12px', height: '12px' }} />
                  </div>
                )}
              </div>
              <div 
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  padding: '4px 2px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  background: sortColumn === 'volume' ? '#212440' : 'transparent',
                  color: sortColumn === 'volume' ? '#ffffff' : '#9ca3af',
                  margin: '0 -2px'
                }}
                onClick={() => handleSort('volume')}
                onMouseEnter={(e) => {
                  if (sortColumn !== 'volume') {
                    e.currentTarget.style.background = '#1a1b23';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortColumn !== 'volume') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                Volume 24h
                {sortColumn === 'volume' ? (
                  sortDirection === 'asc' ? 
                    <ChevronUp style={{ width: '12px', height: '12px', color: '#10b981' }} /> : 
                    <ChevronDown style={{ width: '12px', height: '12px', color: '#10b981' }} />
                ) : (
                  <div style={{ width: '12px', height: '12px', opacity: 0.3 }}>
                    <ChevronUp style={{ width: '12px', height: '12px' }} />
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>Missing</div>
              <div style={{ textAlign: 'center' }}>Binance</div>
              <div style={{ textAlign: 'center' }}>Coinbase</div>
              <div style={{ textAlign: 'center' }}>Kraken</div>
              <div style={{ textAlign: 'center' }}>OKX</div>
              <div style={{ textAlign: 'center' }}>Bybit</div>
              <div style={{ textAlign: 'center' }}>KuCoin</div>
              <div style={{ textAlign: 'center' }}>Huobi</div>
              <div style={{ textAlign: 'center' }}>Gate.io</div>
              <div 
                style={{ 
                  textAlign: 'center', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '4px',
                  padding: '4px 2px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  background: sortColumn === 'coverage' ? '#212440' : 'transparent',
                  color: sortColumn === 'coverage' ? '#ffffff' : '#9ca3af',
                  margin: '0 -2px'
                }}
                onClick={() => handleSort('coverage')}
                onMouseEnter={(e) => {
                  if (sortColumn !== 'coverage') {
                    e.currentTarget.style.background = '#1a1b23';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (sortColumn !== 'coverage') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                Coverage
                {sortColumn === 'coverage' ? (
                  sortDirection === 'asc' ? 
                    <ChevronUp style={{ width: '12px', height: '12px', color: '#10b981' }} /> : 
                    <ChevronDown style={{ width: '12px', height: '12px', color: '#10b981' }} />
                ) : (
                  <div style={{ width: '12px', height: '12px', opacity: 0.3 }}>
                    <ChevronUp style={{ width: '12px', height: '12px' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Table Rows */}
            <div>
              {paginatedTokens.map((token, index) => (
                <div 
                  key={token.id} 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2.5fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr',
                    gap: '8px',
                    padding: '12px 16px',
                    borderBottom: index < paginatedTokens.length - 1 ? '1px solid #2a2b35' : 'none',
                    alignItems: 'center',
                    transition: 'background 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1a1b23'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ minWidth: 0, position: 'relative' }}>
                      <div style={{
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#ffffff',
                        fontSize: '13px'
                      }}>
                        <span 
                          style={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '180px',
                            cursor: 'help'
                          }}
                          title={`${token.name} (${token.symbol})`}
                        >
                          {token.name} ({token.symbol})
                        </span>
                        {token.rank <= 50 && <TrendingUp style={{ width: '10px', height: '10px', color: '#f97316', flexShrink: 0 }} />}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>#{token.rank}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#ffffff' }}>{token.marketCapDisplay}</div>
                  <div style={{ fontSize: '13px', color: '#ffffff' }}>{token.volume24hDisplay}</div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {token.isMissing && (
                      <span style={{
                        padding: '1px 4px',
                        background: 'rgba(249, 115, 22, 0.2)',
                        color: '#f97316',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        MISS
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ExchangeIcon available={token.exchanges.binance} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ExchangeIcon available={token.exchanges.coinbase} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ExchangeIcon available={token.exchanges.kraken} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ExchangeIcon available={token.exchanges.okx} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ExchangeIcon available={token.exchanges.bybit} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ExchangeIcon available={token.exchanges.kucoin} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ExchangeIcon available={token.exchanges.huobi} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ExchangeIcon available={token.exchanges.gate} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#ffffff' }}>
                      {token.coverageRatio}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                      {token.coveragePercentage}%
                    </div>
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
              Total: <span style={{ fontWeight: '500', color: '#ffffff' }}>{totalFilteredTokens}</span> rows
              {totalFilteredTokens !== parityData?.totalRecords && (
                <span> (filtered from {parityData?.totalRecords})</span>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#9ca3af' }}>Rows per page</span>
                <select 
                  style={{
                    background: '#1a1b23',
                    border: '1px solid #2a2b35',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    outline: 'none',
                    color: '#ffffff'
                  }}
                  value={rowsPerPage}
                  onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                >
                  <option value={500}>500</option>
                  <option value={100}>100</option>
                  <option value={50}>50</option>
                  <option value={10}>10</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                  {startIndex + 1}-{Math.min(endIndex, totalFilteredTokens)} of {totalFilteredTokens}
                </span>
                <button 
                  style={{
                    padding: '4px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    color: currentPage === 1 ? '#6b7280' : '#9ca3af',
                    transition: 'background 0.3s ease'
                  }}
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  onMouseEnter={(e) => {
                    if (currentPage > 1) {
                      e.currentTarget.style.background = '#1a1b23';
                    }
                  }}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <ChevronLeft style={{ width: '16px', height: '16px' }} />
                </button>
                <button 
                  style={{
                    padding: '4px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: endIndex >= totalFilteredTokens ? 'not-allowed' : 'pointer',
                    color: endIndex >= totalFilteredTokens ? '#6b7280' : '#9ca3af',
                    transition: 'background 0.3s ease'
                  }}
                  onClick={() => endIndex < totalFilteredTokens && setCurrentPage(currentPage + 1)}
                  disabled={endIndex >= totalFilteredTokens}
                  onMouseEnter={(e) => {
                    if (endIndex < totalFilteredTokens) {
                      e.currentTarget.style.background = '#1a1b23';
                    }
                  }}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <ChevronRight style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default TokenListingDashboard;