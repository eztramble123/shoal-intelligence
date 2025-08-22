// Quick test to verify coverage calculation
const { calculateCoverage } = require('./app/lib/parity-utils.ts');

// Test token with all exchanges true
const testExchanges = {
  binance: true,
  coinbase: true,
  kraken: true,
  okx: true,
  bybit: true,
  kucoin: true,
  huobi: true,
  gate: true,
  mexc: true
};

const coverage = calculateCoverage(testExchanges);
console.log('Coverage for token with all exchanges:', coverage);

// Test token with some exchanges false
const testExchanges2 = {
  binance: true,
  coinbase: false,
  kraken: true,
  okx: true,
  bybit: true,
  kucoin: true,
  huobi: true,
  gate: true,
  mexc: true
};

const coverage2 = calculateCoverage(testExchanges2);
console.log('Coverage for token missing coinbase:', coverage2);