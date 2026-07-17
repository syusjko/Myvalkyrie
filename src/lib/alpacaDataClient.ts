// Alpaca Market Data API Client
const BASE_URL = 'https://data.alpaca.markets';

function getAuthHeaders() {
  const apiKey = process.env.ALPACA_API_KEY;
  const secret = process.env.ALPACA_API_SECRET;
  if (!apiKey || !secret) return null;
  return {
    'APCA-API-KEY-ID': apiKey,
    'APCA-API-SECRET-KEY': secret,
    'Accept': 'application/json'
  };
}

export async function getAlpacaLatestPrices(symbols: string[]) {
  const headers = getAuthHeaders();
  if (!headers || symbols.length === 0) return {};

  const cryptoSymbols = symbols.filter(s => ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'LTC', 'LINK', 'BCH'].includes(s)).map(s => `${s}/USD`);
  const stockSymbols = symbols.filter(s => !cryptoSymbols.includes(`${s}/USD`) && !s.includes('=') && !s.startsWith('^') && !s.endsWith('.KS') && !s.endsWith('.KQ'));

  let results: Record<string, any> = {};

  try {
    if (stockSymbols.length > 0) {
      const stockRes = await fetch(`${BASE_URL}/v2/stocks/snapshots?symbols=${stockSymbols.join(',')}&feed=iex`, { headers });
      if (stockRes.ok) {
        const data = await stockRes.json();
        for (const [sym, snap] of Object.entries(data)) {
          const s = snap as any;
          results[sym] = {
            price: s.latestTrade?.p || s.dailyBar?.c || 0,
            change: (s.latestTrade?.p || s.dailyBar?.c || 0) - (s.prevDailyBar?.c || 0),
            changePercent: s.prevDailyBar?.c ? (((s.latestTrade?.p || s.dailyBar?.c) - s.prevDailyBar.c) / s.prevDailyBar.c) * 100 : 0
          };
        }
      }
    }

    if (cryptoSymbols.length > 0) {
      const cryptoRes = await fetch(`${BASE_URL}/v1beta3/crypto/us/snapshots?symbols=${cryptoSymbols.join(',')}`, { headers });
      if (cryptoRes.ok) {
        const data = await cryptoRes.json();
        const snapshots = data.snapshots || {};
        for (const [sym, snap] of Object.entries(snapshots)) {
          const s = snap as any;
          const originalSym = sym.split('/')[0];
          results[originalSym] = {
            price: s.latestTrade?.p || s.dailyBar?.c || 0,
            change: (s.latestTrade?.p || s.dailyBar?.c || 0) - (s.prevDailyBar?.c || 0),
            changePercent: s.prevDailyBar?.c ? (((s.latestTrade?.p || s.dailyBar?.c) - s.prevDailyBar.c) / s.prevDailyBar.c) * 100 : 0
          };
        }
      }
    }
  } catch (e) {
    console.error('Alpaca Market Data Error:', e);
  }

  return results;
}

export async function getAlpacaHistoricalBars(symbol: string, timeframe: string, start: string) {
  const headers = getAuthHeaders();
  if (!headers) return [];

  const isCrypto = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'LTC', 'LINK', 'BCH'].includes(symbol);
  const alpacaSymbol = isCrypto ? `${symbol}/USD` : symbol;
  const url = isCrypto 
    ? `${BASE_URL}/v1beta3/crypto/us/bars?symbols=${alpacaSymbol}&timeframe=${timeframe}&start=${start}`
    : `${BASE_URL}/v2/stocks/bars?symbols=${alpacaSymbol}&timeframe=${timeframe}&start=${start}&feed=iex`;

  try {
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      const bars = data.bars?.[alpacaSymbol] || [];
      return bars.map((b: any) => ({
        time: Math.floor(new Date(b.t).getTime() / 1000),
        value: b.c
      }));
    }
  } catch (e) {
    console.error('Alpaca History Error:', e);
  }
  return [];
}

export async function getAlpacaOrderBook(symbol: string) {
  const headers = getAuthHeaders();
  if (!headers) return null;

  // Orderbook is best supported for crypto in free tier
  const isCrypto = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'LTC', 'LINK', 'BCH'].includes(symbol);
  if (!isCrypto) return null;

  try {
    const res = await fetch(`${BASE_URL}/v1beta3/crypto/us/orderbooks?symbols=${symbol}/USD`, { headers });
    if (res.ok) {
      const data = await res.json();
      return data.orderbooks?.[`${symbol}/USD`] || null;
    }
  } catch (e) {
    console.error('Alpaca Orderbook Error:', e);
  }
  return null;
}
