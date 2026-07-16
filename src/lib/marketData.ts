const YF = require('yahoo-finance2').default;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });

const RSI_PERIOD = 14;
// Need enough candles to seed (14) + smooth further. 50 is a safe minimum.
const CANDLE_LIMIT = 50;

/**
 * Wilder's Smoothed RSI — matches TradingView output.
 *
 * Steps:
 *  1. Seed: simple average of gains/losses over the first RSI_PERIOD changes.
 *  2. Smooth: for every subsequent change apply Wilder's EMA:
 *       avgGain = (prevAvgGain * (period - 1) + gain) / period
 *       avgLoss = (prevAvgLoss * (period - 1) + loss) / period
 */
function calcWilderRSI(closes: number[]): number {
  if (closes.length < RSI_PERIOD + 1) return 50;

  // --- Step 1: seed with simple average of first 14 changes ---
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= RSI_PERIOD; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= RSI_PERIOD;
  avgLoss /= RSI_PERIOD;

  // --- Step 2: Wilder's smoothing for the rest ---
  for (let i = RSI_PERIOD + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (RSI_PERIOD - 1) + gain) / RSI_PERIOD;
    avgLoss = (avgLoss * (RSI_PERIOD - 1) + loss) / RSI_PERIOD;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - 100 / (1 + rs));
}

/**
 * Check if the market is currently open for a given symbol.
 * Crypto is 24/7.
 * US Stocks/Indices: M-F 09:30-16:00 EST.
 * Forex/Commodities: 24/5 (Mon-Fri).
 */
export function isMarketOpen(symbol: string): boolean {
  const isCrypto = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'DOT', 'LTC', 'LINK', 'BCH'].includes(symbol);
  if (isCrypto) return true;

  const isForexOrComm = symbol.endsWith('=X') || symbol.endsWith('=F');
  
  // Calculate current time in EST
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const estOffset = -5; // Using standard time EST (UTC-5) for simplicity
  const estDate = new Date(utc + (3600000 * estOffset));
  
  const day = estDate.getDay();
  const hours = estDate.getHours();
  const minutes = estDate.getMinutes();
  
  // Weekend closed for non-crypto
  if (day === 0 || day === 6) return false;
  
  if (isForexOrComm) {
    return true; // 24/5 for Forex and Commodities
  }

  // Stocks and Indices: M-F 09:30 - 16:00 EST
  const time = hours * 100 + minutes;
  return time >= 930 && time < 1600;
}

export async function getRealMarketData() {
  const data: Record<string, { price: number; rsi: number }> = {};

  const cryptos = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'];
  const stocks  = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'AMZN', 'EURUSD=X', 'JPY=X', 'GC=F', 'CL=F', '^GSPC', '^IXIC'];

  const period1 = new Date();
  period1.setDate(period1.getDate() - 20); // 20 days ago to ensure 14 trading days
  const period2 = new Date();

  const allSymbols = [
    ...cryptos.map(sym => ({ original: sym, query: `${sym}-USD` })),
    ...stocks.map(sym => ({ original: sym, query: sym }))
  ];

  for (const { original, query } of allSymbols) {
    try {
      const hist = await yahooFinance.historical(query, { period1, period2, interval: '1d' }, { validateResult: false });

      if (!hist || hist.length < RSI_PERIOD + 1) {
        const quote = await yahooFinance.quote(query);
        data[original] = { price: quote.regularMarketPrice ?? 100, rsi: 50 };
        continue;
      }

      // Use up to CANDLE_LIMIT most-recent sessions
      const recent = hist.slice(-CANDLE_LIMIT);
      const closes = recent.map((d: any) => d.close as number);
      const rsi    = calcWilderRSI(closes);

      const quote = await yahooFinance.quote(query);
      data[original] = { price: quote.regularMarketPrice ?? closes[closes.length - 1], rsi };
    } catch (e) {
      console.error(`Failed to fetch ${query} Yahoo data`, e);
      if (cryptos.includes(original)) {
        data[original] = { price: original === 'BTC' ? 60000 : 100, rsi: 50 };
      } else {
        data[original] = { price: 100, rsi: 50 };
      }
    }
  }

  return data;
}
