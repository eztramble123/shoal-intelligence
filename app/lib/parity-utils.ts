import { 
  RawParityRecord, 
  ProcessedParityRecord, 
  CoverageOverview,
  ParityDashboardData 
} from '@/app/types/parity';

// Exchange mapping configuration
export const EXCHANGE_CONFIG = {
  binance: { display: 'Binance' },
  coinbase: { display: 'Coinbase' },
  kraken: { display: 'Kraken' },
  'gate.io': { display: 'Gate.io', aliases: ['Gate'] },
  mexc: { display: 'MEXC' },
  okx: { display: 'OKX', aliases: ['OKEx'] },
  bybit: { display: 'Bybit' },
  kucoin: { display: 'KuCoin' },
  huobi: { display: 'Huobi', aliases: ['HTX'] }
} as const;

export type ExchangeKey = keyof typeof EXCHANGE_CONFIG;

// Format large numbers for display
export const formatNumber = (num: number): string => {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
};

// Format volume for display
export const formatVolume = (num: number): string => {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
};

// Parse all exchanges from string or array format
export const parseAllExchanges = (exchanges: string | string[] | unknown): string[] => {
  // Handle undefined/null/empty
  if (!exchanges) return [];
  
  // Handle array format (like in mock data)
  if (Array.isArray(exchanges)) {
    return exchanges.filter(Boolean).map(e => String(e).trim());
  }
  
  // Handle string format (expected from real API)
  if (typeof exchanges === 'string') {
    if (exchanges.trim() === '') return [];
    return exchanges.split(',').map(e => e.trim()).filter(Boolean);
  }
  
  console.warn('[parseAllExchanges] Unexpected format:', typeof exchanges, exchanges);
  return [];
};

// Check if exchange name matches any alias
const matchesExchangeAlias = (exchangeName: string, config: { display: string; aliases?: readonly string[] }): boolean => {
  const name = exchangeName.toLowerCase().trim();
  const configKey = config.display.toLowerCase();
  
  // Check main name (exact match)
  if (name === configKey) return true;
  
  // Check main name (contains - for partial matches like "gate.io" matching "gate")
  if (name.includes(configKey.split('.')[0]) || configKey.includes(name)) return true;
  
  // Check aliases
  if (config.aliases) {
    return config.aliases.some(alias => {
      const aliasLower = alias.toLowerCase();
      return name === aliasLower || name.includes(aliasLower) || aliasLower.includes(name);
    });
  }
  
  return false;
};

// Get exchange availability from all_exchanges field only
export const getExchangeAvailability = (raw: RawParityRecord, exchangeKey: ExchangeKey): boolean => {
  const config = EXCHANGE_CONFIG[exchangeKey];
  
  // Use only allExchanges field for consistent data source across all exchanges
  const allExchanges = parseAllExchanges(raw.allExchanges);
  
  // Debug logging for first few tokens and all OKX checks to verify data
  const shouldLog = (raw.symbol && ['BTC', 'ETH', 'USDT', 'JUP', 'USDC'].includes(raw.symbol)) || exchangeKey === 'okx';
  
  if (shouldLog) {
    console.log(`[DEBUG] ${raw.symbol || 'unknown'} - ${exchangeKey}:`, {
      allExchanges_raw: raw.allExchanges,
      allExchanges_parsed: allExchanges,
      config_display: config.display,
      config_aliases: 'aliases' in config ? config.aliases : undefined
    });
  }
  
  const result = allExchanges.some(exchange => matchesExchangeAlias(exchange, config));
  
  if (shouldLog) {
    console.log(`[DEBUG] ${raw.symbol || 'unknown'} - ${exchangeKey} result:`, result);
  }
  
  return result;
};

// Get all supported exchange keys
export const getSupportedExchanges = (): ExchangeKey[] => {
  return Object.keys(EXCHANGE_CONFIG) as ExchangeKey[];
};

// Get exchange display name
export const getExchangeDisplayName = (exchangeKey: ExchangeKey): string => {
  return EXCHANGE_CONFIG[exchangeKey].display;
};

// Check if processed token is available on exchange
export const isTokenOnExchange = (token: ProcessedParityRecord, exchangeName: string): boolean => {
  const normalizedName = exchangeName.toLowerCase();
  
  switch (normalizedName) {
    case 'binance': return token.exchanges.binance;
    case 'coinbase': return token.exchanges.coinbase;
    case 'kraken': return token.exchanges.kraken;
    case 'okx': return token.exchanges.okx;
    case 'bybit': return token.exchanges.bybit;
    case 'kucoin': return token.exchanges.kucoin;
    case 'huobi': return token.exchanges.huobi;
    case 'gate.io': return token.exchanges.gate;
    case 'mexc': return token.exchanges.mexc;
    default: return false;
  }
};

// Calculate coverage metrics for a token relative to base exchange
export const calculateCoverage = (
  exchanges: ProcessedParityRecord['exchanges'],
  baseExchange: string = 'binance'
): {
  count: number;
  percentage: number;
  ratio: string;
  missing: string[];
  isOnBase: boolean;
} => {
  // Count all exchanges that are displayed in the UI (now including MEXC)
  const exchangeList = [
    { name: 'Binance', key: 'binance' as keyof typeof exchanges },
    { name: 'Coinbase', key: 'coinbase' as keyof typeof exchanges },
    { name: 'Kraken', key: 'kraken' as keyof typeof exchanges },
    { name: 'OKX', key: 'okx' as keyof typeof exchanges },
    { name: 'Bybit', key: 'bybit' as keyof typeof exchanges },
    { name: 'KuCoin', key: 'kucoin' as keyof typeof exchanges },
    { name: 'Huobi', key: 'huobi' as keyof typeof exchanges },
    { name: 'Gate.io', key: 'gate' as keyof typeof exchanges },
    { name: 'MEXC', key: 'mexc' as keyof typeof exchanges }
  ];
  
  // Debug: Always log exchange list length to verify it includes all 9 exchanges
  if (exchangeList.length !== 9) {
    console.error(`[COVERAGE ERROR] Exchange list has ${exchangeList.length} exchanges, expected 9`);
  }

  // Check if token is on base exchange
  const isOnBase = exchanges[baseExchange as keyof typeof exchanges] || false;
  
  // Calculate coverage across all exchanges (not relative to base)
  const availableCount = exchangeList.filter(ex => exchanges[ex.key]).length;
  const totalExchanges = exchangeList.length;
  const percentage = Math.round((availableCount / totalExchanges) * 100);
  const missing = exchangeList.filter(ex => !exchanges[ex.key]).map(ex => ex.name);
  
  return {
    count: availableCount,
    percentage,
    ratio: `${availableCount}/${totalExchanges}`,
    missing,
    isOnBase
  };
};

// Process raw parity record
export const processParityRecord = (raw: RawParityRecord, baseExchange: string = 'binance'): ProcessedParityRecord => {
  // Use boolean fields from API for exchanges that have them
  // Parse allExchanges for the ones that don't have boolean fields
  const allExchangesList = parseAllExchanges(raw.allExchanges);
  
  const exchanges = {
    binance: raw.isOnBinance || false,
    coinbase: raw.isOnCoinbase || false,
    kraken: raw.isOnKraken || false,
    mexc: raw.isOnMEXC || false,
    gate: raw.isOnGate || false,
    // These exchanges don't have boolean fields, so parse from allExchanges
    okx: allExchangesList.some(e => e.toLowerCase().includes('okx') || e.toLowerCase().includes('okex')),
    bybit: allExchangesList.some(e => e.toLowerCase().includes('bybit')),
    kucoin: allExchangesList.some(e => e.toLowerCase().includes('kucoin')),
    huobi: allExchangesList.some(e => e.toLowerCase().includes('huobi') || e.toLowerCase().includes('htx'))
  };

  const coverage = calculateCoverage(exchanges, baseExchange);
  const allExchanges = parseAllExchanges(raw.allExchanges);

  return {
    id: raw.id,
    symbol: raw.symbol,
    name: raw.name,
    rank: raw.rank,
    marketCap: raw.market_cap || 0,
    marketCapDisplay: formatNumber(raw.market_cap || 0),
    volume24h: raw.volume_24h || 0,
    volume24hDisplay: formatVolume(raw.volume_24h || 0),
    exchanges,
    coverageCount: coverage.count,
    coveragePercentage: coverage.percentage,
    coverageRatio: coverage.ratio,
    listingOpportunities: raw.listing_opportunities || 0,
    allExchanges,
    isMissing: coverage.missing.length > 0,
    missingExchanges: coverage.missing,
    contractAddresses: {
      ethereum: raw.contract_address_ethereum || undefined,
      bsc: raw.contract_address_bsc || undefined,
      polygon: raw.contract_address_polygon || undefined,
      arbitrum: raw.contract_address_arbitrum || undefined,
      optimism: raw.contract_address_optimism || undefined,
      avalanche: raw.contract_address_avalanche || undefined,
      solana: raw.contract_address_solana || undefined
    }
  };
};

// Calculate coverage overview statistics
export const calculateCoverageOverview = (tokens: ProcessedParityRecord[], baseExchange: string = 'binance'): CoverageOverview => {
  const totalTokens = tokens.length;
  const tokensMissing = tokens.filter(t => t.isMissing).length;
  
  const totalCoverage = tokens.reduce((sum, token) => sum + token.coveragePercentage, 0);
  const averageCoverage = Math.round(totalCoverage / totalTokens);

  // Find exclusive listings (tokens ONLY on the base exchange)
  const exclusiveListings = tokens.filter(t => {
    // Check if token is on base exchange
    const isOnBase = t.exchanges[baseExchange as keyof typeof t.exchanges] || false;
    // Token must be on exactly 1 exchange AND that exchange must be the base
    return t.coverageCount === 1 && isOnBase;
  }).length;
  const coverageRate = Math.round(((totalTokens - tokensMissing) / totalTokens) * 100);

  // Top missing exchanges
  const exchangeMissing = new Map<string, number>();
  tokens.forEach(token => {
    token.missingExchanges.forEach(exchange => {
      exchangeMissing.set(exchange, (exchangeMissing.get(exchange) || 0) + 1);
    });
  });

  const topMissingExchanges = Array.from(exchangeMissing.entries())
    .map(([exchange, count]) => ({
      exchange,
      missingCount: count,
      percentage: Math.round((count / totalTokens) * 100)
    }))
    .sort((a, b) => b.missingCount - a.missingCount)
    .slice(0, 5);

  return {
    tokensMissing,
    totalTokens,
    averageCoverage,
    exclusiveListings,
    coverageRate,
    topMissingExchanges
  };
};

// Process all parity data for dashboard
export const processParityData = (rawData: RawParityRecord[], baseExchange: string = 'binance'): ParityDashboardData => {
  const tokens = rawData.map(record => processParityRecord(record, baseExchange));
  const coverageOverview = calculateCoverageOverview(tokens, baseExchange);

  return {
    coverageOverview,
    tokens,
    totalRecords: tokens.length
  };
};

// Filter tokens based on exchange selection and search (legacy)
export const filterTokens = (
  tokens: ProcessedParityRecord[],
  selectedExchanges: string[],
  searchQuery: string
): ProcessedParityRecord[] => {
  return tokens.filter(token => {
    // Search filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchesName = token.name.toLowerCase().includes(query);
      const matchesSymbol = token.symbol.toLowerCase().includes(query);
      if (!matchesName && !matchesSymbol) return false;
    }

    // Exchange filter - if no exchanges selected, show all
    if (selectedExchanges.length === 0) return true;

    // Check if token is missing from any selected exchanges
    const missingFromSelected = selectedExchanges.some(exchange => {
      switch (exchange.toLowerCase()) {
        case 'binance': return !token.exchanges.binance;
        case 'coinbase': return !token.exchanges.coinbase;
        case 'kraken': return !token.exchanges.kraken;
        case 'okx': return !token.exchanges.okx;
        case 'bybit': return !token.exchanges.bybit;
        case 'kucoin': return !token.exchanges.kucoin;
        case 'huobi': return !token.exchanges.huobi;
        case 'gate.io': return !token.exchanges.gate;
        case 'mexc': return !token.exchanges.mexc;
        default: return false;
      }
    });

    return missingFromSelected;
  });
};

// Filter tokens based on primary vs compare exchange analysis
export const filterTokensByComparison = (
  tokens: ProcessedParityRecord[],
  primaryExchange: string,
  compareExchanges: string[],
  searchQuery: string
): ProcessedParityRecord[] => {
  // Add null safety guard
  if (!tokens || !Array.isArray(tokens)) {
    return [];
  }
  
  return tokens.filter(token => {
    // Search filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchesName = token.name.toLowerCase().includes(query);
      const matchesSymbol = token.symbol.toLowerCase().includes(query);
      if (!matchesName && !matchesSymbol) return false;
    }

    // If no compare exchanges selected, show all tokens
    if (compareExchanges.length === 0) return true;

    // Get exchange availability function
    const isOnExchange = (exchange: string) => {
      switch (exchange.toLowerCase()) {
        case 'binance': return token.exchanges.binance;
        case 'coinbase': return token.exchanges.coinbase;
        case 'kraken': return token.exchanges.kraken;
        case 'okx': return token.exchanges.okx;
        case 'bybit': return token.exchanges.bybit;
        case 'kucoin': return token.exchanges.kucoin;
        case 'huobi': return token.exchanges.huobi;
        case 'gate.io': return token.exchanges.gate;
        case 'mexc': return token.exchanges.mexc;
        default: return false;
      }
    };

    // Check if token is on primary exchange
    const onPrimary = isOnExchange(primaryExchange);
    
    // Check if token is on any compare exchanges
    const onAnyCompare = compareExchanges.some(exchange => isOnExchange(exchange));
    
    // New methodology: Show listing opportunities only
    // What assets are on [compare exchanges] that are NOT on [primary exchange]
    // Use simple OR logic for compare exchanges
    return (onAnyCompare && !onPrimary);
  });
};