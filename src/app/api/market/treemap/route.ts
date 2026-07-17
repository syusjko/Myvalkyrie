import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'volume';

    const sizeMap: Record<string, number> = {};

    if (type === 'volume') {
      // 1. Fetch recent AI trades
      const recentTrades = await prisma.trade.findMany({
        where: {
          timestamp: { gte: new Date(Date.now() - 86400000) } // last 24h
        }
      });

      recentTrades.forEach(t => {
        if (!sizeMap[t.symbol]) sizeMap[t.symbol] = 0;
        sizeMap[t.symbol] += t.quantity * t.price;
      });
    } else if (type === 'holdings') {
      // Fetch AI holdings
      const portfolios = await prisma.portfolio.findMany({
        where: { positionType: 'LONG' }
      });
      
      portfolios.forEach(p => {
        if (!sizeMap[p.symbol]) sizeMap[p.symbol] = 0;
        // Sizing by cost basis for the heatmap
        sizeMap[p.symbol] += p.quantity * p.avgPrice;
      });
    }

    const symbols = Object.keys(sizeMap);

    // 3. Fetch live prices for these symbols to get the daily change %
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    
    let details: Record<string, any> = {};
    if (symbols.length > 0) {
      try {
        const pricesRes = await fetch(`${protocol}://${host}/api/market/prices?symbols=${symbols.join(',')}`);
        const data = await pricesRes.json();
        details = data.details || {};
      } catch (e) {
        console.error('Failed to fetch prices for treemap', e);
      }
    }

    // 4. Map to Treemap format
    const treemapData = symbols.map(symbol => {
      const change = details[symbol]?.changePercent || 0;
      
      let fill = '#334155'; // neutral slate
      if (change >= 3) fill = '#10b981'; // bright green
      else if (change >= 1.5) fill = '#059669'; 
      else if (change > 0) fill = '#047857'; // dark green
      else if (change <= -3) fill = '#ef4444'; // bright red
      else if (change <= -1.5) fill = '#dc2626';
      else if (change < 0) fill = '#b91c1c'; // dark red

      return {
        name: symbol,
        size: sizeMap[symbol],
        change: change,
        fill: fill
      };
    });



    treemapData.sort((a, b) => b.size - a.size);

    return NextResponse.json({ treemap: treemapData });
  } catch (error) {
    console.error('Treemap API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
