'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check, X, Minus, TrendingUp, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { SharedLayout } from '@/components/shared-layout';
import { ParityDashboardData, ProcessedParityRecord } from '@/app/types/parity';
import { filterTokensByComparison } from '@/app/lib/parity-utils';
import { CardSkeleton, StatsGridSkeleton, TableSkeleton, Skeleton } from '@/components/skeleton';
import styles from './ExchangeComparison.module.css';

const TokenListingDashboard = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [currentPage, setCurrentPage] = useState(1);
  const [parityData, setParityData] = useState<ParityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery] = useState('');
  const [primaryExchange, setPrimaryExchange] = useState<string>('');
  const [compareExchanges, setCompareExchanges] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Dropdown states
  const [primaryDropdownOpen, setPrimaryDropdownOpen] = useState(false);
  const [compareDropdownOpen, setCompareDropdownOpen] = useState(false);
  const [primarySearchTerm, setPrimarySearchTerm] = useState('');
  const [compareSearchTerm, setCompareSearchTerm] = useState('');
  
  // Debounced search terms for better performance
  const [debouncedPrimarySearch, setDebouncedPrimarySearch] = useState('');
  const [debouncedCompareSearch, setDebouncedCompareSearch] = useState('');
  
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

  // Debouncing effect for search terms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPrimarySearch(primarySearchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [primarySearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCompareSearch(compareSearchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [compareSearchTerm]);

  // Fetch parity data
  useEffect(() => {
    const fetchParityData = async () => {
      try {
        const response = await fetch('/api/parity');
        const data = await response.json();
        setParityData(data);
        // Set primary exchange from API data, fallback to 'Binance' if not provided
        setPrimaryExchange(data.baseExchange || 'Binance');
      } catch (error) {
        console.error('Error fetching parity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParityData();
  }, []);

  // Memoized sort function for tokens
  const sortTokens = useCallback((tokens: ProcessedParityRecord[], column: string | null, direction: 'asc' | 'desc') => {
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
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      return direction === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, []);
  
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
  
  // Memoized filter and sort tokens using new comparison model
  const baseFilteredTokens = useMemo(() => {
    return parityData ? filterTokensByComparison(parityData.tokens, primaryExchange, compareExchanges, searchQuery) : [];
  }, [parityData, primaryExchange, compareExchanges, searchQuery]);

  const filteredTokens = useMemo(() => {
    return sortTokens(baseFilteredTokens, sortColumn, sortDirection);
  }, [baseFilteredTokens, sortColumn, sortDirection, sortTokens]);
  
  // Memoized coverage overview calculation for filtered tokens
  const displayedCoverageOverview = useMemo(() => {
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
  }, [parityData, filteredTokens, compareExchanges]);
  
  // Pagination
  const totalFilteredTokens = filteredTokens.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTokens = filteredTokens.slice(startIndex, endIndex);

  // Memoized selection handlers to prevent re-renders
  const handlePrimarySelection = useCallback((exchange: string) => {
    setPrimaryExchange(exchange);
    // Remove from compare if it was there
    setCompareExchanges(prev => prev.filter(e => e !== exchange));
  }, []);
  
  const handleCompareSelection = useCallback((exchange: string) => {
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
  }, [compareExchanges, primaryExchange]);
  

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
                      width={`${60 + (i * 13 % 40)}px`}
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
          <div className={styles.container}>
            <h2 className={styles.title}>
              Exchange Comparison
            </h2>
            <p className={styles.subtitle}>
              Compare listing coverage between exchanges
            </p>

            {/* Dropdown Controls */}
            <div className={styles.dropdownControls}>
              {/* Primary Exchange Dropdown */}
              <div className={styles.dropdownWrapper}>
                <button
                  onClick={() => {
                    setPrimaryDropdownOpen(!primaryDropdownOpen);
                    setCompareDropdownOpen(false);
                  }}
                  className={`${styles.dropdownButton} ${styles.primaryButton} ${primaryDropdownOpen ? styles.active : ''}`}
                >
                  <span>{primaryExchange ? primaryExchange.charAt(0).toUpperCase() + primaryExchange.slice(1) : 'Select Primary'}</span>
                  <span className={`${styles.dropdownIcon} ${primaryDropdownOpen ? styles.open : ''}`}>▼</span>
                </button>
                
                {primaryDropdownOpen && (
                  <div className={styles.dropdownContent}>
                    {/* Search Input */}
                    <div className={styles.searchWrapper}>
                      <input
                        type="text"
                        placeholder="Search exchanges..."
                        value={primarySearchTerm}
                        onChange={(e) => setPrimarySearchTerm(e.target.value)}
                        className={`${styles.searchInput} ${styles.primarySearch}`}
                      />
                    </div>
                    
                    {/* Exchange List */}
                    <div className={styles.exchangeList}>
                      {exchanges.filter(exchange => 
                        exchange.toLowerCase().includes(debouncedPrimarySearch.toLowerCase())
                      ).map(exchange => (
                        <div
                          key={exchange}
                          onClick={() => {
                            handlePrimarySelection(exchange);
                            setPrimaryDropdownOpen(false);
                            setPrimarySearchTerm('');
                          }}
                          className={`${styles.exchangeItem} ${styles.primaryHover}`}
                        >
                          <div className={styles.exchangeItemContent}>
                            <div className={styles.hamburgerIcon}>
                              <div className={styles.hamburgerLine}></div>
                              <div className={styles.hamburgerLine}></div>
                              <div className={styles.hamburgerLine}></div>
                            </div>
                            <span className={styles.exchangeName}>{exchange}</span>
                          </div>
                          {primaryExchange === exchange && (
                            <span className={styles.selectedIndicator}>✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Compare Exchanges Dropdown */}
              <div className={styles.dropdownWrapper}>
                <button
                  onClick={() => {
                    setCompareDropdownOpen(!compareDropdownOpen);
                    setPrimaryDropdownOpen(false);
                  }}
                  className={`${styles.dropdownButton} ${styles.compareButton} ${compareDropdownOpen ? styles.active : ''}`}
                >
                  <span>
                    {compareExchanges.length > 0 
                      ? `Compare (${compareExchanges.length})`
                      : 'Select Compare'
                    }
                  </span>
                  <span className={`${styles.dropdownIcon} ${compareDropdownOpen ? styles.open : ''}`}>▼</span>
                </button>
                
                {compareDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#1A1B1E',
                    border: '1px solid #212228',
                    borderRadius: '8px',
                    marginTop: '4px',
                    zIndex: 1000,
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {/* Search Input */}
                    <div style={{ padding: '12px', borderBottom: '1px solid #212228' }}>
                      <input
                        type="text"
                        placeholder="Search exchanges..."
                        value={compareSearchTerm}
                        onChange={(e) => setCompareSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: '#13141a',
                          border: '1px solid #212228',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#4869EF'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#212228'}
                      />
                    </div>
                    
                    {/* Exchange List */}
                    <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                      {exchanges.filter(exchange => 
                        exchange.toLowerCase().includes(debouncedCompareSearch.toLowerCase()) &&
                        exchange !== primaryExchange
                      ).map(exchange => (
                        <div
                          key={exchange}
                          onClick={() => {
                            if (compareExchanges.length < 4 || compareExchanges.includes(exchange)) {
                              handleCompareSelection(exchange);
                            }
                          }}
                          style={{
                            padding: '14px 16px',
                            cursor: (compareExchanges.length >= 4 && !compareExchanges.includes(exchange)) ? 'not-allowed' : 'pointer',
                            borderBottom: '1px solid #212228',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            opacity: (compareExchanges.length >= 4 && !compareExchanges.includes(exchange)) ? 0.5 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!(compareExchanges.length >= 4 && !compareExchanges.includes(exchange))) {
                              e.currentTarget.style.background = 'rgba(72, 105, 239, 0.1)';
                              e.currentTarget.style.borderRadius = '6px';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderRadius = '0';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              opacity: 0.5
                            }}>
                              <div style={{ width: '12px', height: '2px', background: '#9ca3af', borderRadius: '1px' }}></div>
                              <div style={{ width: '12px', height: '2px', background: '#9ca3af', borderRadius: '1px' }}></div>
                              <div style={{ width: '12px', height: '2px', background: '#9ca3af', borderRadius: '1px' }}></div>
                            </div>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: `2px solid ${compareExchanges.includes(exchange) ? '#4869EF' : '#4869EF'}`,
                              borderRadius: '3px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: compareExchanges.includes(exchange) ? '#4869EF' : 'transparent',
                              transition: 'all 0.2s ease'
                            }}>
                              {compareExchanges.includes(exchange) && (
                                <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: '600' }}>✓</span>
                              )}
                            </div>
                            <span style={{ color: '#ffffff', fontSize: '14px' }}>{exchange}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reset All Button */}
              <button
                onClick={() => {
                  setPrimaryExchange(parityData?.baseExchange || 'Binance');
                  setCompareExchanges([]);
                  setPrimaryDropdownOpen(false);
                  setCompareDropdownOpen(false);
                  setPrimarySearchTerm('');
                  setCompareSearchTerm('');
                }}
                className={styles.resetButton}
              >
                Reset all
              </button>
            </div>

            {/* Status Messages */}
            {compareExchanges.length >= 4 && (
              <div className={styles.statusMessage}>
                <p className={styles.warningMessage}>
                  ⚠️ Maximum of 4 exchanges can be compared
                </p>
              </div>
            )}
            {compareExchanges.length > 0 && compareExchanges.length < 4 && (
              <div className={styles.statusMessage}>
                <p className={styles.infoMessage}>
                  You can select {4 - compareExchanges.length} more exchange{4 - compareExchanges.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Coverage Overview */}
          <div style={{
            background: '#1A1B1E',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #212228'
          }}>
            <div style={{
              marginBottom: '16px'
            }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                  {compareExchanges.length > 0 
                    ? `Comparison Overview` 
                    : 'Coverage Overview'
                  }
                </h2>
                {compareExchanges.length > 0 ? (
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                    Tokens where <span style={{ color: '#10b981' }}>{primaryExchange}</span> differs from{' '}
                    <span style={{ color: '#4869EF' }}>{compareExchanges.join(', ')}</span>
                  </p>
                ) : (
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                    Exchange coverage statistics
                  </p>
                )}
              </div>
            </div>
            
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px'
            }}>
              <div style={{
                background: '#13141a',
                borderRadius: '6px',
                padding: '12px',
                border: '1px solid #2a2b35'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px'
                }}>
                  MISSING
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>
                    {displayedCoverageOverview?.tokensMissing || 0}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: compareExchanges.length > 0 ? '#f97316' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {compareExchanges.length > 0 ? 'filtered' : '+12%'} 
                    {compareExchanges.length === 0 && <TrendingUp style={{ width: '10px', height: '10px' }} />}
                  </span>
                </div>
              </div>
              
              <div style={{
                background: '#13141a',
                borderRadius: '6px',
                padding: '12px',
                border: '1px solid #2a2b35'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px'
                }}>
                  {compareExchanges.length > 0 ? 'MATCH' : 'COVERAGE'}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>
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
                    fontSize: '11px',
                    color: compareExchanges.length > 0 ? '#4869EF' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {compareExchanges.length > 0 ? 'overlap' : '+2.1%'} 
                    {compareExchanges.length === 0 && <TrendingUp style={{ width: '10px', height: '10px' }} />}
                  </span>
                </div>
              </div>
              
              <div style={{
                background: '#13141a',
                borderRadius: '6px',
                padding: '12px',
                border: '1px solid #2a2b35'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px'
                }}>
                  EXCLUSIVE
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>
                    {displayedCoverageOverview?.exclusiveListings || 0}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: compareExchanges.length > 0 ? '#f97316' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {compareExchanges.length > 0 ? 'filtered' : '+2.1%'} 
                    {compareExchanges.length === 0 && <TrendingUp style={{ width: '10px', height: '10px' }} />}
                  </span>
                </div>
              </div>

              <div style={{
                background: '#13141a',
                borderRadius: '6px',
                padding: '12px',
                border: '1px solid #2a2b35'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px'
                }}>
                  RATE
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>
                    {displayedCoverageOverview?.coverageRate || 0}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  background: '#2a2b35',
                  borderRadius: '6px',
                  height: '6px',
                  overflow: 'hidden'
                }}>
                  <div 
                    style={{
                      height: '100%',
                      background: compareExchanges.length > 0 
                        ? 'linear-gradient(90deg, #f97316, #fb923c)' 
                        : 'linear-gradient(90deg, #10b981, #14d395)',
                      borderRadius: '6px',
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
                    {(() => {
                      // Check if token is missing from PRIMARY exchange
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
                      
                      // Show MISS only if NOT on primary exchange
                      return !isOnPrimary && (
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
                      );
                    })()}
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