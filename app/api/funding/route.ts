import { NextResponse } from 'next/server';
import { processFundingData } from '@/app/lib/funding-utils';
import { RawFundingRecord } from '@/app/types/funding';

export async function GET() {
  try {
    // Get environment variables
    const apiUrl = process.env.BLAKE_API_URL;
    const apiKey = process.env.BLAKE_API_KEY;
    
    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'API configuration missing' },
        { status: 500 }
      );
    }
    
    // Fetch data from Blake AI API
    const response = await fetch(apiUrl, {
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
    
    const rawData: RawFundingRecord[] = await response.json();
    
    // Process the data
    const processedData = processFundingData(rawData);
    
    return NextResponse.json(processedData);
    
  } catch (error) {
    console.error('Funding API error:', error);
    
    // Return mock data in development if API fails
    if (process.env.NODE_ENV === 'development') {
      const mockData = getMockData();
      return NextResponse.json(mockData);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch funding data' },
      { status: 500 }
    );
  }
}

// Mock data for development
function getMockData() {
  return {
    totalRaised: "$2.8B",
    totalRaisedNum: 2800000000,
    activeDeals: 187,
    avgRoundSize: "$15M",
    avgRoundSizeNum: 15000000,
    mostActiveInvestors: [
      {
        name: "a16z crypto",
        totalInvested: 485000000,
        totalInvestedDisplay: "$485M",
        dealCount: 23,
        recentDeals: ["Example Protocol", "DeFi Platform", "Layer 2 Solution"]
      },
      {
        name: "Paradigm",
        totalInvested: 320000000,
        totalInvestedDisplay: "$320M",
        dealCount: 18,
        recentDeals: ["Gaming Studio", "NFT Marketplace", "DEX Protocol"]
      }
    ],
    trendingCategories: [
      {
        category: "Infrastructure",
        totalAmount: 980000000,
        totalAmountDisplay: "$980M",
        percentage: 35,
        dealCount: 45,
        color: "#8b5cf6"
      },
      {
        category: "DeFi",
        totalAmount: 756000000,
        totalAmountDisplay: "$756M",
        percentage: 27,
        dealCount: 38,
        color: "#3b82f6"
      },
      {
        category: "Gaming",
        totalAmount: 560000000,
        totalAmountDisplay: "$560M",
        percentage: 20,
        dealCount: 62,
        color: "#10b981"
      },
      {
        category: "AI",
        totalAmount: 504000000,
        totalAmountDisplay: "$504M",
        percentage: 18,
        dealCount: 42,
        color: "#f97316"
      }
    ],
    latestRounds: [
      {
        name: "Example Protocol",
        amount: 50000000,
        amountDisplay: "$50M",
        date: new Date(),
        dateDisplay: "Today",
        round: "Series B",
        category: "DeFi",
        classifiedCategory: "DeFi",
        description: "Decentralized lending protocol",
        leadInvestors: ["Paradigm"],
        otherInvestors: ["a16z", "Coinbase Ventures"],
        allInvestors: ["Paradigm", "a16z", "Coinbase Ventures"],
        link: "https://example.com",
        valuation: "",
        chains: ""
      }
    ],
    monthlyFunding: [
      { month: "Aug 2025", total: 2.5, displayTotal: "$2.5B" },
      { month: "Jul 2025", total: 2.1, displayTotal: "$2.1B" },
      { month: "Jun 2025", total: 1.8, displayTotal: "$1.8B" }
    ],
    last30Days: {
      totalRaised: "$2.8B",
      dealCount: 187
    }
  };
}