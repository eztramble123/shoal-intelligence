import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { processListingsData, calculateListingTrends } from '@/app/lib/listings-utils';
import { RawListingRecord } from '@/app/types/listings';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period'); // Optional: '30d', '90d', or 'ytd'
    const includeTrends = url.searchParams.get('trends') === 'true';

    // Get environment variables
    const apiKey = process.env.BLAKE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API configuration missing' },
        { status: 500 }
      );
    }
    
    // Fetch data from Blake AI listings API
    const response = await fetch('https://api.withblake.ai/listings', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({}),
      cache: 'no-store' // Disable caching for fresh data
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const rawData: RawListingRecord[] = await response.json();
    
    // Process the data using Retool-style logic
    const processedData = processListingsData(rawData);
    
    // Calculate trends if requested
    if (includeTrends) {
      console.log('=== CALCULATING LISTING TRENDS ===');
      
      // Calculate trends for different periods
      const [trends30d, trends90d] = await Promise.all([
        calculateListingTrends(30),
        calculateListingTrends(90)
      ]);
      
      console.log(`Calculated trends for ${Object.keys(trends30d).length} tickers (30d) and ${Object.keys(trends90d).length} tickers (90d)`);
      
      // Merge trend data with processed listings
      processedData.processedListings = processedData.processedListings.map(listing => {
        const trend30 = trends30d[listing.ticker];
        const trend90 = trends90d[listing.ticker];
        
        // Use 30-day trend as primary, fall back to 90-day
        const trend = trend30 || trend90;
        
        if (trend) {
          return {
            ...listing,
            previousExchangeCount: trend.previousExchangeCount,
            trendPercentage: trend.trendPercentage,
            trendDirection: trend.trendDirection,
            trendDisplay: trend.trendDisplay
          };
        }
        
        return listing;
      });
      
      // Update trending listings with the most positive trends
      processedData.trendingListings = processedData.processedListings
        .filter(listing => listing.trendPercentage !== undefined)
        .sort((a, b) => (b.trendPercentage || 0) - (a.trendPercentage || 0))
        .slice(0, 10);
      
      console.log(`Updated ${processedData.trendingListings.length} trending listings`);
    }
    
    return NextResponse.json(processedData);
    
  } catch (error) {
    console.error('Listings API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch listings data' },
      { status: 500 }
    );
  }
}

// Mock data for development
function getMockData() {
  // Create mock listings with different scraped dates for realistic period filtering
  const now = new Date();
  const mockListings = [
    {
      ticker: '$HBAR',
      id: 'hedera-hashgraph',
      name: 'Hedera',
      symbol: 'hbar',
      displayName: '$HBAR - Hedera',
      sourceMessage: '$HBAR added to Binance spot trading',
      price: 0.0567,
      priceDisplay: '$0.0567',
      marketCap: 2485000000,
      marketCapDisplay: '$2.5B',
      volume24h: 248000000,
      volume24hDisplay: '$248M',
      priceChange24h: 0.0032,
      priceChangePct24h: 5.98,
      exchanges: ['Binance', 'Coinbase', 'OKX', 'Gemini', 'Bitstamp', 'Gate', 'Kraken', 'KuCoin', 'Crypto.com', 'HTX', 'MEXC'],
      exchangesCount: 11,
      exchangesDisplay: 'Binance, Coinbase, OKX, Gemini, Bitstamp, Gate, Kraken, KuCoin, Crypto.com, HTX, MEXC',
      lastUpdated: new Date(),
      lastUpdatedDisplay: 'Aug 9, 2025',
      scrapedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      scrapedAtDisplay: 'Aug 7, 2025',
      platforms: { ethereum: '0x123...', solana: 'ABC123...' },
      momentum: 'VERY HIGH' as const,
      momentumColor: '#10b981',
      chartData: [45, 52, 48, 61, 55, 67, 59, 73, 69, 78, 74, 82, 88, 85, 91, 87, 94, 90, 96, 92]
    },
    {
      ticker: '$PHY',
      id: 'physics-token',
      name: 'Physics Token',
      symbol: 'phy',
      displayName: '$PHY - Physics Token',
      sourceMessage: '$PHY listed on MEXC',
      price: 0.125,
      priceDisplay: '$0.125',
      marketCap: 125000000,
      marketCapDisplay: '$125M',
      volume24h: 15000000,
      volume24hDisplay: '$15M',
      priceChange24h: 0.015,
      priceChangePct24h: 13.6,
      exchanges: ['MEXC', 'Gate', 'Bybit', 'Bitmart', 'AsendEx', 'Kraken', 'Upbit'],
      exchangesCount: 7,
      exchangesDisplay: 'MEXC, Gate, Bybit, Bitmart, AsendEx, Kraken, Upbit',
      lastUpdated: new Date(),
      lastUpdatedDisplay: 'Aug 9, 2025',
      scrapedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      scrapedAtDisplay: 'Jul 25, 2025',
      platforms: { ethereum: '0x456...', binance: 'BEP20...' },
      momentum: 'HIGH' as const,
      momentumColor: '#10b981',
      chartData: [35, 42, 38, 51, 45, 57, 49, 63, 59, 68, 64, 72, 78, 75, 81, 77, 84, 80, 86, 82]
    },
    {
      ticker: '$ZORA',
      id: 'zora-token',
      name: 'Zora',
      symbol: 'zora',
      displayName: '$ZORA - Zora',
      sourceMessage: '$ZORA added to Coinbase',
      price: 0.89,
      priceDisplay: '$0.89',
      marketCap: 890000000,
      marketCapDisplay: '$890M',
      volume24h: 45000000,
      volume24hDisplay: '$45M',
      priceChange24h: -0.05,
      priceChangePct24h: -5.3,
      exchanges: ['Coinbase', 'Binance', 'OKX', 'Bybit', 'Gate', 'Kraken'],
      exchangesCount: 6,
      exchangesDisplay: 'Coinbase, Binance, OKX, Bybit, Gate, Kraken',
      lastUpdated: new Date(),
      lastUpdatedDisplay: 'Aug 9, 2025',
      scrapedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      scrapedAtDisplay: 'Jun 25, 2025',
      platforms: { ethereum: '0x789...' },
      momentum: 'DECLINING' as const,
      momentumColor: '#f59e0b',
      chartData: [55, 62, 58, 71, 65, 77, 69, 83, 79, 88, 84, 92, 98, 95, 91, 87, 84, 80, 76, 72]
    },
    {
      ticker: '$NEWT',
      id: 'newton-token',
      name: 'Newton',
      symbol: 'newt',
      displayName: '$NEWT - Newton',
      sourceMessage: '$NEWT pre-market on Aevo',
      price: 2.45,
      priceDisplay: '$2.45',
      marketCap: 245000000,
      marketCapDisplay: '$245M',
      volume24h: 8000000,
      volume24hDisplay: '$8M',
      priceChange24h: 0.25,
      priceChangePct24h: 11.4,
      exchanges: ['Aevo pre-market', 'Hyperliquid', 'Bybit pre-market'],
      exchangesCount: 3,
      exchangesDisplay: 'Aevo pre-market, Hyperliquid, Bybit pre-market',
      lastUpdated: new Date(),
      lastUpdatedDisplay: 'Aug 9, 2025',
      scrapedAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000), // 120 days ago (YTD only)
      scrapedAtDisplay: 'Apr 11, 2025',
      platforms: { solana: 'SOL123...' },
      momentum: 'GROWING' as const,
      momentumColor: '#3b82f6',
      chartData: [25, 32, 28, 41, 35, 47, 39, 53, 49, 58, 54, 62, 68, 65, 71, 67, 74, 70, 76, 72]
    }
  ];

  return {
    processedListings: mockListings,
    treemapData: [
      { name: '$HBAR', value: 11, size: 110, fill: '#10b981', changeType: 'positive' as const, chartData: [], ticker: '$HBAR', exchangesCount: 11 },
      { name: '$PHY', value: 8, size: 80, fill: '#10b981', changeType: 'positive' as const, chartData: [], ticker: '$PHY', exchangesCount: 8 },
      { name: '$ZORA', value: 6, size: 60, fill: '#10b981', changeType: 'positive' as const, chartData: [], ticker: '$ZORA', exchangesCount: 6 }
    ],
    tokenCards: [
      {
        symbol: '$HBAR',
        name: 'Hedera',
        exchanges: ['Binance', 'Coinbase', 'OKX'],
        exchangeCount: 11,
        adoption24h: '+3 exchanges',
        momentum: 'VERY HIGH' as const,
        momentumColor: '#10b981',
        listedOn: 'Binance, Coinbase, OKX, Gemini, Bitstamp, Gate, Kraken, KuCoin, Crypto.com, HTX, MEXC',
        lastUpdated: 'Aug 9, 2025',
        priceChange: 5.98,
        volume: '$248M'
      }
    ],
    liveListings: [
      {
        timestamp: '06:58:35',
        exchange: 'Binance',
        asset: '$HBAR',
        name: 'Hedera',
        type: 'SPOT' as const,
        status: 'Live' as const,
        price: '$0.0567',
        sourceMessage: '$HBAR added to Binance spot trading'
      }
    ],
    adoptionMetrics: [
      { title: 'Total New Listings (24h)', value: 23 },
      { title: 'Most Listed Asset', value: '$HBAR (11 exchanges)' },
      { title: 'Avg Listings/Asset', value: 5.2 },
      { title: 'Active Exchanges', value: 28 },
      { title: 'Cross-Exchange Rate', value: '68%' }
    ],
    exchangeActivity: [
      { name: 'BINANCE', count: 4, status: 'new' as const },
      { name: 'MEXC', count: 3, status: 'new' as const },
      { name: 'GATE', count: 2, status: 'new' as const },
      { name: 'BYBIT', count: 2, status: 'new' as const }
    ],
    fastestGrowing: [
      { symbol: '$HBAR', exchanges: '+11 exchanges', status: 'up' as const },
      { symbol: '$PHY', exchanges: '+8 exchanges', status: 'up' as const }
    ],
    newestListings: [
      { symbol: '$HBAR', exchange: 'on Binance', time: '5m ago' },
      { symbol: '$PHY', exchange: 'on MEXC', time: '12m ago' }
    ],
    totalRecords: 23,
    last24Hours: {
      totalListings: 15,
      listings: [] // Mock data - would contain filtered listings in real implementation
    },
    // Time-based period data with realistic filtering
    last30Days: {
      newListings: mockListings.filter(l => {
        const daysDiff = (now.getTime() - l.scrapedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
      }),
      totalNewListings: mockListings.filter(l => {
        const daysDiff = (now.getTime() - l.scrapedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
      }).length,
      avgExchangesPerListing: 6.2,
      topNewListings: mockListings.filter(l => {
        const daysDiff = (now.getTime() - l.scrapedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
      }).sort((a, b) => b.exchangesCount - a.exchangesCount)
    },
    last90Days: {
      newListings: mockListings.filter(l => {
        const daysDiff = (now.getTime() - l.scrapedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 90;
      }),
      totalNewListings: mockListings.filter(l => {
        const daysDiff = (now.getTime() - l.scrapedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 90;
      }).length,
      avgExchangesPerListing: 5.8,
      topNewListings: mockListings.filter(l => {
        const daysDiff = (now.getTime() - l.scrapedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 90;
      }).sort((a, b) => b.exchangesCount - a.exchangesCount)
    },
    yearToDate: {
      newListings: mockListings.filter(l => {
        const yearStart = new Date();
        yearStart.setMonth(0, 1);
        yearStart.setHours(0, 0, 0, 0);
        return l.scrapedAt >= yearStart;
      }),
      totalNewListings: mockListings.filter(l => {
        const yearStart = new Date();
        yearStart.setMonth(0, 1);
        yearStart.setHours(0, 0, 0, 0);
        return l.scrapedAt >= yearStart;
      }).length,
      avgExchangesPerListing: 5.4,
      topNewListings: mockListings.filter(l => {
        const yearStart = new Date();
        yearStart.setMonth(0, 1);
        yearStart.setHours(0, 0, 0, 0);
        return l.scrapedAt >= yearStart;
      }).sort((a, b) => b.exchangesCount - a.exchangesCount)
    },
    // Trending listings with real trend data
    trendingListings: [] // Will be populated with trend calculations
  };
}