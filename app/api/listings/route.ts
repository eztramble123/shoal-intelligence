import { NextResponse } from 'next/server';
import { processListingsData } from '@/app/lib/listings-utils';
import { RawListingRecord } from '@/app/types/listings';

export async function GET() {
  try {
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
    
    return NextResponse.json(processedData);
    
  } catch (error) {
    console.error('Listings API error:', error);
    
    // Return mock data in development if API fails
    if (process.env.NODE_ENV === 'development') {
      const mockData = getMockData();
      return NextResponse.json(mockData);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch listings data' },
      { status: 500 }
    );
  }
}

// Mock data for development
function getMockData() {
  return {
    processedListings: [
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
        scrapedAt: new Date(),
        scrapedAtDisplay: 'Aug 9, 2025',
        platforms: { ethereum: '0x123...', solana: 'ABC123...' },
        momentum: 'VERY HIGH' as const,
        momentumColor: '#10b981',
        chartData: [45, 52, 48, 61, 55, 67, 59, 73, 69, 78, 74, 82, 88, 85, 91, 87, 94, 90, 96, 92]
      }
    ],
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
    totalRecords: 23
  };
}