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

