// Sample data for the crypto analytics dashboard

export interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  volume24h: number;
  marketCap: number;
  change24h: number;
  category: string;
  chain: string;
  listings: {
    exchange: string;
    listed: boolean;
    date?: string;
  }[];
  trending?: number;
}

export interface VentureInvestment {
  id: string;
  project: string;
  amount: number;
  stage: string;
  investors: string[];
  date: string;
  category: string;
  valuation?: number;
}

export interface ListingActivity {
  id: string;
  token: Token;
  exchange: string;
  timestamp: string;
  type: 'listing' | 'delisting';
  volume?: number;
}

export const EXCHANGES = [
  'Binance',
  'Coinbase',
  'Kraken',
  'OKX',
  'Bybit',
  'Your Exchange'
];

export const sampleTokens: Token[] = [
  {
    id: '1',
    symbol: 'JUP',
    name: 'Jupiter',
    price: 0.65,
    volume24h: 248000000,
    marketCap: 845000000,
    change24h: 12.5,
    category: 'DEX',
    chain: 'Solana',
    trending: 1,
    listings: [
      { exchange: 'Your Exchange', listed: false },
      { exchange: 'Binance', listed: true, date: '2024-01-31' },
      { exchange: 'Coinbase', listed: true, date: '2024-02-15' },
      { exchange: 'Kraken', listed: true, date: '2024-02-20' },
      { exchange: 'OKX', listed: true, date: '2024-01-31' },
      { exchange: 'Bybit', listed: true, date: '2024-02-01' }
    ]
  },
  {
    id: '2',
    symbol: 'AR',
    name: 'Arweave',
    price: 18.45,
    volume24h: 156000000,
    marketCap: 1200000000,
    change24h: -3.2,
    category: 'Storage Protocol',
    chain: 'Arweave',
    trending: 2,
    listings: [
      { exchange: 'Your Exchange', listed: false },
      { exchange: 'Binance', listed: true, date: '2021-07-15' },
      { exchange: 'Coinbase', listed: true, date: '2021-08-12' },
      { exchange: 'Kraken', listed: true, date: '2021-09-01' },
      { exchange: 'OKX', listed: true, date: '2021-07-20' },
      { exchange: 'Bybit', listed: true, date: '2021-08-05' }
    ]
  },
  {
    id: '3',
    symbol: 'WIF',
    name: 'dogwifhat',
    price: 2.34,
    volume24h: 892000000,
    marketCap: 2340000000,
    change24h: 45.7,
    category: 'Memecoin',
    chain: 'Solana',
    trending: 3,
    listings: [
      { exchange: 'Your Exchange', listed: false },
      { exchange: 'Binance', listed: false },
      { exchange: 'Coinbase', listed: false },
      { exchange: 'Kraken', listed: true, date: '2024-03-15' },
      { exchange: 'OKX', listed: true, date: '2024-03-10' },
      { exchange: 'Bybit', listed: true, date: '2024-03-12' }
    ]
  },
  {
    id: '4',
    symbol: 'ARB',
    name: 'Arbitrum',
    price: 0.78,
    volume24h: 2300000000,
    marketCap: 2850000000,
    change24h: 8.9,
    category: 'Layer 2',
    chain: 'Arbitrum',
    trending: 4,
    listings: [
      { exchange: 'Your Exchange', listed: false },
      { exchange: 'Binance', listed: true, date: '2023-03-23' },
      { exchange: 'Coinbase', listed: true, date: '2023-03-23' },
      { exchange: 'Kraken', listed: true, date: '2023-03-24' },
      { exchange: 'OKX', listed: true, date: '2023-03-23' },
      { exchange: 'Bybit', listed: false }
    ]
  },
  {
    id: '5',
    symbol: 'PEPE',
    name: 'Pepe',
    price: 0.000008,
    volume24h: 890000000,
    marketCap: 3360000000,
    change24h: 23.4,
    category: 'Memecoin',
    chain: 'Ethereum',
    trending: 5,
    listings: [
      { exchange: 'Your Exchange', listed: false },
      { exchange: 'Binance', listed: true, date: '2023-05-05' },
      { exchange: 'Coinbase', listed: true, date: '2023-07-20' },
      { exchange: 'Kraken', listed: false },
      { exchange: 'OKX', listed: true, date: '2023-05-06' },
      { exchange: 'Bybit', listed: true, date: '2023-05-05' }
    ]
  }
];

export const sampleVentureInvestments: VentureInvestment[] = [
  {
    id: '1',
    project: 'Monad Labs',
    amount: 225000000,
    stage: 'Series A',
    investors: ['Paradigm', 'Electric Capital', 'Coinbase Ventures', 'Castle Island Ventures'],
    date: '2024-04-09',
    category: 'Infrastructure',
    valuation: 3000000000
  },
  {
    id: '2',
    project: 'Berachain',
    amount: 100000000,
    stage: 'Series B',
    investors: ['Polychain Capital', 'Hack VC', 'Robot Ventures', 'Dao5'],
    date: '2024-04-15',
    category: 'Layer 1'
  },
  {
    id: '3',
    project: 'EigenLayer',
    amount: 50000000,
    stage: 'Series A',
    investors: ['a16z crypto', 'Polychain Capital', 'Coinbase Ventures', 'Blockchain Capital'],
    date: '2024-03-28',
    category: 'Infrastructure'
  },
  {
    id: '4',
    project: 'Celestia',
    amount: 55000000,
    stage: 'Series A',
    investors: ['Bain Capital Crypto', 'Polychain Capital', 'Maven 11', 'Placeholder'],
    date: '2024-03-20',
    category: 'Data Availability'
  },
  {
    id: '5',
    project: 'LayerZero',
    amount: 120000000,
    stage: 'Series A+',
    investors: ['a16z crypto', 'Sequoia Capital', 'FTX Ventures', 'Coinbase Ventures'],
    date: '2024-04-02',
    category: 'Infrastructure'
  },
  {
    id: '6',
    project: 'Starknet',
    amount: 100000000,
    stage: 'Series D',
    investors: ['Paradigm', 'Three Arrows Capital', 'Alameda Research', 'Intel Capital'],
    date: '2024-03-15',
    category: 'Layer 2'
  },
  {
    id: '7',
    project: 'Babylon',
    amount: 70000000,
    stage: 'Series A',
    investors: ['Polychain Capital', 'Hack VC', 'Framework Ventures'],
    date: '2024-05-10',
    category: 'Infrastructure'
  },
  {
    id: '8',
    project: 'Aleo',
    amount: 200000000,
    stage: 'Series B',
    investors: ['a16z crypto', 'Tiger Global', 'Samsung Next', 'Slow Ventures'],
    date: '2024-02-28',
    category: 'Layer 1',
    valuation: 1450000000
  }
];

export const sampleListingActivity: ListingActivity[] = [
  {
    id: '1',
    token: sampleTokens[0],
    exchange: 'Binance',
    timestamp: '2024-08-07T10:30:00Z',
    type: 'listing',
    volume: 15000000
  },
  {
    id: '2',
    token: sampleTokens[1],
    exchange: 'Kraken',
    timestamp: '2024-08-07T08:15:00Z',
    type: 'listing',
    volume: 8500000
  },
  {
    id: '3',
    token: sampleTokens[2],
    exchange: 'Binance',
    timestamp: '2024-08-06T14:20:00Z',
    type: 'listing',
    volume: 25000000
  }
];

export const marketMetrics = {
  totalMarketCap: 2800000000000,
  volume24h: 156000000000,
  activeTokens: 2847,
  fearGreedIndex: 72,
  dominance: {
    btc: 54.2,
    eth: 16.8,
    others: 29.0
  }
};

export const coverageStats = {
  averageCoverage: 73,
  missingTokens: 47,
  exclusiveListings: 12,
  totalTracked: 150
};

export const trendingProjects = [
  { rank: 1, symbol: 'JUP', name: 'Jupiter', volume: '$248M', category: 'DEX', change: 12.5 },
  { rank: 2, symbol: 'AR', name: 'Arweave', volume: '$156M', category: 'Storage', change: -3.2 },
  { rank: 3, symbol: 'WIF', name: 'dogwifhat', volume: '$892M', category: 'Memecoin', change: 45.7 },
  { rank: 4, symbol: 'ARB', name: 'Arbitrum', volume: '$2.3B', category: 'Layer 2', change: 8.9 },
  { rank: 5, symbol: 'PEPE', name: 'Pepe', volume: '$890M', category: 'Memecoin', change: 23.4 }
];

// Utility functions
export function calculateCoveragePercentage(token: Token): number {
  const totalExchanges = token.listings.length;
  const listedExchanges = token.listings.filter(l => l.listed).length;
  return Math.round((listedExchanges / totalExchanges) * 100);
}

export function formatCurrency(amount: number): string {
  if (amount >= 1e12) return `$${(amount / 1e12).toFixed(1)}T`;
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}