'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Bell, TrendingUp, AlertCircle, CheckCircle, ExternalLink, Play, Pause } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MetricCard } from '@/components/dashboard/metric-card';
import { DataTable, Column } from '@/components/dashboard/data-table';
import { ChartWrapper } from '@/components/dashboard/chart-wrapper';
import { 
  sampleListingActivity, 
  sampleTokens,
  EXCHANGES,
  ListingActivity,
  formatCurrency 
} from '@/lib/sample-data';

interface ListingFeedData {
  activity: ListingActivity;
  timeAgo: string;
  isNew: boolean;
  impactScore: number;
  priceImpact?: number;
}

const ACTIVITY_TYPES = ['All', 'Listings', 'Delistings'];

// Mock real-time data generation
const generateMockActivity = (): ListingActivity => {
  const randomToken = sampleTokens[Math.floor(Math.random() * sampleTokens.length)];
  const randomExchange = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
  const timestamp = new Date().toISOString();
  
  return {
    id: Date.now().toString(),
    token: randomToken,
    exchange: randomExchange,
    timestamp,
    type: Math.random() > 0.9 ? 'delisting' : 'listing',
    volume: Math.floor(Math.random() * 50000000) + 1000000
  };
};

export default function ListingsFeed() {
  const [selectedType, setSelectedType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRealTime, setIsRealTime] = useState(true);
  const [activities, setActivities] = useState(sampleListingActivity);
  const [notifications, setNotifications] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!isRealTime) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new activity
        const newActivity = generateMockActivity();
        setActivities(prev => [newActivity, ...prev].slice(0, 100)); // Keep last 100
      }
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [isRealTime]);

  const processedActivities: ListingFeedData[] = activities.map(activity => {
    const activityTime = new Date(activity.timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    let timeAgo: string;
    if (diffMinutes < 1) {
      timeAgo = 'Just now';
    } else if (diffMinutes < 60) {
      timeAgo = `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      timeAgo = `${Math.floor(diffMinutes / 60)}h ago`;
    } else {
      timeAgo = `${Math.floor(diffMinutes / 1440)}d ago`;
    }

    // Calculate impact score based on volume and token popularity
    const impactScore = Math.min(
      100,
      ((activity.volume || 0) / 10000000) * 40 + 
      (activity.token.trending ? (6 - activity.token.trending) * 10 : 0) + 
      (activity.token.marketCap / 100000000) * 2
    );

    return {
      activity,
      timeAgo,
      isNew: diffMinutes < 5,
      impactScore,
      priceImpact: activity.type === 'listing' ? 
        Math.random() * 20 - 5 : // -5% to +15% for listings
        Math.random() * -10 - 2   // -12% to -2% for delistings
    };
  });

  const filteredActivities = processedActivities.filter(item => {
    const matchesType = selectedType === 'All' || 
      (selectedType === 'Listings' && item.activity.type === 'listing') ||
      (selectedType === 'Delistings' && item.activity.type === 'delisting');
    
    const matchesSearch = searchTerm === '' || 
      item.activity.token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.activity.token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.activity.exchange.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  // Statistics
  const todayListings = filteredActivities.filter(a => {
    const today = new Date().toDateString();
    return new Date(a.activity.timestamp).toDateString() === today && a.activity.type === 'listing';
  }).length;

  const activeExchanges = new Set(filteredActivities.map(a => a.activity.exchange)).size;
  const averageImpact = filteredActivities.length > 0 ?
    filteredActivities.reduce((sum, a) => sum + a.impactScore, 0) / filteredActivities.length : 0;

  // Hourly activity chart data
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const count = filteredActivities.filter(a => {
      const activityHour = new Date(a.activity.timestamp).getHours();
      return activityHour === hour;
    }).length;
    return { hour: hour.toString().padStart(2, '0'), count };
  });

  const columns: Column<ListingFeedData>[] = [
    {
      key: 'status',
      header: '',
      width: '50px',
      render: (item) => (
        <div className="flex items-center">
          {item.isNew && <div className="w-2 h-2 bg-[var(--dashboard-green)] rounded-full animate-pulse" />}
          {item.activity.type === 'listing' ? (
            <CheckCircle className="dashboard-icon-sm text-[var(--dashboard-green)] ml-2" />
          ) : (
            <AlertCircle className="dashboard-icon-sm text-[var(--dashboard-red)] ml-2" />
          )}
        </div>
      )
    },
    {
      key: 'token',
      header: 'Token',
      width: '200px',
      sortable: true,
      render: (item) => (
        <div>
          <div className="text-[var(--dashboard-text-primary)] font-medium flex items-center">
            {item.activity.token.name} ({item.activity.token.symbol})
            <ExternalLink className="dashboard-icon-sm ml-2 text-[var(--dashboard-text-muted)] cursor-pointer" />
          </div>
          <div className="text-[var(--dashboard-text-secondary)] text-xs">
            {item.activity.token.category} • {item.activity.token.chain}
            {item.activity.token.trending && (
              <span className="ml-2 text-[var(--dashboard-blue)]">Trending #{item.activity.token.trending}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'exchange',
      header: 'Exchange',
      sortable: true,
      render: (item) => (
        <span className="text-[var(--dashboard-text-primary)] font-medium">
          {item.activity.exchange}
        </span>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          item.activity.type === 'listing' 
            ? 'bg-gray-100 dark:bg-gray-800 text-[var(--dashboard-green)]'
            : 'bg-gray-100 dark:bg-gray-800 text-[var(--dashboard-red)]'
        }`}>
          {item.activity.type === 'listing' ? 'Listed' : 'Delisted'}
        </span>
      )
    },
    {
      key: 'volume',
      header: 'Volume (24h)',
      sortable: true,
      render: (item) => (
        <span className="text-[var(--dashboard-text-primary)] font-medium">
          {item.activity.volume ? formatCurrency(item.activity.volume) : 'N/A'}
        </span>
      )
    },
    {
      key: 'impact',
      header: 'Impact',
      sortable: true,
      render: (item) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                item.impactScore > 70 ? 'bg-[var(--dashboard-red)]' :
                item.impactScore > 40 ? 'bg-[var(--dashboard-orange)]' :
                'bg-[var(--dashboard-green)]'
              }`}
              style={{ width: `${Math.min(100, item.impactScore)}%` }}
            />
          </div>
          <span className="text-xs text-[var(--dashboard-text-secondary)]">
            {Math.round(item.impactScore)}
          </span>
        </div>
      )
    },
    {
      key: 'priceImpact',
      header: 'Price Impact',
      render: (item) => (
        item.priceImpact ? (
          <span className={`font-medium ${
            item.priceImpact > 0 ? 'text-[var(--dashboard-green)]' : 'text-[var(--dashboard-red)]'
          }`}>
            {item.priceImpact > 0 ? '+' : ''}{item.priceImpact.toFixed(1)}%
          </span>
        ) : (
          <span className="text-[var(--dashboard-text-muted)]">N/A</span>
        )
      )
    },
    {
      key: 'time',
      header: 'Time',
      sortable: true,
      render: (item) => (
        <div className="text-right">
          <div className="text-[var(--dashboard-text-primary)]">
            {item.timeAgo}
          </div>
          <div className="text-[var(--dashboard-text-secondary)] text-xs">
            {new Date(item.activity.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
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
          label="Today's Listings"
          value={todayListings}
          change={{ value: "+12", type: "positive" }}
          icon={<CheckCircle className="dashboard-icon" />}
        />
        <MetricCard
          label="Active Exchanges"
          value={activeExchanges}
          icon={<TrendingUp className="dashboard-icon" />}
        />
        <MetricCard
          label="Average Impact Score"
          value={Math.round(averageImpact)}
          change={{ value: "+5.2", type: "positive" }}
        />
        <MetricCard
          label="Total Activities"
          value={filteredActivities.length}
        />
      </div>

      {/* Real-time Controls & Charts */}
      <div className="dashboard-grid-2">
        {/* Real-time Controls */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3 className="dashboard-card-title flex items-center">
                <Bell className="dashboard-icon-sm mr-2" />
                Real-time Alerts
              </h3>
              <p className="dashboard-card-subtitle">Live listing notifications</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsRealTime(!isRealTime)}
                className={`dashboard-btn dashboard-btn-sm ${
                  isRealTime ? 'dashboard-btn-success' : 'dashboard-btn-secondary'
                }`}
              >
                {isRealTime ? (
                  <><Pause className="dashboard-icon-sm mr-1" />Live</>
                ) : (
                  <><Play className="dashboard-icon-sm mr-1" />Paused</>
                )}
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="dashboard-checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
              <span className="text-[var(--dashboard-text-secondary)] text-sm">Browser notifications</span>
            </label>
            
            <div className="space-y-2">
              <h4 className="text-[var(--dashboard-text-primary)] font-medium">Recent Activity</h4>
              {filteredActivities.slice(0, 5).map((activity) => (
                <div key={activity.activity.id} className="flex items-center justify-between p-2 bg-[var(--dashboard-bg)] rounded">
                  <div className="flex items-center space-x-2">
                    {activity.activity.type === 'listing' ? (
                      <CheckCircle className="dashboard-icon-sm text-[var(--dashboard-green)]" />
                    ) : (
                      <AlertCircle className="dashboard-icon-sm text-[var(--dashboard-red)]" />
                    )}
                    <span className="text-[var(--dashboard-text-primary)] text-sm">
                      {activity.activity.token.symbol}
                    </span>
                    <span className="text-[var(--dashboard-text-secondary)] text-xs">
                      on {activity.activity.exchange}
                    </span>
                  </div>
                  <span className="text-[var(--dashboard-text-muted)] text-xs">
                    {activity.timeAgo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 24h Activity Chart */}
        <ChartWrapper
          title="24-Hour Activity"
          subtitle="Listings by hour"
          height="h-64"
        >
          <div className="flex items-end justify-center h-full space-x-1 p-4">
            {hourlyData.slice(-12).map((hour) => (
              <div key={hour.hour} className="flex flex-col items-center">
                <div
                  className="bg-[var(--dashboard-blue)] rounded-t w-4 min-h-2"
                  style={{
                    height: `${Math.max(8, (hour.count / Math.max(1, Math.max(...hourlyData.map(h => h.count)))) * 150)}px`
                  }}
                />
                <span className="text-xs text-[var(--dashboard-text-secondary)] mt-1">
                  {hour.hour}
                </span>
              </div>
            ))}
          </div>
        </ChartWrapper>
      </div>

      {/* Listings Feed */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div className="flex items-center">
            <h3 className="dashboard-card-title">Live Listings Feed</h3>
            {isRealTime && (
              <div className="ml-3 flex items-center">
                <div className="w-2 h-2 bg-[var(--dashboard-green)] rounded-full animate-pulse mr-2" />
                <span className="text-[var(--dashboard-green)] text-sm">Live</span>
              </div>
            )}
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
                placeholder="Search tokens or exchanges..."
                className="dashboard-search pl-10 pr-4 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="text-[var(--dashboard-text-secondary)] text-sm self-center mr-2">Type:</span>
            {ACTIVITY_TYPES.map((type) => (
              <button
                key={type}
                className={`dashboard-filter-btn ${
                  selectedType === type ? 'selected' : 'default'
                }`}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        
        <DataTable
          data={filteredActivities}
          columns={columns}
          emptyMessage="No listing activity matches your criteria"
        />
      </div>

      {/* Success Tracking */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <div>
            <h3 className="dashboard-card-title">Post-Listing Performance</h3>
            <p className="dashboard-card-subtitle">Price impact and volume changes after listings</p>
          </div>
        </div>
        
        <div className="dashboard-grid-3">
          {filteredActivities.slice(0, 6).filter(a => a.priceImpact).map((activity) => (
            <div key={activity.activity.id} className="dashboard-card border-l-4 border-l-[var(--dashboard-blue)]">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-lg font-semibold text-[var(--dashboard-text-primary)]">
                    {activity.activity.token.symbol}
                  </div>
                  <div className="text-[var(--dashboard-text-secondary)] text-sm">
                    {activity.activity.exchange} • {activity.timeAgo}
                  </div>
                </div>
                <span className={`font-semibold ${
                  activity.priceImpact! > 0 ? 'text-[var(--dashboard-green)]' : 'text-[var(--dashboard-red)]'
                }`}>
                  {activity.priceImpact! > 0 ? '+' : ''}{activity.priceImpact!.toFixed(1)}%
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--dashboard-text-secondary)]">Volume</span>
                  <span className="text-[var(--dashboard-text-primary)]">
                    {formatCurrency(activity.activity.volume || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--dashboard-text-secondary)]">Impact Score</span>
                  <span className="text-[var(--dashboard-text-primary)]">
                    {Math.round(activity.impactScore)}/100
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}