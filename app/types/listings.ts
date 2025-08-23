// Raw API response structure from Blake AI listings endpoint
export interface RawListingRecord {
  sourceMessage: string;
  ticker: string;
  id: string;
  name: string;
  symbol: string;
  price_usd: number | null;
  market_cap_usd: number | null;
  fdv_usd: number | null;
  volume_24h_usd: number | null;
  high_24h_usd: number | null;
  low_24h_usd: number | null;
  price_change_24h: number | null;
  price_change_pct_24h: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath_usd: number | null;
  atl_usd: number | null;
  ath_change_pct_usd: number | null;
  atl_change_pct_usd: number | null;
  ath_date_usd: string | null;
  atl_date_usd: string | null;
  asset_platform_id: string | null;
  platforms: Record<string, string>;
  all_exchanges: string;
  coingecko_url: string | null;
  category: string | null;
  public_notice: string | null;
  last_updated: string;
  scraped_at: string;
  listingDate: number; // Unix timestamp for actual listing date
  exchange?: string; // Primary exchange for this listing event
  type?: string; // Listing type (e.g., "Futures", "Spot")
}

// Processed listing record with additional computed fields
export interface ProcessedListingRecord {
  ticker: string;
  id: string;
  name: string;
  symbol: string;
  displayName: string;
  sourceMessage: string;
  price: number | null;
  priceDisplay: string;
  marketCap: number | null;
  marketCapDisplay: string;
  volume24h: number | null;
  volume24hDisplay: string;
  priceChange24h: number | null;
  priceChangePct24h: number | null;
  exchanges: string[];
  exchangesCount: number;
  exchangesDisplay: string;
  lastUpdated: Date;
  lastUpdatedDisplay: string;
  scrapedAt: Date;
  scrapedAtDisplay: string;
  listingDate: Date; // Actual listing date from API
  listingDateDisplay: string; // Formatted listing date for display
  primaryExchange?: string; // Primary exchange for this listing event
  listingType?: string; // Listing type (e.g., "Futures", "Spot")
  platforms: Record<string, string>;
  coingeckoUrl: string | null; // CoinGecko URL from API
  momentum: 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'GROWING' | 'DECLINING';
  momentumColor: string;
  chartData: number[];
  // Trend data for time-based analysis
  previousExchangeCount?: number;
  trendPercentage?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendDisplay?: string; // Formatted like "+15.3%" or "-8.7%"
}

// Live listing alert for real-time feed
export interface LiveListingAlert {
  timestamp: string;
  exchange: string;
  asset: string;
  name: string;
  type: 'SPOT' | 'FUTURES' | 'LISTING';
  status: 'Live' | 'Pending' | 'Failed';
  price: string;
  coingeckoUrl?: string | null;
  successScore?: number;
  sourceMessage: string;
}

// Treemap data for Matrix Analysis Summary
export interface TreemapData {
  name: string;
  value: number;
  size: number;
  fill: string;
  changeType: 'positive' | 'negative' | 'neutral';
  chartData: number[];
  ticker: string;
  exchangesCount: number;
}

// Metric cards for dashboard
export interface MetricCard {
  title: string;
  value: string | number;
  subtitle?: string;
}

// Token card for adoption map
export interface TokenCard {
  symbol: string;
  name: string;
  exchanges: string[];
  exchangeCount: number;
  adoption24h: string;
  momentum: 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'GROWING' | 'DECLINING';
  momentumColor: string;
  listedOn: string;
  lastUpdated: string;
  priceChange: number | null;
  volume: string;
  coingeckoUrl?: string | null;
}

// Exchange activity data
export interface ExchangeActivity {
  name: string;
  count: number;
  status: 'new' | 'active' | 'declining';
}

// Complete dashboard data structure
export interface ListingsDashboardData {
  processedListings: ProcessedListingRecord[];
  treemapData: TreemapData[];
  tokenCards: TokenCard[];
  liveListings: LiveListingAlert[];
  adoptionMetrics: MetricCard[];
  exchangeActivity: ExchangeActivity[];
  fastestGrowing: {
    symbol: string;
    exchanges: string;
    status: 'up' | 'down' | 'stable';
    timeframe?: string;
  }[];
  newestListings: {
    symbol: string;
    exchange: string;
    time: string;
  }[];
  totalRecords: number;
  last24Hours: {
    totalListings: number;
    listings: ProcessedListingRecord[];
  };
  // Time-based period data
  last30Days: {
    newListings: ProcessedListingRecord[];
    totalNewListings: number;
    avgExchangesPerListing: number;
    topNewListings: ProcessedListingRecord[];
  };
  last90Days: {
    newListings: ProcessedListingRecord[];
    totalNewListings: number;
    avgExchangesPerListing: number;
    topNewListings: ProcessedListingRecord[];
  };
  yearToDate: {
    newListings: ProcessedListingRecord[];
    totalNewListings: number;
    avgExchangesPerListing: number;
    topNewListings: ProcessedListingRecord[];
  };
  // Trending listings with real trend data
  trendingListings: ProcessedListingRecord[];
}