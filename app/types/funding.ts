// Raw API response structure (note: Date and Amount Raised fields are swapped)
export interface RawFundingRecord {
  Name: string;
  Date: string; // Actually contains amount like "$9.5m"
  "Amount Raised": string; // Actually contains date like "07 Aug 2025"
  Round: string;
  Category: string;
  ClassifiedCategory: string;
  Description: string;
  "Lead Investor": string;
  "Other Investors": string;
  Link: string;
  Valuation: string;
  Chains: string;
}

// Processed funding record with corrected fields
export interface ProcessedFundingRecord {
  name: string;
  amount: number; // Parsed numeric value
  amountDisplay: string; // Formatted display string
  date: Date;
  dateDisplay: string; // Formatted date string
  round: string;
  category: string;
  classifiedCategory: string;
  description: string;
  leadInvestors: string[];
  otherInvestors: string[];
  allInvestors: string[];
  link: string;
  valuation: string;
  chains: string;
}

// Aggregated data for UI sections
export interface InvestorMetrics {
  name: string;
  totalInvested: number;
  totalInvestedDisplay: string;
  dealCount: number;
  recentDeals: string[];
}

export interface CategoryMetrics {
  category: string;
  totalAmount: number;
  totalAmountDisplay: string;
  percentage: number;
  dealCount: number;
  color: string;
}

export interface MonthlyFunding {
  month: string;
  total: number; // In billions
  displayTotal: string;
}

export interface FundingDashboardData {
  totalRaised: string;
  totalRaisedNum: number;
  activeDeals: number;
  avgRoundSize: string;
  avgRoundSizeNum: number;
  mostActiveInvestors: InvestorMetrics[];
  trendingCategories: CategoryMetrics[];
  latestRounds: ProcessedFundingRecord[];
  monthlyFunding: MonthlyFunding[];
  last30Days: {
    totalRaised: string;
    dealCount: number;
  };
}