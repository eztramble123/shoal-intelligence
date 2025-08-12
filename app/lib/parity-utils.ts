import { 
  RawParityRecord, 
  ProcessedParityRecord, 
  CoverageOverview,
  ParityDashboardData 
} from '@/app/types/parity';

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

// Parse all exchanges string into array
export const parseAllExchanges = (exchangesStr: string): string[] => {
  if (!exchangesStr || exchangesStr.trim() === '') return [];
  return exchangesStr.split(',').map(e => e.trim()).filter(Boolean);
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

  // Check if token is on base exchange
  const isOnBase = exchanges[baseExchange as keyof typeof exchanges] || false;
  
  // If comparing to a base exchange, calculate coverage relative to that
  if (baseExchange && baseExchange !== 'all') {
    const otherExchanges = exchangeList.filter(ex => ex.key !== baseExchange);
    const availableCount = otherExchanges.filter(ex => exchanges[ex.key]).length;
    const percentage = Math.round((availableCount / otherExchanges.length) * 100);
    const missing = otherExchanges.filter(ex => !exchanges[ex.key]).map(ex => ex.name);

    return {
      count: availableCount,
      percentage,
      ratio: `${availableCount}/${otherExchanges.length}`,
      missing,
      isOnBase
    };
  }
  
  // Default behavior (all exchanges)
  const availableCount = exchangeList.filter(ex => exchanges[ex.key]).length;
  const totalExchanges = exchangeList.length;
  const percentage = Math.round((availableCount / totalExchanges) * 100);
  const missing = exchangeList.filter(ex => !exchanges[ex.key]).map(ex => ex.name);
  
  return {
    count: availableCount,
    percentage,
    ratio: `${availableCount}/${totalExchanges}`,
    missing,
    isOnBase: false
  };
};

// Process raw parity record
export const processParityRecord = (raw: RawParityRecord, baseExchange: string = 'binance'): ProcessedParityRecord => {
  const exchanges = {
    binance: raw.isOnBinance || false,
    coinbase: raw.isOnCoinbase || false,
    kraken: raw.isOnKraken || false,
    mexc: raw.isOnMEXC || false,
    gate: raw.isOnGate || false,
    // These aren't in the API but we'll default to false for now
    okx: false,
    bybit: false,
    kucoin: false,
    huobi: false
  };

  const coverage = calculateCoverage(exchanges, baseExchange);
  const allExchanges = parseAllExchanges(raw.all_exchanges);

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

  // Find exclusive listings (tokens on only 1-2 exchanges)
  const exclusiveListings = tokens.filter(t => t.coverageCount <= 2).length;
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
    
    // Show tokens where there's a difference:
    // 1. Missing from primary but available on compare exchanges (listing opportunities)
    // 2. Available on primary but missing from some compare exchanges (coverage gaps)
    return (onAnyCompare && !onPrimary) || (onPrimary && !compareExchanges.every(exchange => isOnExchange(exchange)));
  });
};