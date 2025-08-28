import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { processParityData } from '@/app/lib/parity-utils';
import { RawParityRecord } from '@/app/types/parity';
import { prisma } from '@/lib/prisma';

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

    // Get environment variables
    const apiKey = process.env.BLAKE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API configuration missing. Please check BLAKE_API_KEY environment variable.' },
        { status: 500 }
      );
    }
    
    // Fetch data from Blake AI parity API
    const response = await fetch('https://api.withblake.ai/parity', {
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
      throw new Error(`Blake AI Parity API request failed with status ${response.status}: ${response.statusText}`);
    }
    
    const rawData: RawParityRecord[] = await response.json();
    
    // Get user's base exchange preference
    let baseExchange = 'binance'; // default
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { baseExchange: true }
      });
      if (user?.baseExchange) {
        baseExchange = user.baseExchange;
      }
    }
    
    // Get base exchange from query params if provided (overrides user preference)
    const { searchParams } = new URL(request.url);
    const requestedExchange = searchParams.get('baseExchange');
    if (requestedExchange) {
      baseExchange = requestedExchange;
    }
    
    // Process the data with base exchange
    const processedData = processParityData(rawData, baseExchange);
    
    return NextResponse.json({
      ...processedData,
      baseExchange
    });
    
  } catch (error) {
    console.error('Parity API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching parity data';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Mock data for development
function getMockData() {
  return {
    coverageOverview: {
      tokensMissing: 47,
      totalTokens: 2714,
      averageCoverage: 73,
      exclusiveListings: 324,
      coverageRate: 73,
      topMissingExchanges: [
        { exchange: "KuCoin", missingCount: 1250, percentage: 46 },
        { exchange: "Gate.io", missingCount: 1180, percentage: 43 },
        { exchange: "OKX", missingCount: 980, percentage: 36 },
        { exchange: "Huobi", missingCount: 890, percentage: 33 },
        { exchange: "Bybit", missingCount: 780, percentage: 29 }
      ]
    },
    tokens: [
      {
        id: "1",
        symbol: "JUP",
        name: "Jupiter",
        rank: 54,
        marketCap: 2485000000,
        marketCapDisplay: "$2.5B",
        volume24h: 248000000,
        volume24hDisplay: "$248M",
        exchanges: {
          binance: true,
          coinbase: true,
          kraken: true,
          okx: true,
          bybit: true,
          kucoin: true,
          huobi: true,
          gate: false,
          mexc: true
        },
        coverageCount: 8,
        coveragePercentage: 89,
        coverageRatio: "8/9",
        listingOpportunities: 1,
        allExchanges: ["Binance", "Coinbase", "Kraken", "OKX", "Bybit", "KuCoin", "Huobi", "MEXC"],
        isMissing: true,
        missingExchanges: ["Gate.io"],
        contractAddresses: {
          solana: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"
        }
      }
    ],
    totalRecords: 2714
  };
}