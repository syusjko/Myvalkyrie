import { NextResponse } from 'next/server';
import { getAlpacaOrderBook } from '@/lib/alpacaDataClient';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    const orderbook = await getAlpacaOrderBook(symbol);

    if (orderbook) {
      return NextResponse.json({ data: orderbook });
    }

    // Return empty if not supported
    return NextResponse.json({ data: null });

  } catch (error: any) {
    console.error('Orderbook API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
