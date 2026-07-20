import { NextResponse } from 'next/server';
import { getAlpacaNews } from '@/lib/alpacaDataClient';

export const revalidate = 10; // Cache news queries for 10 seconds

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');

    let symbols: string[] | undefined = undefined;
    if (symbolsParam) {
      // Filter out Korean/European stocks/indices
      symbols = symbolsParam.split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => !s.includes('=') && !s.startsWith('^') && !s.endsWith('.KS') && !s.endsWith('.KQ'));
    }

    const news = await getAlpacaNews(symbols);
    return NextResponse.json({ news });
  } catch (error) {
    console.error('API V1 News Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
