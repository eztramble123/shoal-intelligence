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
    'Others': '#6b7280'
  };
  
  return colors[category] || colors['Others'];
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
  
  // Trending Categories
  const categoryMap = new Map<string, { total: number; count: number }>();
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
      percentage: (data.total / totalRaisedNum) * 100,
      dealCount: data.count,
      color: getCategoryColor(category)
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);
  
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
    latestRounds,
    monthlyFunding,
    last30Days: {
      totalRaised: formatAmount(last30DaysTotal),
      dealCount: last30DaysRecords.length
    }
  };
};