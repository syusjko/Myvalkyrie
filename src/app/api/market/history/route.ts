import { NextResponse } from 'next/server';
const YF = require('yahoo-finance2').default;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });

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
    const symbol = isCrypto ? `${rawSymbol}-USD` : rawSymbol;

    let historicalData: { time: number, value: number }[] = [];

    let period1 = new Date();
    let interval: '1d' | '1wk' | '1mo' | '1m' | '5m' | '15m' | '1h' = '1d';

    if (range === '1d') { period1.setDate(period1.getDate() - 1); interval = '5m'; }
    else if (range === '5d') { period1.setDate(period1.getDate() - 5); interval = '15m'; }
    else if (range === '1mo') { period1.setMonth(period1.getMonth() - 1); interval = '1d'; }
    else if (range === '6mo') { period1.setMonth(period1.getMonth() - 6); interval = '1d'; }
    else if (range === '1y') { period1.setFullYear(period1.getFullYear() - 1); interval = '1d'; }
    else if (range === 'all') { period1.setFullYear(period1.getFullYear() - 5); interval = '1wk'; }

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
