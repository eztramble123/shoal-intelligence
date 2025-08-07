'use client';

import { useState } from 'react';
import { Search, Filter, Download, CheckCircle, XCircle, Star, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MetricCard } from '@/components/dashboard/metric-card';
import { DataTable, Column } from '@/components/dashboard/data-table';
import { 
  sampleTokens, 
  EXCHANGES, 
  Token, 
  calculateCoveragePercentage, 
  formatCurrency, 
  coverageStats 
} from '@/lib/sample-data';

interface TokenMatrixData {
  token: Token;
  volume24h: string;
  marketCap: string;
  recentListing?: string;
  yourExchange: boolean;
  exchanges: Record<string, boolean>;
  coverageCount: string;
  coveragePercent: number;
  priority: 'high' | 'medium' | 'low';
}

const CATEGORIES = ['All', 'DeFi', 'Layer 1', 'Layer 2', 'Memecoin', 'Infrastructure', 'Storage Protocol'];

export default function TokenMatrix() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyGaps, setShowOnlyGaps] = useState(false);

  const processedTokens: TokenMatrixData[] = sampleTokens.map(token => {
    const coveragePercent = calculateCoveragePercentage(token);
    const listedCount = token.listings.filter(l => l.listed).length;
    const totalCount = token.listings.length;
    
    const exchanges: Record<string, boolean> = {};
    token.listings.forEach(listing => {
      if (listing.exchange !== 'Your Exchange') {
        exchanges[listing.exchange] = listing.listed;
      }
    });

    const yourExchangeListing = token.listings.find(l => l.exchange === 'Your Exchange');
    
    return {
      token,
      volume24h: formatCurrency(token.volume24h),
      marketCap: formatCurrency(token.marketCap),
      recentListing: token.listings
        .filter(l => l.listed && l.date)
        .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0]?.exchange,
      yourExchange: yourExchangeListing?.listed || false,
      exchanges,
      coverageCount: `${listedCount}/${totalCount}`,
      coveragePercent,
      priority: coveragePercent < 60 ? 'high' : coveragePercent < 80 ? 'medium' : 'low'
    };
  });

  const filteredTokens = processedTokens.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.token.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      item.token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.token.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGapFilter = !showOnlyGaps || !item.yourExchange;
    
    return matchesCategory && matchesSearch && matchesGapFilter;
  });

  const priorityTokens = filteredTokens.filter(t => t.priority === 'high').slice(0, 3);

  const columns: Column<TokenMatrixData>[] = [
    {
      key: 'favorite',
      header: '',
      width: '50px',
      render: () => (
        <Star className="dashboard-icon-sm text-[var(--dashboard-text-muted)] cursor-pointer hover:text-[var(--dashboard-yellow)]" />
      )
    },
    {
      key: 'token',
      header: 'Token',
      width: '200px',
      sortable: true,
      render: (item) => (
        <div>
          <div className="text-[var(--dashboard-text-primary)] font-medium">
            {item.token.name} ({item.token.symbol})
          </div>
          <div className="text-[var(--dashboard-text-secondary)] text-xs">
            {item.token.category} • {item.token.chain}
            {item.token.trending && (
              <span className="ml-2 text-[var(--dashboard-blue)]">Trending #{item.token.trending}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'volume24h',
      header: 'Volume (24h)',
      sortable: true,
      render: (item) => (
        <span className="text-[var(--dashboard-text-primary)] font-medium">{item.volume24h}</span>
      )
    },
    {
      key: 'recentListing',
      header: 'Recent Listing',
      render: (item) => (
        <span className="text-[var(--dashboard-text-secondary)] text-sm">
          {item.recentListing || 'None recent'}
        </span>
      )
    },
    {
      key: 'yourExchange',
      header: 'Your Exchange',
      render: (item) => (
        item.yourExchange ? (
          <CheckCircle className="dashboard-icon-sm text-[var(--dashboard-green)]" />
        ) : (
          <span className="dashboard-status warning text-xs px-2 py-1">MISS</span>
        )
      )
    },
    ...EXCHANGES.filter(ex => ex !== 'Your Exchange').map(exchange => ({
      key: exchange,
      header: exchange,
      width: '80px',
      render: (item: TokenMatrixData) => (
        item.exchanges[exchange] ? (
          <CheckCircle className="dashboard-icon-sm text-[var(--dashboard-green)]" />
        ) : (
          <XCircle className="dashboard-icon-sm text-[var(--dashboard-text-muted)]" />
        )
      )
    })),
    {
      key: 'coverage',
      header: 'Coverage',
      sortable: true,
      render: (item) => (
        <div className="text-center">
          <div className="text-[var(--dashboard-text-primary)] font-medium">{item.coverageCount}</div>
          <div className={`text-xs ${
            item.coveragePercent >= 80 ? 'text-[var(--dashboard-green)]' :
            item.coveragePercent >= 60 ? 'text-[var(--dashboard-orange)]' :
            'text-[var(--dashboard-red)]'
          }`}>
            {item.coveragePercent}%
          </div>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      {/* Key Metrics */}
      <div className="dashboard-grid-4">
        <MetricCard
          label="Average Coverage"
          value={`${coverageStats.averageCoverage}%`}
          change={{ value: "+2.1%", type: "positive" }}
        />
        <MetricCard
          label="Total Tokens Tracked"
          value={sampleTokens.length}
        />
        <MetricCard
          label="Missing Listings"
          value={coverageStats.missingTokens}
          icon={<AlertTriangle className="dashboard-icon text-[var(--dashboard-orange)]" />}
        />
        <MetricCard
          label="High Priority Gaps"
          value={priorityTokens.length}
          icon={<AlertTriangle className="dashboard-icon text-[var(--dashboard-red)]" />}
        />
      </div>

      {/* High Priority Gaps */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h3 className="dashboard-card-title">High Priority Gaps</h3>
            <p className="dashboard-card-subtitle">Tokens with high volume but low exchange coverage</p>
          </div>
        </div>
        
        <div className="dashboard-grid-3">
          {priorityTokens.map((tokenData, index) => (
            <div key={tokenData.token.id} className="dashboard-card border-l-4 border-l-[var(--dashboard-red)]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-lg font-semibold text-[var(--dashboard-text-primary)] mb-1">
                    #{index + 1} {tokenData.token.symbol}
                  </div>
                  <div className="text-[var(--dashboard-text-secondary)] text-sm">
                    {tokenData.token.name} • {tokenData.token.category}
                  </div>
                </div>
                <span className="dashboard-status error">{tokenData.coveragePercent}%</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--dashboard-text-secondary)]">Volume (24h)</span>
                  <span className="text-[var(--dashboard-text-primary)] font-medium">{tokenData.volume24h}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--dashboard-text-secondary)]">Coverage</span>
                  <span className="text-[var(--dashboard-text-primary)] font-medium">{tokenData.coverageCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--dashboard-text-secondary)]">Your Exchange</span>
                  <span className={tokenData.yourExchange ? 'text-[var(--dashboard-green)]' : 'text-[var(--dashboard-red)]'}>
                    {tokenData.yourExchange ? 'Listed' : 'Missing'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Token Matrix Table */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h3 className="dashboard-card-title">Token Listings Matrix</h3>
            <p className="dashboard-card-subtitle">Complete exchange coverage analysis</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="dashboard-btn dashboard-btn-secondary dashboard-btn-sm">
              <Filter className="dashboard-icon-sm mr-1" />
              Filter
            </button>
            <button className="dashboard-btn dashboard-btn-secondary dashboard-btn-sm">
              <Download className="dashboard-icon-sm mr-1" />
              Export
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--dashboard-text-muted)] w-4 h-4" />
              <input
                type="text"
                placeholder="Search tokens or symbols..."
                className="dashboard-search pl-10 pr-4 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="dashboard-checkbox"
                checked={showOnlyGaps}
                onChange={(e) => setShowOnlyGaps(e.target.checked)}
              />
              <span className="text-[var(--dashboard-text-secondary)] text-sm">Show only gaps</span>
            </label>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                className={`dashboard-filter-btn ${
                  selectedCategory === category ? 'selected' : 'default'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        <DataTable
          data={filteredTokens}
          columns={columns}
          emptyMessage="No tokens match your criteria"
        />
      </div>

      {/* Exchange Comparison */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h3 className="dashboard-card-title">Exchange Comparison</h3>
        </div>
        
        <div className="dashboard-grid-3">
          {EXCHANGES.map(exchange => {
            const listedTokens = sampleTokens.filter(token => 
              token.listings.find(l => l.exchange === exchange)?.listed
            ).length;
            const coveragePercent = Math.round((listedTokens / sampleTokens.length) * 100);
            
            return (
              <div key={exchange} className="dashboard-metric-card">
                <div className="dashboard-metric-label">{exchange}</div>
                <div className="dashboard-metric-value">{listedTokens}</div>
                <div className="text-[var(--dashboard-text-secondary)] text-sm">
                  {coveragePercent}% coverage
                </div>
                <div className="dashboard-progress mt-2">
                  <div 
                    className="dashboard-progress-bar success" 
                    style={{ width: `${coveragePercent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}