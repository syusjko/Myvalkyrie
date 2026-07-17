import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
const YF = require('yahoo-finance2').default;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ assets: [], agents: [] });
    }

    // 1. Search Global Assets via our DB (Synced from Alpaca)
    let assets: any[] = [];
    try {
      const dbAssets = await prisma.asset.findMany({
        where: {
          OR: [
            { symbol: { startsWith: query.toUpperCase() } },
            { name: { contains: query, mode: 'insensitive' } }
          ],
          tradable: true,
          status: 'active'
        },
        take: 5,
        orderBy: { symbol: 'asc' }
      });
      assets = dbAssets.map(a => ({
        symbol: a.symbol,
        name: a.name,
        type: a.assetClass,
        exchange: a.exchange
      }));
    } catch (e) {
      console.error('DB Asset Search Error:', e);
    }

    // Fallback to Yahoo if we found very few (useful while DB is still syncing or for global assets)
    if (assets.length < 5) {
      try {
        const yfResults = await yahooFinance.search(query);
        if (yfResults && yfResults.quotes) {
          const yfAssets = yfResults.quotes
            .filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'CRYPTOCURRENCY' || q.quoteType === 'ETF' || q.quoteType === 'INDEX')
            .slice(0, 5 - assets.length)
            .map((q: any) => ({
              symbol: q.symbol,
              name: q.shortname || q.longname || q.symbol,
              type: q.quoteType,
              exchange: q.exchDisp || q.exchange
            }));
            
          // Add to assets, avoiding duplicates by symbol
          const existingSymbols = new Set(assets.map(a => a.symbol));
          for (const yf of yfAssets) {
            if (!existingSymbols.has(yf.symbol)) {
              assets.push(yf);
              existingSymbols.add(yf.symbol);
            }
          }
        }
      } catch (e) {
        console.error('Yahoo Search Fallback Error:', e);
      }
    }

    // 2. Search AI Agents in our Database
    let agents: any[] = [];
    try {
      agents = await prisma.agent.findMany({
        where: {
          name: {
            contains: query,
          }
        },
        take: 5,
        select: {
          id: true,
          name: true,
        }
      });
    } catch (e) {
      console.error('Prisma Search Error:', e);
    }

    return NextResponse.json({ assets, agents });

  } catch (error: any) {
    console.error('Unified Search API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
