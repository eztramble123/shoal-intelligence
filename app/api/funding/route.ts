import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { processFundingData, calculateTrendData } from '@/app/lib/funding-utils';
import { RawFundingRecord } from '@/app/types/funding';

export async function GET() {
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
    console.log('✅ Successfully fetched data from Blake AI API');
    console.log('Raw data records count:', rawData.length);
    if (rawData.length > 0) {
      console.log('Sample raw record:', rawData[0]);
    }
    
    // Process the data
    const processedData = processFundingData(rawData);
    console.log('✅ Successfully processed Blake AI data');
    
    // Get real trend data for trending categories (7-day comparison)
    console.log('🔄 Calculating trending data...');
    const trendData = await calculateTrendData(7);
    
    // Merge trend data with trending categories
    const trendingCategoriesWithTrends = processedData.trendingCategories.map(category => {
      const trend = trendData[category.category];
      if (trend) {
        return {
          ...category,
          previousAmount: trend.previousAmount,
          trendPercentage: trend.trendPercentage,
          trendDirection: trend.trendDirection,
          trendDisplay: trend.trendDisplay
        };
      }
      return category;
    });
    
    const enhancedData = {
      ...processedData,
      trendingCategories: trendingCategoriesWithTrends
    };
    
    console.log('✅ Successfully enhanced data with real trend information');
    
    return NextResponse.json(enhancedData);
    
  } catch (error) {
    console.error('Funding API error:', error);
    
    // Return mock data in development if API fails
    if (process.env.NODE_ENV === 'development') {
      console.log('API failed, returning mock data for development');
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
        color: "#8b5cf6",
        previousAmount: 850000000,
        trendPercentage: 15.3,
        trendDirection: "up" as const,
        trendDisplay: "+15.3%"
      },
      {
        category: "DeFi",
        totalAmount: 756000000,
        totalAmountDisplay: "$756M",
        percentage: 27,
        dealCount: 38,
        color: "#3b82f6",
        previousAmount: 820000000,
        trendPercentage: -7.8,
        trendDirection: "down" as const,
        trendDisplay: "-7.8%"
      },
      {
        category: "Gaming",
        totalAmount: 560000000,
        totalAmountDisplay: "$560M",
        percentage: 20,
        dealCount: 62,
        color: "#10b981",
        previousAmount: 540000000,
        trendPercentage: 3.7,
        trendDirection: "neutral" as const,
        trendDisplay: "+3.7%"
      },
      {
        category: "AI",
        totalAmount: 504000000,
        totalAmountDisplay: "$504M",
        percentage: 18,
        dealCount: 42,
        color: "#f97316",
        previousAmount: 420000000,
        trendPercentage: 20.0,
        trendDirection: "up" as const,
        trendDisplay: "+20.0%"
      },
      {
        category: "Trading",
        totalAmount: 280000000,
        totalAmountDisplay: "$280M",
        percentage: 10,
        dealCount: 25,
        color: "#ec4899",
        previousAmount: 310000000,
        trendPercentage: -9.7,
        trendDirection: "down" as const,
        trendDisplay: "-9.7%"
      },
      {
        category: "Social",
        totalAmount: 168000000,
        totalAmountDisplay: "$168M",
        percentage: 6,
        dealCount: 18,
        color: "#06b6d4",
        previousAmount: 145000000,
        trendPercentage: 15.9,
        trendDirection: "up" as const,
        trendDisplay: "+15.9%"
      },
      {
        category: "Privacy",
        totalAmount: 140000000,
        totalAmountDisplay: "$140M",
        percentage: 5,
        dealCount: 12,
        color: "#6366f1",
        previousAmount: 160000000,
        trendPercentage: -12.5,
        trendDirection: "down" as const,
        trendDisplay: "-12.5%"
      },
      {
        category: "Enterprise",
        totalAmount: 112000000,
        totalAmountDisplay: "$112M",
        percentage: 4,
        dealCount: 15,
        color: "#84cc16",
        previousAmount: 108000000,
        trendPercentage: 3.7,
        trendDirection: "neutral" as const,
        trendDisplay: "+3.7%"
      },
      {
        category: "NFTs",
        totalAmount: 84000000,
        totalAmountDisplay: "$84M",
        percentage: 3,
        dealCount: 22,
        color: "#a855f7",
        previousAmount: 95000000,
        trendPercentage: -11.6,
        trendDirection: "down" as const,
        trendDisplay: "-11.6%"
      },
      {
        category: "Identity",
        totalAmount: 56000000,
        totalAmountDisplay: "$56M",
        percentage: 2,
        dealCount: 8,
        color: "#f59e0b",
        previousAmount: 48000000,
        trendPercentage: 16.7,
        trendDirection: "up" as const,
        trendDisplay: "+16.7%"
      },
      {
        category: "Security",
        totalAmount: 42000000,
        totalAmountDisplay: "$42M",
        percentage: 1.5,
        dealCount: 6,
        color: "#ef4444",
        previousAmount: 45000000,
        trendPercentage: -6.7,
        trendDirection: "down" as const,
        trendDisplay: "-6.7%"
      },
      {
        category: "Wallets",
        totalAmount: 28000000,
        totalAmountDisplay: "$28M",
        percentage: 1,
        dealCount: 9,
        color: "#14b8a6",
        previousAmount: 25000000,
        trendPercentage: 12.0,
        trendDirection: "up" as const,
        trendDisplay: "+12.0%"
      },
      {
        category: "Mining",
        totalAmount: 14000000,
        totalAmountDisplay: "$14M",
        percentage: 0.5,
        dealCount: 3,
        color: "#78716c",
        previousAmount: 18000000,
        trendPercentage: -22.2,
        trendDirection: "down" as const,
        trendDisplay: "-22.2%"
      },
      {
        category: "Data",
        totalAmount: 7000000,
        totalAmountDisplay: "$7M",
        percentage: 0.25,
        dealCount: 2,
        color: "#8b5a2b",
        previousAmount: 3000000,
        trendPercentage: 133.3,
        trendDirection: "up" as const,
        trendDisplay: "+133.3%"
      },
      {
        category: "Others",
        totalAmount: 0,
        totalAmountDisplay: "$0",
        percentage: 0,
        dealCount: 0,
        color: "#6b7280",
        previousAmount: 2000000,
        trendPercentage: -100.0,
        trendDirection: "down" as const,
        trendDisplay: "-100.0%"
      }
    ],
    last90DaysCategories: [
      {
        category: "AI",
        totalAmount: 320000000,
        totalAmountDisplay: "$320M",
        percentage: 40,
        dealCount: 18,
        color: "#f97316"
      },
      {
        category: "DeFi",
        totalAmount: 240000000,
        totalAmountDisplay: "$240M",
        percentage: 30,
        dealCount: 15,
        color: "#3b82f6"
      },
      {
        category: "Gaming",
        totalAmount: 160000000,
        totalAmountDisplay: "$160M",
        percentage: 20,
        dealCount: 22,
        color: "#10b981"
      },
      {
        category: "Infrastructure",
        totalAmount: 80000000,
        totalAmountDisplay: "$80M",
        percentage: 10,
        dealCount: 8,
        color: "#8b5cf6"
      },
      {
        category: "Trading",
        totalAmount: 0,
        totalAmountDisplay: "$0",
        percentage: 0,
        dealCount: 0,
        color: "#ec4899"
      },
      {
        category: "Social",
        totalAmount: 0,
        totalAmountDisplay: "$0",
        percentage: 0,
        dealCount: 0,
        color: "#06b6d4"
      },
      {
        category: "Privacy",
        totalAmount: 0,
        totalAmountDisplay: "$0",
        percentage: 0,
        dealCount: 0,
        color: "#6366f1"
      },
      {
        category: "Enterprise",
        totalAmount: 0,
        totalAmountDisplay: "$0",
        percentage: 0,
        dealCount: 0,
        color: "#84cc16"
      },
      {
        category: "NFTs",
        totalAmount: 0,
        totalAmountDisplay: "$0",
        percentage: 0,
        dealCount: 0,
        color: "#a855f7"
      },
      {
        category: "Identity",
        totalAmount: 0,
        totalAmountDisplay: "$0",
        percentage: 0,
        dealCount: 0,
        color: "#f59e0b"
      },
      {
        category: "Security",
        totalAmount: 0,
        totalAmountDisplay: "$0",
        percentage: 0,
        dealCount: 0,
        color: "#ef4444"
      },
      {
        category: "Wallets",
        totalAmount: 0,
        totalAmountDisplay: "$0",
        percentage: 0,
        dealCount: 0,
        color: "#14b8a6"
      },
      {
        category: "Mining",
        totalAmount: 0,
        totalAmountDisplay: "$0",
        percentage: 0,
        dealCount: 0,
        color: "#78716c"
      },
      {
        category: "Data",
        totalAmount: 0,
        totalAmountDisplay: "$0",
        percentage: 0,
        dealCount: 0,
        color: "#8b5a2b"
      },
      {
        category: "Others",
        totalAmount: 0,
        totalAmountDisplay: "$0",
        percentage: 0,
        dealCount: 0,
        color: "#6b7280"
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
      dealCount: 187,
      avgRoundSize: "$15M",
      avgRoundSizeNum: 15000000
    }
  };
}