import { NextResponse } from 'next/server';
import { getAlpacaHistoricalBars } from '@/lib/alpacaDataClient';
import yahooFinance from 'yahoo-finance2';
yahooFinance.suppressNotices(['yahooSurvey']);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSymbol = searchParams.get('symbol')?.toUpperCase();
    const range = searchParams.get('range') || '1mo'; // 1d, 5d, 1mo, 6mo, 1y, all

    if (!rawSymbol) {
      return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    const CRYPTO_BASE = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'LTC', 'LINK', 'BCH'];
    const isCrypto = CRYPTO_BASE.includes(rawSymbol);
    const isAlpacaSupported = isCrypto || (!rawSymbol.includes('=') && !rawSymbol.startsWith('^') && !rawSymbol.endsWith('.KS') && !rawSymbol.endsWith('.KQ'));

    let historicalData: { time: number, value: number }[] = [];

    let period1 = new Date();
    let interval: '1d' | '1wk' | '1mo' | '1m' | '5m' | '15m' | '1h' = '1d';
    let alpacaTimeframe = '1Day';

    if (range === '1d') { period1.setDate(period1.getDate() - 1); interval = '5m'; alpacaTimeframe = '5Min'; }
    else if (range === '5d') { period1.setDate(period1.getDate() - 5); interval = '15m'; alpacaTimeframe = '15Min'; }
    else if (range === '1mo') { period1.setMonth(period1.getMonth() - 1); interval = '1d'; alpacaTimeframe = '1Day'; }
    else if (range === '6mo') { period1.setMonth(period1.getMonth() - 6); interval = '1d'; alpacaTimeframe = '1Day'; }
    else if (range === '1y') { period1.setFullYear(period1.getFullYear() - 1); interval = '1d'; alpacaTimeframe = '1Day'; }
    else if (range === 'all') { period1.setFullYear(period1.getFullYear() - 5); interval = '1wk'; alpacaTimeframe = '1Week'; }

    if (isAlpacaSupported) {
      const alpacaBars = await getAlpacaHistoricalBars(rawSymbol, alpacaTimeframe, period1.toISOString());
      if (alpacaBars && alpacaBars.length > 0) {
        return NextResponse.json({ data: alpacaBars });
      }
      // If Alpaca fails or returns empty, fallback to Yahoo
    }

    // Fallback to Yahoo Finance
    const symbol = isCrypto ? `${rawSymbol}-USD` : rawSymbol;
    const queryOptions = { period1: period1.toISOString(), interval };
    const results = await yahooFinance.chart(symbol, queryOptions);

    if (results && results.quotes && results.quotes.length > 0) {
      historicalData = results.quotes
        .filter((q: any) => q.close !== null)
        .map((q: any) => ({
          time: Math.floor(new Date(q.date).getTime() / 1000),
          value: q.close
        }));
    }

    return NextResponse.json({ data: historicalData });

  } catch (error: any) {
    console.error('History API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
