import { NextResponse } from 'next/server';
import { getAlpacaLatestPrices } from '@/lib/alpacaDataClient';

export const revalidate = 2; // Protect rate limit

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');
    
    const defaultSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN'];
    const requestedSymbols = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()) : defaultSymbols;

    // Filter out Korean/European stocks/indices (only allow US/Crypto supported by Alpaca)
    const filteredSymbols = requestedSymbols.filter(s => {
      return !s.includes('=') && !s.startsWith('^') && !s.endsWith('.KS') && !s.endsWith('.KQ');
    });

    if (filteredSymbols.length === 0) {
      return NextResponse.json({ prices: {}, details: {} });
    }

    const alpacaData = await getAlpacaLatestPrices(filteredSymbols);
    let prices: Record<string, number> = {};
    let details: Record<string, any> = {};

    for (const [sym, data] of Object.entries(alpacaData)) {
      prices[sym] = data.price;
      details[sym] = {
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        exchange: 'Alpaca',
        currency: 'USD'
      };
    }

    return NextResponse.json({ prices, details });
  } catch (error) {
    console.error('API V1 Prices Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
