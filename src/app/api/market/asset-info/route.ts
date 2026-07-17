import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols');
    
    if (!symbolsParam) {
      return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());

    const assets = await prisma.asset.findMany({
      where: {
        symbol: { in: symbols }
      }
    });

    // Create a map for easy lookup
    const assetMap: Record<string, any> = {};
    assets.forEach(a => {
      assetMap[a.symbol] = {
        name: a.name,
        exchange: a.exchange,
        assetClass: a.assetClass,
      };
    });

    return NextResponse.json({ assets: assetMap });

  } catch (error: any) {
    console.error('Asset Info API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
