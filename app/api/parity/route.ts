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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching parity data';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

