import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { processListingsData, calculateListingTrends } from '@/app/lib/listings-utils';
import { RawListingRecord, ListingsDashboardData } from '@/app/types/listings';

// Apply period-specific filtering to focus data on the requested time range
function applyPeriodFilter(data: ListingsDashboardData, period: string): ListingsDashboardData {
  // Get the period-specific data based on the request
  let filteredListings;
  
  switch (period) {
    case '30d':
      filteredListings = data.last30Days.newListings;
      break;
    case '90d':
      filteredListings = data.last90Days.newListings;
      break;
    case 'ytd':
      filteredListings = data.yearToDate.newListings;
      break;
    default:
      filteredListings = data.last30Days.newListings;
  }
  
  // Return data with the primary listings replaced by period-filtered data
  return {
    ...data,
    processedListings: filteredListings, // Replace with period-specific data
    totalRecords: filteredListings.length,
    // Keep the period data intact
    last30Days: data.last30Days,
    last90Days: data.last90Days,
    yearToDate: data.yearToDate
  };
}

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
    const period = url.searchParams.get('period') || '30d';

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
    
    // Apply period filtering to focus on the requested time range
    const periodFilteredData = applyPeriodFilter(processedData, period);
    
    // Calculate trends if requested
    if (includeTrends) {
      // Calculate trends for different periods
      const [trends30d, trends90d] = await Promise.all([
        calculateListingTrends(30),
        calculateListingTrends(90)
      ]);
      
      // Merge trend data with processed listings
      periodFilteredData.processedListings = periodFilteredData.processedListings.map(listing => {
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
      periodFilteredData.trendingListings = periodFilteredData.processedListings
        .filter(listing => listing.trendPercentage !== undefined)
        .sort((a, b) => (b.trendPercentage || 0) - (a.trendPercentage || 0))
        .slice(0, 10);
    }
    
    return NextResponse.json(periodFilteredData);
    
  } catch {
    
    return NextResponse.json(
      { error: 'Failed to fetch listings data' },
      { status: 500 }
    );
  }
}

