import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This endpoint should be triggered periodically (e.g., every minute via Vercel Cron)
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing CRON_SECRET' }, { status: 401 });
    }

    // 1. Fetch all pending orders
    const pendingOrders = await prisma.order.findMany({
      where: { status: 'PENDING' },
      include: { user: true }
    });

    const host = req.headers.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

    // 2. Fetch live prices
    let prices: Record<string, number> = {};
    try {
      const pricesRes = await fetch(`${protocol}://${host}/api/market/prices`);
      const data = await pricesRes.json();
      prices = data.prices || {};
    } catch (e) {
      console.log('Failed to fetch prices for cron engine', e);
      return NextResponse.json({ error: 'Market data unavailable' }, { status: 503 });
    }

    let executedCount = 0;

    // 3. Process Limit / Stop Orders
    for (const order of pendingOrders) {
      const currentPrice = prices[order.symbol];
      if (!currentPrice) continue;

      let shouldExecute = false;

      if (order.type === 'LIMIT') {
        if (order.side === 'BUY' && currentPrice <= order.targetPrice) shouldExecute = true;
        if (order.side === 'SELL' && currentPrice >= order.targetPrice) shouldExecute = true;
      } else if (order.type === 'STOP') {
        if (order.side === 'BUY' && currentPrice >= order.targetPrice) shouldExecute = true;
        if (order.side === 'SELL' && currentPrice <= order.targetPrice) shouldExecute = true;
      }

      if (shouldExecute) {
        // Mock a request to the trade/order API to execute it at market
        try {
          await fetch(`${protocol}://${host}/api/trade/order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': order.user.apiKey || '' // Assuming AI agents have api keys
            },
            body: JSON.stringify({
              symbol: order.symbol,
              type: order.side,
              quantity: order.quantity,
              orderType: 'MARKET', // Force market execution now that target is hit
              rationale: `Executed ${order.type} order at ${currentPrice}`
            })
          });

          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'EXECUTED' }
          });
          executedCount++;
        } catch (e) {
          console.error(`Failed to execute order ${order.id}`, e);
        }
      }
    }

    // 4. Process Liquidations (Margin Calls)
    const users = await prisma.user.findMany({ include: { portfolio: true } });
    let liquidatedCount = 0;

    for (const user of users) {
      let portfolioValue = 0;
      let shortLiability = 0;
      let longAsset = 0;

      for (const p of user.portfolio) {
        const currentPrice = prices[p.symbol] || p.avgPrice;
        if (p.positionType === 'LONG') {
          longAsset += p.quantity * currentPrice;
        } else if (p.positionType === 'SHORT') {
          shortLiability += p.quantity * currentPrice;
        }
      }
      portfolioValue = longAsset - shortLiability;

      const netWorth = user.balance + portfolioValue;
      
      // Margin Call Condition: If Net Worth falls below 20% of the Short Liability (Maintenance Margin)
      // Or if balance goes deeply negative. (Simplified Liquidation Logic)
      if (shortLiability > 0 && netWorth < (shortLiability * 0.2)) {
        // Liquidate!
        for (const p of user.portfolio) {
          if (p.positionType === 'SHORT' && p.quantity > 0) {
            // Market Buy to cover short
            await fetch(`${protocol}://${host}/api/trade/order`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': user.apiKey || '' },
              body: JSON.stringify({ symbol: p.symbol, type: 'BUY', quantity: p.quantity, orderType: 'MARKET' })
            });
          }
        }
        liquidatedCount++;
      }
    }

    return NextResponse.json({ 
      message: 'Engine cycle complete', 
      executedOrders: executedCount,
      liquidations: liquidatedCount
    });

  } catch (error) {
    console.error('Engine Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
