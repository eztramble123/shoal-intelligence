import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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
        { error: 'API configuration missing. Please check BLAKE_API_URL and BLAKE_API_KEY environment variables.' },
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
      throw new Error(`Blake AI API request failed with status ${response.status}: ${response.statusText}`);
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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching funding data';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

