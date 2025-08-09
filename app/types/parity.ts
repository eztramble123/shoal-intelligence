// Raw API response structure from Blake AI parity endpoint
export interface RawParityRecord {
  id: string;
  symbol: string;
  name: string;
  rank: number;
  market_cap: number;
  volume_24h: number;
  isOnCoinbase: boolean;
  isOnBinance: boolean;
  isOnKraken: boolean;
  isOnMEXC: boolean;
  isOnGate: boolean;
  listing_opportunities: number;
  all_exchanges: string;
  contract_address_ethereum: string;
  contract_address_bsc: string;
  contract_address_polygon: string;
  contract_address_arbitrum: string;
  contract_address_optimism: string;
  contract_address_avalanche: string;
  contract_address_solana: string;
}

// Processed parity record with additional computed fields
export interface ProcessedParityRecord {
  id: string;
  symbol: string;
  name: string;
  rank: number;
  marketCap: number;
  marketCapDisplay: string;
  volume24h: number;
  volume24hDisplay: string;
  exchanges: {
    coinbase: boolean;
    binance: boolean;
    kraken: boolean;
    mexc: boolean;
    gate: boolean;
    okx: boolean;
    bybit: boolean;
    kucoin: boolean;
    huobi: boolean;
  };
  coverageCount: number;
  coveragePercentage: number;
  coverageRatio: string;
  listingOpportunities: number;
  allExchanges: string[];
  isMissing: boolean;
  missingExchanges: string[];
  contractAddresses: {
    ethereum?: string;
    bsc?: string;
    polygon?: string;
    arbitrum?: string;
    optimism?: string;
    avalanche?: string;
    solana?: string;
  };
}

// Coverage overview statistics
export interface CoverageOverview {
  tokensMissing: number;
  totalTokens: number;
  averageCoverage: number;
  exclusiveListings: number;
  coverageRate: number;
  topMissingExchanges: {
    exchange: string;
    missingCount: number;
    percentage: number;
  }[];
}

// Parity dashboard data
export interface ParityDashboardData {
  coverageOverview: CoverageOverview;
  tokens: ProcessedParityRecord[];
  totalRecords: number;
}