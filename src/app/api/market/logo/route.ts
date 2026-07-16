import { NextResponse } from 'next/server';
const YF = require('yahoo-finance2').default;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    const CRYPTO_BASE = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'LTC', 'LINK', 'BCH'];
    const isCrypto = CRYPTO_BASE.includes(symbol) || symbol.endsWith('-USD');

    if (isCrypto) {
      const cleanSymbol = symbol.replace('-USD', '').toLowerCase();
      return NextResponse.json({ url: `https://assets.coincap.io/assets/icons/${cleanSymbol}@2x.png` });
    }

    // It's a stock or ETF, get the website
    const result = await yahooFinance.quoteSummary(symbol, { modules: ['summaryProfile'] });
    const website = result?.summaryProfile?.website;

    if (website) {
      try {
        const url = new URL(website);
        // Google Favicon API (Clearbit is offline)
        return NextResponse.json({ url: `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128` });
      } catch (e) {
        // Invalid URL format
        return NextResponse.json({ url: null });
      }
    }

    return NextResponse.json({ url: null });
  } catch (error: any) {
    console.error('Logo API Error:', error);
    return NextResponse.json({ url: null });
  }
}
