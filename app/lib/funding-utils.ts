import { 
  RawFundingRecord, 
  ProcessedFundingRecord, 
  InvestorMetrics, 
  CategoryMetrics, 
  MonthlyFunding,
  FundingDashboardData 
} from '@/app/types/funding';

// Parse amount strings like "$9.5m", "$2.5B", "$500K" to numbers
export const parseAmount = (str: string): number => {
  if (!str || str === '') return 0;
  
  // Remove currency symbols and spaces
  const cleanStr = str.replace(/[^0-9.bmk]/gi, '');
  const num = parseFloat(cleanStr);
  
  if (isNaN(num)) return 0;
  
  // Check for multipliers
  const lowerStr = str.toLowerCase();
  if (lowerStr.includes('b')) return num * 1e9;
  if (lowerStr.includes('m')) return num * 1e6;
  if (lowerStr.includes('k')) return num * 1e3;
  
  return num;
};

// Format amount for display
export const formatAmount = (num: number): string => {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
};

// Parse date from string like "07 Aug 2025"
export const parseDate = (dateStr: string): Date => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
};

// Format date for display
export const formatDate = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Parse investors from comma-separated strings
export const parseInvestors = (leadStr: string, othersStr: string): {
  lead: string[];
  others: string[];
  all: string[];
} => {
  const lead = leadStr 
    ? leadStr.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const others = othersStr 
    ? othersStr.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  
  return {
    lead,
    others,
    all: [...lead, ...others]
  };
};

// Process raw funding record
export const processFundingRecord = (raw: RawFundingRecord): ProcessedFundingRecord => {
  // Note: Date and Amount Raised fields are swapped in the API
  const amount = parseAmount(raw.Date);
  const date = parseDate(raw["Amount Raised"]);
  const investors = parseInvestors(raw["Lead Investor"], raw["Other Investors"]);
  
  return {
    name: raw.Name,
    amount,
    amountDisplay: formatAmount(amount),
    date,
    dateDisplay: formatDate(date),
    round: raw.Round,
    category: raw.Category,
    classifiedCategory: raw.ClassifiedCategory,
    description: raw.Description,
    leadInvestors: investors.lead,
    otherInvestors: investors.others,
    allInvestors: investors.all,
    link: raw.Link,
    valuation: raw.Valuation,
    chains: raw.Chains
  };
};

// Get category color
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Infrastructure': '#8b5cf6',
    'DeFi': '#3b82f6',
    'Gaming': '#10b981',
    'AI': '#f97316',
    'Trading': '#ec4899',
    'Social': '#06b6d4',
    'Privacy': '#6366f1',
    'Enterprise': '#84cc16',
    'NFTs': '#a855f7',
    'Identity': '#f59e0b',
    'Security': '#ef4444',
    'Mining': '#78716c',
    'Wallets': '#14b8a6',
    'Data': '#8b5a2b',
    'Others': '#6b7280'
  };
  
  return colors[category] || colors['Others'];
};

// Process 90-day funding categories for treemap
export const process90DayFundingCategories = (processedRecords: ProcessedFundingRecord[]): CategoryMetrics[] => {
  
  // Filter records to last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const last90DaysRecords = processedRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= ninetyDaysAgo;
  });
  
  
  // All sectors to ensure complete coverage
  const allSectors = [
    'Infrastructure', 'DeFi', 'Gaming', 'AI', 'Trading', 'Social', 
    'Privacy', 'Enterprise', 'NFTs', 'Identity', 'Security', 
    'Mining', 'Wallets', 'Data', 'Others'
  ];
  
  const categoryMap = new Map<string, { total: number; count: number }>();
  
  // Initialize all sectors with zero values
  allSectors.forEach(sector => {
    categoryMap.set(sector, { total: 0, count: 0 });
  });
  
  // Add 90-day funding data
  last90DaysRecords.forEach(record => {
    const cat = record.classifiedCategory || 'Others';
    const existing = categoryMap.get(cat) || { total: 0, count: 0 };
    existing.total += record.amount;
    existing.count += 1;
    categoryMap.set(cat, existing);
  });
  
  // Calculate total for percentages
  const total90DayFunding = last90DaysRecords.reduce((sum, r) => sum + r.amount, 0);
  
  const last90DaysCategories: CategoryMetrics[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      totalAmount: data.total,
      totalAmountDisplay: formatAmount(data.total),
      percentage: total90DayFunding > 0 ? (data.total / total90DayFunding) * 100 : 0,
      dealCount: data.count,
      color: getCategoryColor(category)
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
  
  
  return last90DaysCategories;
};

// Calculate trend data by comparing current vs previous periods
export const calculateTrendData = async (periodDays: number = 7): Promise<Record<string, {
  trendPercentage: number;
  trendDirection: 'up' | 'down' | 'neutral';
  trendDisplay: string;
  previousAmount: number;
}>> => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    
    // Get current period (last N days)
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const currentPeriodStart = new Date(today);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - periodDays);
    currentPeriodStart.setHours(0, 0, 0, 0);
    
    // Get previous period (N days before current period)
    const previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodEnd.setMilliseconds(previousPeriodEnd.getMilliseconds() - 1);
    
    const previousPeriodStart = new Date(previousPeriodEnd);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);
    previousPeriodStart.setHours(0, 0, 0, 0);
    
    
    // Get current period data
    const currentPeriodData = await prisma.fundingSnapshot.groupBy({
      by: ['sector'],
      where: {
        date: {
          gte: currentPeriodStart,
          lte: today
        }
      },
      _avg: {
        totalAmount: true
      },
      _sum: {
        dealCount: true
      }
    });
    
    // Get previous period data
    const previousPeriodData = await prisma.fundingSnapshot.groupBy({
      by: ['sector'],
      where: {
        date: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd
        }
      },
      _avg: {
        totalAmount: true
      },
      _sum: {
        dealCount: true
      }
    });
    
    
    // Create lookup maps
    const currentMap = new Map(currentPeriodData.map(item => [item.sector, item._avg.totalAmount || 0]));
    const previousMap = new Map(previousPeriodData.map(item => [item.sector, item._avg.totalAmount || 0]));
    
    // Calculate trends for all sectors
    const allSectors = [
      'Infrastructure', 'DeFi', 'Gaming', 'AI', 'Trading', 'Social', 
      'Privacy', 'Enterprise', 'NFTs', 'Identity', 'Security', 
      'Mining', 'Wallets', 'Data', 'Others'
    ];
    
    const trends: Record<string, {
      trendPercentage: number;
      trendDirection: 'up' | 'down' | 'neutral';
      trendDisplay: string;
      previousAmount: number;
    }> = {};
    
    for (const sector of allSectors) {
      const currentAmount = currentMap.get(sector) || 0;
      const previousAmount = previousMap.get(sector) || 0;
      
      let trendPercentage = 0;
      let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
      
      if (previousAmount > 0) {
        trendPercentage = ((currentAmount - previousAmount) / previousAmount) * 100;
      } else if (currentAmount > 0) {
        trendPercentage = 100; // New activity where there was none
      }
      
      // Determine direction with 5% threshold for neutral
      if (Math.abs(trendPercentage) < 5) {
        trendDirection = 'neutral';
      } else {
        trendDirection = trendPercentage > 0 ? 'up' : 'down';
      }
      
      const trendDisplay = trendPercentage > 0 ? 
        `+${trendPercentage.toFixed(1)}%` : 
        `${trendPercentage.toFixed(1)}%`;
      
      trends[sector] = {
        trendPercentage,
        trendDirection,
        trendDisplay,
        previousAmount
      };
      
    }
    
    await prisma.$disconnect();
    return trends;
    
  } catch {
    // Return neutral trends as fallback
    const fallbackTrends: Record<string, {
      trendPercentage: number;
      trendDirection: 'up' | 'down' | 'neutral';
      trendDisplay: string;
      previousAmount: number;
    }> = {};
    const allSectors = [
      'Infrastructure', 'DeFi', 'Gaming', 'AI', 'Trading', 'Social', 
      'Privacy', 'Enterprise', 'NFTs', 'Identity', 'Security', 
      'Mining', 'Wallets', 'Data', 'Others'
    ];
    
    for (const sector of allSectors) {
      fallbackTrends[sector] = {
        trendPercentage: 0,
        trendDirection: 'neutral',
        trendDisplay: '0.0%',
        previousAmount: 0
      };
    }
    
    return fallbackTrends;
  }
};

// Process all funding data for dashboard
export const processFundingData = (rawData: RawFundingRecord[]): FundingDashboardData => {
  
  // Process all records
  const processedRecords = rawData.map(processFundingRecord);
  
  
  // Filter last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const last30DaysRecords = processedRecords.filter(r => r.date >= thirtyDaysAgo);
  
  // Calculate totals
  const totalRaisedNum = processedRecords.reduce((sum, r) => sum + r.amount, 0);
  const last30DaysTotal = last30DaysRecords.reduce((sum, r) => sum + r.amount, 0);
  const avgRoundSizeNum = totalRaisedNum / (processedRecords.length || 1);
  const last30DaysAvgRoundSizeNum = last30DaysTotal / (last30DaysRecords.length || 1);
  
  // Most Active Investors
  const investorMap = new Map<string, { total: number; deals: string[] }>();
  processedRecords.forEach(record => {
    record.allInvestors.forEach(investor => {
      const existing = investorMap.get(investor) || { total: 0, deals: [] };
      existing.total += record.amount;
      existing.deals.push(record.name);
      investorMap.set(investor, existing);
    });
  });
  
  const mostActiveInvestors: InvestorMetrics[] = Array.from(investorMap.entries())
    .map(([name, data]) => ({
      name,
      totalInvested: data.total,
      totalInvestedDisplay: formatAmount(data.total),
      dealCount: data.deals.length,
      recentDeals: data.deals.slice(0, 3)
    }))
    .sort((a, b) => b.totalInvested - a.totalInvested)
    .slice(0, 10);
  
  // Trending Categories - ensure all sectors are represented
  const allSectors = [
    'Infrastructure', 'DeFi', 'Gaming', 'AI', 'Trading', 'Social', 
    'Privacy', 'Enterprise', 'NFTs', 'Identity', 'Security', 
    'Mining', 'Wallets', 'Data', 'Others'
  ];
  
  const categoryMap = new Map<string, { total: number; count: number }>();
  
  // Initialize all sectors with zero values
  allSectors.forEach(sector => {
    categoryMap.set(sector, { total: 0, count: 0 });
  });
  
  // Add actual funding data
  processedRecords.forEach(record => {
    const cat = record.classifiedCategory || 'Others';
    const existing = categoryMap.get(cat) || { total: 0, count: 0 };
    existing.total += record.amount;
    existing.count += 1;
    categoryMap.set(cat, existing);
  });
  
  const trendingCategories: CategoryMetrics[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      totalAmount: data.total,
      totalAmountDisplay: formatAmount(data.total),
      percentage: totalRaisedNum > 0 ? (data.total / totalRaisedNum) * 100 : 0,
      dealCount: data.count,
      color: getCategoryColor(category)
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
  
  
  // Process 90-day categories for treemap
  const last90DaysCategories = process90DayFundingCategories(processedRecords);
  
  // Monthly Funding
  const monthlyMap = new Map<string, number>();
  processedRecords.forEach(record => {
    const monthKey = record.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const existing = monthlyMap.get(monthKey) || 0;
    monthlyMap.set(monthKey, existing + record.amount);
  });
  
  const monthlyFunding: MonthlyFunding[] = Array.from(monthlyMap.entries())
    .map(([month, total]) => ({
      month,
      total: total / 1e9, // Convert to billions
      displayTotal: formatAmount(total)
    }))
    .sort((a, b) => {
      const dateA = new Date(`1 ${a.month}`);
      const dateB = new Date(`1 ${b.month}`);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 12); // Last 12 months
  
  // Latest Rounds - return all records for proper pagination
  const latestRounds = processedRecords
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  
  return {
    totalRaised: formatAmount(totalRaisedNum),
    totalRaisedNum,
    activeDeals: processedRecords.length,
    avgRoundSize: formatAmount(avgRoundSizeNum),
    avgRoundSizeNum,
    mostActiveInvestors,
    trendingCategories,
    last90DaysCategories,
    latestRounds,
    monthlyFunding,
    last30Days: {
      totalRaised: formatAmount(last30DaysTotal),
      dealCount: last30DaysRecords.length,
      avgRoundSize: formatAmount(last30DaysAvgRoundSizeNum),
      avgRoundSizeNum: last30DaysAvgRoundSizeNum
    }
  };
};