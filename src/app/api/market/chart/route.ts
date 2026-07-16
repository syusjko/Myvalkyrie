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

    let data: { time: number; value: number }[] = [];

    const now = new Date();
    let period1 = new Date();
    let interval = '1d';

    switch(range) {
      case '1d': period1.setDate(now.getDate() - 1); interval = '5m'; break;
      case '5d': period1.setDate(now.getDate() - 5); interval = '15m'; break;
      case '1mo': period1.setMonth(now.getMonth() - 1); interval = '1d'; break;
      case '6mo': period1.setMonth(now.getMonth() - 6); interval = '1d'; break;
      case '1y': period1.setFullYear(now.getFullYear() - 1); interval = '1d'; break;
      case 'all': period1.setFullYear(2010); interval = '1mo'; break;
    }

    const res = await yahooFinance.chart(symbol, { period1: period1.toISOString(), interval: interval as any });
    
    if (res && res.quotes) {
      data = res.quotes
        .filter((q: any) => q.close !== null && q.date !== null)
        .map((q: any) => ({
          time: Math.floor(new Date(q.date).getTime() / 1000),
          value: q.close
        }));
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Chart API Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
