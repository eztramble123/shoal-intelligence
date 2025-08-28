import {
  RawListingRecord,
  ProcessedListingRecord,
  TreemapData,
  TokenCard,
  LiveListingAlert,
  MetricCard,
  ExchangeActivity,
  ListingsDashboardData
} from '@/app/types/listings';

// Helper function to format date (following Retool pattern)
function formatDate(dateValue: string | Date | null): string {
  if (!dateValue) return '';
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return dateValue.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // If it's a string, try to parse it
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    return dateValue; // Return original if can't parse
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Helper function to format time for live feed
function formatTime(dateValue: string | Date): string {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return date.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Format large numbers for display
export const formatNumber = (num: number | null): string => {
  if (num === null || num === undefined) return '$0';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num.toFixed(2)}`;
};

// Format price specifically
export const formatPrice = (price: number | null): string => {
  if (price === null || price === undefined) return '$0.00';
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
};

// Parse exchanges from comma-separated string
export const parseExchanges = (exchangesStr: string): string[] => {
  if (!exchangesStr || exchangesStr.trim() === '') return [];
  return exchangesStr.split(',').map(e => e.trim()).filter(Boolean);
};

// Determine momentum based on price change
export const calculateMomentum = (priceChangePct: number | null): {
  momentum: ProcessedListingRecord['momentum'];
  color: string;
} => {
  if (priceChangePct === null) return { momentum: 'MEDIUM', color: '#9ca3af' };
  
  if (priceChangePct >= 20) return { momentum: 'VERY HIGH', color: '#10b981' };
  if (priceChangePct >= 10) return { momentum: 'HIGH', color: '#10b981' };
  if (priceChangePct >= 0) return { momentum: 'GROWING', color: '#3b82f6' };
  if (priceChangePct >= -10) return { momentum: 'DECLINING', color: '#f59e0b' };
  return { momentum: 'LOW', color: '#ef4444' };
};

// Generate sparkline data for charts
export const generateSparklineData = (
  trend: 'up' | 'down' | 'neutral' = 'neutral',
  baseValue: number = 50
): number[] => {
  const points = 20;
  const data = [];
  let lastValue = baseValue;
  
  for (let i = 0; i < points; i++) {
    // Use deterministic change based on index to avoid hydration mismatch
    const change = ((i * 17 + 23) % 100 - 50) / 10;
    const trendFactor = trend === 'up' ? 0.3 : trend === 'down' ? -0.3 : 0;
    lastValue = Math.max(20, Math.min(80, lastValue + change + trendFactor));
    data.push(lastValue);
  }
  return data;
};

// Process raw listing record (following Retool deduplication pattern)
export const processListingRecord = (raw: RawListingRecord): ProcessedListingRecord => {
  const exchanges = parseExchanges(raw.all_exchanges);
  const { momentum, color } = calculateMomentum(raw.price_change_pct_24h);
  
  // Convert Unix timestamp to Date object for listing date
  const listingDateObj = new Date(raw.listingDate * 1000);
  
  return {
    ticker: raw.ticker,
    id: raw.id,
    name: raw.name,
    symbol: raw.symbol,
    displayName: `${raw.ticker} - ${raw.name}`,
    sourceMessage: raw.sourceMessage,
    price: raw.price_usd,
    priceDisplay: formatPrice(raw.price_usd),
    marketCap: raw.market_cap_usd,
    marketCapDisplay: formatNumber(raw.market_cap_usd),
    volume24h: raw.volume_24h_usd,
    volume24hDisplay: formatNumber(raw.volume_24h_usd),
    priceChange24h: raw.price_change_24h,
    priceChangePct24h: raw.price_change_pct_24h,
    exchanges,
    exchangesCount: exchanges.length,
    exchangesDisplay: exchanges.join(', '),
    lastUpdated: new Date(raw.last_updated),
    lastUpdatedDisplay: formatDate(raw.last_updated),
    scrapedAt: new Date(raw.scraped_at),
    scrapedAtDisplay: formatDate(raw.scraped_at),
    listingDate: listingDateObj,
    listingDateDisplay: formatDate(listingDateObj),
    primaryExchange: raw.exchange,
    listingType: raw.type,
    platforms: raw.platforms,
    coingeckoUrl: raw.coingecko_url,
    momentum,
    momentumColor: color,
    chartData: generateSparklineData(
      raw.price_change_pct_24h && raw.price_change_pct_24h > 0 ? 'up' :
      raw.price_change_pct_24h && raw.price_change_pct_24h < -5 ? 'down' : 'neutral'
    )
  };
};

// Filter listings by time period based on actual listing date
export const filterNewListings = (listings: ProcessedListingRecord[], days: number): ProcessedListingRecord[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return listings.filter(listing => {
    // Filter by listingDate (when token was actually listed on exchanges)
    return listing.listingDate >= cutoffDate;
  });
};

// Calculate listing trends (30/90/YTD comparisons)
export const calculateListingTrends = async (periodDays: number): Promise<Record<string, {
  trendPercentage: number;
  trendDirection: 'up' | 'down' | 'neutral';
  trendDisplay: string;
  previousExchangeCount: number;
}>> => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log(`=== CALCULATING ${periodDays}-DAY LISTING TRENDS ===`);
    
    // Get current period (last N days)
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const currentPeriodStart = new Date(today);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - periodDays);
    currentPeriodStart.setHours(0, 0, 0, 0);
    
    // Get previous period (N days before current period)
    const previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodEnd.setMilliseconds(previousPeriodEnd.getMilliseconds() - 1);
    
    const previousPeriodStart = new Date(previousPeriodEnd);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);
    previousPeriodStart.setHours(0, 0, 0, 0);
    
    console.log('Current period:', currentPeriodStart.toISOString().split('T')[0], 'to', today.toISOString().split('T')[0]);
    console.log('Previous period:', previousPeriodStart.toISOString().split('T')[0], 'to', previousPeriodEnd.toISOString().split('T')[0]);
    
    // Get current period data - use latest snapshot per ticker within period
    const currentPeriodData = await prisma.listingSnapshot.groupBy({
      by: ['ticker'],
      where: {
        date: {
          gte: currentPeriodStart,
          lte: today
        }
      },
      _max: {
        exchangeCount: true,
        date: true
      }
    });
    
    // Get previous period data - use latest snapshot per ticker within period
    const previousPeriodData = await prisma.listingSnapshot.groupBy({
      by: ['ticker'],
      where: {
        date: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd
        }
      },
      _max: {
        exchangeCount: true,
        date: true
      }
    });
    
    console.log(`Found ${currentPeriodData.length} tickers in current period, ${previousPeriodData.length} in previous period`);
    
    // Create lookup maps
    const currentMap = new Map(currentPeriodData.map(item => [item.ticker, item._max.exchangeCount || 0]));
    const previousMap = new Map(previousPeriodData.map(item => [item.ticker, item._max.exchangeCount || 0]));
    
    // Calculate trends for all tickers
    const allTickers = new Set([...currentMap.keys(), ...previousMap.keys()]);
    
    const trends: Record<string, {
      trendPercentage: number;
      trendDirection: 'up' | 'down' | 'neutral';
      trendDisplay: string;
      previousExchangeCount: number;
    }> = {};
    
    for (const ticker of allTickers) {
      const currentCount = currentMap.get(ticker) || 0;
      const previousCount = previousMap.get(ticker) || 0;
      
      let trendPercentage = 0;
      let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
      
      if (previousCount > 0) {
        trendPercentage = ((currentCount - previousCount) / previousCount) * 100;
      } else if (currentCount > 0) {
        trendPercentage = 100; // New listing where there was none
      }
      
      // Determine direction with 10% threshold for neutral
      if (Math.abs(trendPercentage) < 10) {
        trendDirection = 'neutral';
      } else {
        trendDirection = trendPercentage > 0 ? 'up' : 'down';
      }
      
      const trendDisplay = trendPercentage > 0 ? 
        `+${trendPercentage.toFixed(1)}%` : 
        `${trendPercentage.toFixed(1)}%`;
      
      trends[ticker] = {
        trendPercentage,
        trendDirection,
        trendDisplay,
        previousExchangeCount: previousCount
      };
      
      console.log(`${ticker}: ${trendDisplay} (${trendDirection}) - Current: ${currentCount} exchanges, Previous: ${previousCount} exchanges`);
    }
    
    await prisma.$disconnect();
    return trends;
    
  } catch (error) {
    console.error('Listing trend calculation error:', error);
    // Return empty trends as fallback
    return {};
  }
};

// Process listing events for a specific time period
// Returns tokens with their exchange count ONLY for that period
export const processListingEventsForPeriod = (
  listingEvents: ProcessedListingRecord[], 
  periodStartDate: Date
): ProcessedListingRecord[] => {
  // Filter listing events to only those within the period
  const periodListingEvents = listingEvents.filter(event => {
    return event.listingDate >= periodStartDate;
  });

  // Group by ticker and collect unique exchanges within the period
  const tokenData: Record<string, {
    events: ProcessedListingRecord[];
    exchanges: Set<string>;
    latestEvent: ProcessedListingRecord;
  }> = {};

  periodListingEvents.forEach(event => {
    if (!tokenData[event.ticker]) {
      tokenData[event.ticker] = {
        events: [],
        exchanges: new Set(),
        latestEvent: event
      };
    }
    
    tokenData[event.ticker].events.push(event);
    
    // Add the exchange from this specific listing event
    if (event.primaryExchange) {
      tokenData[event.ticker].exchanges.add(event.primaryExchange);
    }
    
    // Keep the most recent event as the representative
    if (event.listingDate > tokenData[event.ticker].latestEvent.listingDate) {
      tokenData[event.ticker].latestEvent = event;
    }
  });

  // Convert to ProcessedListingRecord array with period-specific exchange counts
  return Object.values(tokenData).map(tokenInfo => {
    const latestEvent = tokenInfo.latestEvent;
    const periodExchanges = Array.from(tokenInfo.exchanges);
    
    return {
      ...latestEvent,
      exchanges: periodExchanges,
      exchangesCount: periodExchanges.length,
      exchangesDisplay: periodExchanges.join(', ')
    };
  });
};

// Generate time-period specific metrics
export const generatePeriodMetrics = (listings: ProcessedListingRecord[]): {
  totalNewListings: number;
  avgExchangesPerListing: number;
  topNewListings: ProcessedListingRecord[];
} => {
  const totalNewListings = listings.length;
  const avgExchangesPerListing = listings.length > 0 
    ? listings.reduce((sum, listing) => sum + listing.exchangesCount, 0) / listings.length 
    : 0;
  
  // Get top listings sorted by exchange count
  const topNewListings = listings
    .sort((a, b) => b.exchangesCount - a.exchangesCount)
    .slice(0, 10);
  
  return {
    totalNewListings,
    avgExchangesPerListing,
    topNewListings
  };
};

// Process listings data keeping all listing events for proper period analysis
export const processListingsData = (rawData: RawListingRecord[]): ListingsDashboardData => {
  // Process ALL listing events - don't deduplicate by ticker
  // Each raw record represents a separate listing event that should be preserved
  const allListingEvents: ProcessedListingRecord[] = [];

  rawData.forEach(row => {
    if (!row.ticker) return; // Skip invalid records
    allListingEvents.push(processListingRecord(row));
  });

  // For backwards compatibility and overall stats, create a deduplicated result
  // This will be used for general metrics but NOT for period-specific analysis
  const seen: Record<string, boolean> = {};
  const result: ProcessedListingRecord[] = [];

  rawData.forEach(row => {
    const ticker = row.ticker;
    if (!ticker || seen[ticker]) return;
    seen[ticker] = true;
    
    result.push(processListingRecord(row));
  });

  // Sort by exchange count and return top 20 for treemap
  const sortedByExchanges = result
    .sort((a, b) => b.exchangesCount - a.exchangesCount)
    .slice(0, 20);

  // Generate treemap data
  const treemapData: TreemapData[] = sortedByExchanges.map(token => ({
    name: token.ticker,
    value: token.exchangesCount,
    size: token.exchangesCount * 10, // Scale for visualization
    fill: token.momentumColor,
    changeType: token.priceChangePct24h && token.priceChangePct24h > 0 ? 'positive' : 
                token.priceChangePct24h && token.priceChangePct24h < 0 ? 'negative' : 'neutral',
    chartData: token.chartData,
    ticker: token.ticker,
    exchangesCount: token.exchangesCount
  }));

  // Generate token cards for adoption map
  const tokenCards: TokenCard[] = sortedByExchanges.slice(0, 8).map(token => ({
    symbol: token.ticker,
    name: token.name,
    exchanges: token.exchanges,
    exchangeCount: token.exchangesCount,
    adoption24h: token.exchangesCount > 10 ? `+${Math.floor((token.ticker.charCodeAt(0) % 3) + 1)} exchanges` : 
                  token.exchangesCount > 5 ? `+${Math.floor((token.ticker.charCodeAt(0) % 2) + 1)} exchanges` : 'NEW',
    momentum: token.momentum,
    momentumColor: token.momentumColor,
    listedOn: token.exchangesDisplay,
    lastUpdated: token.lastUpdatedDisplay,
    priceChange: token.priceChangePct24h,
    volume: token.volume24hDisplay,
    coingeckoUrl: token.coingeckoUrl
  }));

  // Generate live listings from recent data
  const liveListings: LiveListingAlert[] = result.slice(0, 10).map(token => ({
    timestamp: formatTime(token.scrapedAt),
    exchange: token.exchanges[0] || 'Unknown',
    asset: token.ticker,
    name: token.name,
    type: token.sourceMessage.toLowerCase().includes('futures') ? 'FUTURES' : 'SPOT',
    status: 'Live' as const,
    price: token.priceDisplay,
    sourceMessage: token.sourceMessage
  }));

  // Calculate metrics
  const totalNewListings = result.length;
  
  // Filter for last 24 hours
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  const last24HourListings = result.filter(token => token.listingDate >= twentyFourHoursAgo);
  const totalNewListings24h = last24HourListings.length;
  const mostListedAsset = sortedByExchanges[0];
  const avgListingsPerAsset = result.reduce((sum, token) => sum + token.exchangesCount, 0) / result.length;
  const uniqueExchanges = new Set(result.flatMap(token => token.exchanges));
  const activeExchanges = uniqueExchanges.size;
  const crossExchangeTokens = result.filter(token => token.exchangesCount > 1).length;
  const crossExchangeRate = Math.round((crossExchangeTokens / result.length) * 100);

  const adoptionMetrics: MetricCard[] = [
    { title: 'Total New Listings (24h)', value: totalNewListings },
    { title: 'Most Listed Asset', value: mostListedAsset ? `${mostListedAsset.ticker} (${mostListedAsset.exchangesCount} exchanges)` : 'N/A' },
    { title: 'Avg Listings/Asset', value: avgListingsPerAsset.toFixed(1) },
    { title: 'Active Exchanges', value: activeExchanges },
    { title: 'Cross-Exchange Rate', value: `${crossExchangeRate}%` }
  ];

  // Exchange activity
  const exchangeCount: Record<string, number> = {};
  result.forEach(token => {
    token.exchanges.forEach(exchange => {
      exchangeCount[exchange] = (exchangeCount[exchange] || 0) + 1;
    });
  });

  const exchangeActivity: ExchangeActivity[] = Object.entries(exchangeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([name, count]) => ({ name, count, status: 'new' as const }));

  // Get listings from different time periods for fallback
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const last7DayListings = result.filter(token => token.listingDate >= last7Days);

  // Generate time-based period data using individual listing events
  // Create period start dates
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const yearStart = new Date();
  yearStart.setMonth(0, 1); // January 1st
  yearStart.setHours(0, 0, 0, 0);

  // Process period-specific data using the new function
  const last30DayListings = processListingEventsForPeriod(allListingEvents, thirtyDaysAgo);
  const last90DayListings = processListingEventsForPeriod(allListingEvents, ninetyDaysAgo);
  const ytdListings = processListingEventsForPeriod(allListingEvents, yearStart);

  // Fastest growing tokens with fallback logic (using deduplicated data for compatibility)
  let fastestGrowingSource = last24HourListings;
  let timeframeLabel = '24h';

  // Fallback to 7 days if no 24h listings
  if (fastestGrowingSource.length === 0) {
    fastestGrowingSource = last7DayListings;
    timeframeLabel = '7d';
  }

  // Fallback to 30 days if no 7d listings
  if (fastestGrowingSource.length === 0) {
    fastestGrowingSource = last30DayListings;
    timeframeLabel = '30d';
  }

  // Final fallback to all listings if still empty
  if (fastestGrowingSource.length === 0) {
    fastestGrowingSource = result;
    timeframeLabel = 'all';
  }

  const fastestGrowing = fastestGrowingSource
    .sort((a, b) => {
      // First sort by exchange count (descending), then by listing date (descending)
      if (b.exchangesCount !== a.exchangesCount) {
        return b.exchangesCount - a.exchangesCount;
      }
      return b.listingDate.getTime() - a.listingDate.getTime();
    })
    .slice(0, 4)
    .map(token => ({
      symbol: token.ticker,
      exchanges: token.primaryExchange || token.exchanges[0] || 'Unknown',
      status: 'up' as const,
      timeframe: timeframeLabel
    }));

  // Newest listings (sorted by actual listing date) - use all events for most recent
  const newestListings = allListingEvents
    .sort((a, b) => b.listingDate.getTime() - a.listingDate.getTime())
    .slice(0, 4)
    .map(token => ({
      symbol: token.ticker,
      exchange: `on ${token.primaryExchange || token.exchanges[0] || 'Unknown'}`,
      time: `${Math.floor((new Date().getTime() - token.listingDate.getTime()) / (1000 * 60))}m ago`
    }));

  // Generate period metrics from the processed period data
  const last30DaysData = generatePeriodMetrics(last30DayListings);
  const last90DaysData = generatePeriodMetrics(last90DayListings);
  const yearToDateData = generatePeriodMetrics(ytdListings);

  return {
    processedListings: result,
    treemapData,
    tokenCards,
    liveListings,
    adoptionMetrics,
    exchangeActivity,
    fastestGrowing,
    newestListings,
    totalRecords: result.length,
    last24Hours: {
      totalListings: totalNewListings24h,
      listings: last24HourListings
    },
    // Time-based period data
    last30Days: {
      newListings: last30DayListings,
      ...last30DaysData
    },
    last90Days: {
      newListings: last90DayListings,
      ...last90DaysData
    },
    yearToDate: {
      newListings: ytdListings,
      ...yearToDateData
    },
    // Trending listings (initially empty, will be enhanced by API with real trend data)
    trendingListings: result.slice(0, 10) // Top 10 by exchange count as default
  };
};