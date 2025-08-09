'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, Minus, TrendingUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { SharedLayout } from '@/components/shared-layout';
import { ParityDashboardData } from '@/app/types/parity';
import { filterTokens } from '@/app/lib/parity-utils';
import { CardSkeleton, StatsGridSkeleton, TableSkeleton, Skeleton } from '@/components/skeleton';

const TokenListingDashboard = () => {
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [currentPage, setCurrentPage] = useState(1);
  const [parityData, setParityData] = useState<ParityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
  
  const exchanges = [
    'Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit', 'KuCoin', 'Huobi', 'Gate.io', 'MEXC'
  ];

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

  // Filter tokens based on search and exchange selection
  const filteredTokens = parityData ? filterTokens(parityData.tokens, selectedExchanges, searchQuery) : [];
  
  // Calculate coverage overview for filtered tokens
  const getCoverageOverviewForFiltered = () => {
    if (!parityData || filteredTokens.length === 0) {
      return parityData?.coverageOverview;
    }

    // If no exchanges selected, show all tokens stats
    if (selectedExchanges.length === 0) {
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

  const handleExchangeToggle = (exchange: string) => {
    setSelectedExchanges(prev => 
      prev.includes(exchange) 
        ? prev.filter(e => e !== exchange)
        : [...prev, exchange]
    );
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

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
          {/* Left Column - Filter Controls */}
          <div style={{
            background: '#1A1B1E',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #212228'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: '0 0 24px 0' }}>
              Filter Controls
            </h2>

            {/* Search Bar */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontSize: '14px',
                color: '#9ca3af',
                marginBottom: '8px',
                display: 'block'
              }}>
                Search Tokens
              </label>
              <div style={{ position: 'relative' }}>
                <Search style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  placeholder="Search by name or symbol..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    background: '#13141a',
                    border: '1px solid #2a2b35',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Exchange Selection */}
            <div>
              <label style={{
                fontSize: '14px',
                color: '#9ca3af',
                marginBottom: '12px',
                display: 'block'
              }}>
                Show tokens missing from:
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                {exchanges.map(exchange => {
                  const isSelected = selectedExchanges.includes(exchange);
                  return (
                    <button
                      key={exchange}
                      onClick={() => handleExchangeToggle(exchange)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid #414798' : '1px solid #2a2b35',
                        background: isSelected ? '#212440' : '#13141a',
                        transition: 'all 0.2s ease',
                        fontSize: '13px',
                        color: '#ffffff',
                        outline: 'none',
                        whiteSpace: 'nowrap',
                        width: 'auto',
                        minWidth: 'auto'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#1a1b23';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#13141a';
                        }
                      }}
                    >
                      {isSelected && (
                        <span style={{
                          fontSize: '13px',
                          width: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          ✓
                        </span>
                      )}
                      <span>
                        {exchange}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Coverage Overview */}
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
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                  {selectedExchanges.length > 0 
                    ? `Filtered Coverage Overview` 
                    : 'Coverage Overview'
                  }
                </h2>
                {selectedExchanges.length > 0 && (
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                    Showing tokens missing from: {selectedExchanges.join(', ')}
                  </p>
                )}
              </div>
              <button style={{
                fontSize: '14px',
                color: '#9ca3af',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}>
                Save View
              </button>
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
                    color: selectedExchanges.length > 0 ? '#f97316' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {selectedExchanges.length > 0 ? 'filtered' : '+12%'} 
                    {selectedExchanges.length === 0 && <TrendingUp style={{ width: '12px', height: '12px' }} />}
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
                  AVG COVERAGE
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff' }}>
                    {displayedCoverageOverview?.averageCoverage || 0}%
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: selectedExchanges.length > 0 ? '#f97316' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {selectedExchanges.length > 0 ? 'filtered' : '+2.1%'} 
                    {selectedExchanges.length === 0 && <TrendingUp style={{ width: '12px', height: '12px' }} />}
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
                    color: selectedExchanges.length > 0 ? '#f97316' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {selectedExchanges.length > 0 ? 'filtered' : '+2.1%'} 
                    {selectedExchanges.length === 0 && <TrendingUp style={{ width: '12px', height: '12px' }} />}
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
                      background: selectedExchanges.length > 0 
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

        {/* Token Gaps Analysis */}
        <div style={{
          background: '#1A1B1E',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #212228'
        }}>
          {/* Token Gaps Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                Token Gaps Analysis
              </h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                Showing {totalFilteredTokens} of {parityData?.totalRecords || 0} tokens
                {selectedExchanges.length > 0 && ` • Filtered by ${selectedExchanges.join(', ')}`}
              </p>
            </div>
            <button style={{
              fontSize: '14px',
              color: '#9ca3af',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}>
              Export Data
            </button>
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
              <div>Token</div>
              <div>Market Cap</div>
              <div>Volume 24h</div>
              <div style={{ textAlign: 'center' }}>Missing</div>
              <div style={{ textAlign: 'center' }}>Binance</div>
              <div style={{ textAlign: 'center' }}>Coinbase</div>
              <div style={{ textAlign: 'center' }}>Kraken</div>
              <div style={{ textAlign: 'center' }}>OKX</div>
              <div style={{ textAlign: 'center' }}>Bybit</div>
              <div style={{ textAlign: 'center' }}>KuCoin</div>
              <div style={{ textAlign: 'center' }}>Huobi</div>
              <div style={{ textAlign: 'center' }}>Gate.io</div>
              <div style={{ textAlign: 'center' }}>Coverage</div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '3px',
                        background: '#13141a',
                        border: '1px solid #414798',
                        flexShrink: 0,
                        accentColor: '#212440',
                        cursor: 'pointer'
                      }} 
                    />
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