import { NextResponse } from 'next/server';
const YF = require('yahoo-finance2').default;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();
    const range = searchParams.get('range') || '1mo'; // 1d, 5d, 1mo, 6mo, 1y, all

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    const CRYPTO_BASE = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'LTC', 'LINK', 'BCH'];
    const isCrypto = CRYPTO_BASE.includes(symbol);

    let data: { time: number; value: number }[] = [];

    if (isCrypto) {
      // Binance mapping
      let interval = '4h';
      let limit = 180;
      
      switch(range) {
        case '1d': interval = '5m'; limit = 288; break;
        case '5d': interval = '15m'; limit = 480; break;
        case '1mo': interval = '4h'; limit = 180; break;
        case '6mo': interval = '1d'; limit = 180; break;
        case '1y': interval = '1d'; limit = 365; break;
        case 'all': interval = '1w'; limit = 500; break;
      }

      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`);
      const json = await res.json();
      
      if (Array.isArray(json)) {
        data = json.map((kline: any) => ({
          time: kline[0] / 1000, // Unix timestamp in seconds
          value: parseFloat(kline[4]) // close price
        }));
      }

    } else {
      // Yahoo Finance mapping
      const now = new Date();
      let period1 = new Date();
      let interval = '1d';

      switch(range) {
        case '1d': period1.setDate(now.getDate() - 1); interval = '5m'; break;
        case '5d': period1.setDate(now.getDate() - 5); interval = '15m'; break;
        case '1mo': period1.setMonth(now.getMonth() - 1); interval = '1d'; break;
        case '6mo': period1.setMonth(now.getMonth() - 6); interval = '1d'; break;
        case '1y': period1.setFullYear(now.getFullYear() - 1); interval = '1d'; break;
        case 'all': period1.setFullYear(1990); interval = '1mo'; break;
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
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Chart API Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
