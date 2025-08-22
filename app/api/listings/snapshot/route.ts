import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processListingsData } from '@/app/lib/listings-utils';
import { RawListingRecord } from '@/app/types/listings';

const prisma = new PrismaClient();

// API endpoint to collect daily listing snapshots
// This should be called daily by a cron job or scheduler
export async function POST(request: Request) {
  try {
    console.log('=== DAILY LISTING SNAPSHOT COLLECTION ===');
    
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.CRON_SECRET;
    
    if (!expectedKey) {
      console.error('CRON_SECRET environment variable is required but not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    if (authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get environment variables for Blake AI API
    const apiKey = process.env.BLAKE_API_KEY;
    
    if (!apiKey) {
      throw new Error('Blake AI API configuration missing');
    }
    
    // Fetch fresh data from Blake AI
    console.log('Fetching data from Blake AI listings endpoint...');
    const response = await fetch('https://api.withblake.ai/listings', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({}),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Blake AI API request failed: ${response.status}`);
    }
    
    const rawData: RawListingRecord[] = await response.json();
    console.log(`Fetched ${rawData.length} listing records from Blake AI`);
    
    // Process the data to get listing metrics
    const processedData = processListingsData(rawData);
    console.log(`Processed data into ${processedData.processedListings.length} unique listings`);
    
    // Get today's date (without time for consistency)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Store snapshots for each listing
    const snapshots = [];
    
    for (const listing of processedData.processedListings) {
      // Check if snapshot already exists for today
      const existingSnapshot = await prisma.listingSnapshot.findUnique({
        where: {
          date_ticker: {
            date: today,
            ticker: listing.ticker
          }
        }
      });
      
      if (existingSnapshot) {
        console.log(`Snapshot already exists for ${listing.ticker} on ${today.toISOString().split('T')[0]}`);
        continue;
      }
      
      // Create new snapshot
      const snapshot = await prisma.listingSnapshot.create({
        data: {
          date: today,
          ticker: listing.ticker,
          symbol: listing.symbol,
          name: listing.name,
          exchanges: listing.exchanges,
          exchangeCount: listing.exchangesCount,
          price: listing.price,
          marketCap: listing.marketCap,
          volume24h: listing.volume24h,
          scrapedAt: listing.scrapedAt
        }
      });
      
      snapshots.push(snapshot);
      console.log(`Created snapshot for ${listing.ticker}: ${listing.exchangesCount} exchanges`);
    }
    
    console.log(`Successfully created ${snapshots.length} new snapshots`);
    
    // Cleanup old snapshots (keep only last 120 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 120);
    
    const deletedCount = await prisma.listingSnapshot.deleteMany({
      where: {
        date: {
          lt: cutoffDate
        }
      }
    });
    
    console.log(`Cleaned up ${deletedCount.count} old snapshots (older than 120 days)`);
    
    return NextResponse.json({
      success: true,
      snapshotsCreated: snapshots.length,
      date: today.toISOString().split('T')[0],
      listingsProcessed: processedData.processedListings.length,
      oldSnapshotsDeleted: deletedCount.count
    });
    
  } catch (error) {
    console.error('Listing snapshot collection error:', error);
    return NextResponse.json(
      { error: 'Failed to collect listing snapshots', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint to view recent snapshots (for debugging)
export async function GET() {
  try {
    const recentSnapshots = await prisma.listingSnapshot.findMany({
      orderBy: [
        { date: 'desc' },
        { exchangeCount: 'desc' }
      ],
      take: 50
    });
    
    interface ListingSnapshotSummary {
      ticker: string;
      name: string;
      exchangeCount: number;
      exchanges: string[];
      price: number | null;
    }
    
    const snapshotsByDate = recentSnapshots.reduce((acc, snapshot) => {
      const dateKey = snapshot.date.toISOString().split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push({
        ticker: snapshot.ticker,
        name: snapshot.name,
        exchangeCount: snapshot.exchangeCount,
        exchanges: snapshot.exchanges,
        price: snapshot.price
      });
      return acc;
    }, {} as Record<string, ListingSnapshotSummary[]>);
    
    return NextResponse.json({
      totalSnapshots: recentSnapshots.length,
      snapshotsByDate,
      availableDates: Object.keys(snapshotsByDate).sort().reverse()
    });
    
  } catch (error) {
    console.error('Snapshot retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve snapshots' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}