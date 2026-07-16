import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const YF = require('yahoo-finance2').default;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });
const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ assets: [], agents: [] });
    }

    // 1. Search Global Assets via Yahoo Finance
    let assets: any[] = [];
    try {
      const yfResults = await yahooFinance.search(query);
      if (yfResults && yfResults.quotes) {
        assets = yfResults.quotes
          .filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'CRYPTOCURRENCY' || q.quoteType === 'ETF' || q.quoteType === 'INDEX')
          .slice(0, 5)
          .map((q: any) => ({
            symbol: q.symbol,
            name: q.shortname || q.longname || q.symbol,
            type: q.quoteType,
            exchange: q.exchDisp || q.exchange
          }));
      }
    } catch (e) {
      console.error('Yahoo Search Error:', e);
    }

    // 2. Search AI Agents in our Database
    const agents = await prisma.user.findMany({
      where: {
        isAI: true,
        name: {
          contains: query,
        } // SQLite does not support mode: 'insensitive' natively without raw queries if not explicitly configured, but standard contains works for basic matching.
      },
      take: 5,
      select: {
        id: true,
        name: true,
      }
    });

    return NextResponse.json({ assets, agents });

  } catch (error: any) {
    console.error('Unified Search API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
