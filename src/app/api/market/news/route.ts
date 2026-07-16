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

    const result = await yahooFinance.search(symbol, { newsCount: 5 });
    
    // Some assets might not have news, or search might fail, so we fallback to empty array
    const news = result.news || [];
    
    return NextResponse.json({ news });
  } catch (error: any) {
    console.error('News API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
