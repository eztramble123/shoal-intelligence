import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processFundingData } from '@/app/lib/funding-utils';
import { RawFundingRecord } from '@/app/types/funding';

const prisma = new PrismaClient();

// API endpoint to collect daily funding snapshots
// This should be called daily by a cron job or scheduler
export async function POST(request: Request) {
  try {
    
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.CRON_SECRET;
    
    if (!expectedKey) {
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
    const apiUrl = process.env.BLAKE_API_URL;
    const apiKey = process.env.BLAKE_API_KEY;
    
    if (!apiUrl || !apiKey) {
      throw new Error('Blake AI API configuration missing');
    }
    
    // Fetch fresh data from Blake AI
    const response = await fetch(apiUrl, {
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
    
    const rawData: RawFundingRecord[] = await response.json();
    
    // Process the data to get category metrics
    const processedData = processFundingData(rawData);
    
    // Get today's date (without time for consistency)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Store snapshots for each sector
    const snapshots = [];
    
    for (const category of processedData.trendingCategories) {
      // Check if snapshot already exists for today
      const existingSnapshot = await prisma.fundingSnapshot.findUnique({
        where: {
          date_sector: {
            date: today,
            sector: category.category
          }
        }
      });
      
      if (existingSnapshot) {
        continue;
      }
      
      // Create new snapshot
      const snapshot = await prisma.fundingSnapshot.create({
        data: {
          date: today,
          sector: category.category,
          totalAmount: category.totalAmount,
          dealCount: category.dealCount,
          percentage: category.percentage
        }
      });
      
      snapshots.push(snapshot);
    }
    
    
    // Cleanup old snapshots (keep only last 120 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 120);
    
    const deletedCount = await prisma.fundingSnapshot.deleteMany({
      where: {
        date: {
          lt: cutoffDate
        }
      }
    });
    
    
    return NextResponse.json({
      success: true,
      snapshotsCreated: snapshots.length,
      date: today.toISOString().split('T')[0],
      sectorsProcessed: processedData.trendingCategories.length,
      oldSnapshotsDeleted: deletedCount.count
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to collect funding snapshots', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint to view recent snapshots (for debugging)
export async function GET() {
  try {
    const recentSnapshots = await prisma.fundingSnapshot.findMany({
      orderBy: [
        { date: 'desc' },
        { totalAmount: 'desc' }
      ],
      take: 50
    });
    
    interface SnapshotSummary {
      sector: string;
      totalAmount: number;
      dealCount: number;
      percentage: number;
    }
    
    const snapshotsByDate = recentSnapshots.reduce((acc, snapshot) => {
      const dateKey = snapshot.date.toISOString().split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push({
        sector: snapshot.sector,
        totalAmount: snapshot.totalAmount,
        dealCount: snapshot.dealCount,
        percentage: snapshot.percentage
      });
      return acc;
    }, {} as Record<string, SnapshotSummary[]>);
    
    return NextResponse.json({
      totalSnapshots: recentSnapshots.length,
      snapshotsByDate,
      availableDates: Object.keys(snapshotsByDate).sort().reverse()
    });
    
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve snapshots' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}