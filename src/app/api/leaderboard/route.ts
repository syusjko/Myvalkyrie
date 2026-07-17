import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const users = await prisma.agent.findMany({
      include: { portfolio: true }
    });
    
    // Fetch recent trades for volume ranking
    // In a real app we'd filter by last 24h: { timestamp: { gte: new Date(Date.now() - 86400000) } }
    const recentTrades = await prisma.trade.findMany({
      include: { agent: true }
    });

    const host = req.headers.get('host');
    if (!host) {
      return NextResponse.json({ error: 'Missing host header' }, { status: 400 });
    }
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    
    let prices: Record<string, number> = {};
    try {
      const pricesRes = await fetch(`${protocol}://${host}/api/market/prices`);
      const data = await pricesRes.json();
      prices = data.prices || {};
    } catch (e) {
      console.log('Failed to fetch prices for leaderboard', e);
    }

    const leaderboard = users.map(user => {
      let assetValue = 0;
      let shortLiability = 0;
      let totalCost = 0;
      let distribution: Record<string, number> = {};

      user.portfolio.forEach(p => {
        const currentPrice = prices[p.symbol] || p.avgPrice;
        const value = p.quantity * currentPrice;
        if (p.positionType === 'LONG') {
          assetValue += value;
        } else if (p.positionType === 'SHORT') {
          shortLiability += value;
        }
        totalCost += p.quantity * p.avgPrice;
        
        // For distribution, let's track the absolute value of the position
        distribution[p.symbol] = (distribution[p.symbol] || 0) + value;
      });

      const totalPortfolioValue = user.balance + assetValue - shortLiability;
      const initialBalance = 100000;
      const totalRoi = ((totalPortfolioValue - initialBalance) / initialBalance) * 100;

      // Calculate percentages
      const portfolioDist = [];
      if (totalPortfolioValue > 0) {
        portfolioDist.push({ symbol: 'Cash', percentage: (user.balance / totalPortfolioValue) * 100 });
        for (const [sym, val] of Object.entries(distribution)) {
          if (val > 0) {
            portfolioDist.push({ symbol: sym, percentage: (val / totalPortfolioValue) * 100 });
          }
        }
      }

      // Sort distribution by largest percentage
      portfolioDist.sort((a, b) => b.percentage - a.percentage);

      return {
        id: user.id,
        name: user.name,
        isAI: true,
        netWorth: totalPortfolioValue,
        totalRoi: totalRoi.toFixed(2),
        portfolioDist
      };
    });

    leaderboard.sort((a, b) => b.netWorth - a.netWorth);

    // --- AGGREGATE AI STOCK STATS ---
    const aiHeldValue: Record<string, number> = {};
    users.forEach(u => {
      u.portfolio.forEach(p => {
        if (p.symbol === 'Cash') return;
        const currentPrice = prices[p.symbol] || p.avgPrice;
        if (!aiHeldValue[p.symbol]) aiHeldValue[p.symbol] = 0;
        aiHeldValue[p.symbol] += p.quantity * currentPrice;
      });
    });
    
    const topHeldStocks = Object.entries(aiHeldValue)
      .map(([symbol, value]) => ({ symbol, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const aiTradeVolume: Record<string, number> = {};
    recentTrades.forEach(t => {
      if (!aiTradeVolume[t.symbol]) aiTradeVolume[t.symbol] = 0;
      aiTradeVolume[t.symbol] += t.quantity * t.price;
    });

    const topTradedStocks = Object.entries(aiTradeVolume)
      .map(([symbol, volume]) => ({ symbol, volume }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    // Calculate Global Stats
    const activePortfolios = users.length;
    let totalAUM = 0;
    leaderboard.forEach(u => { totalAUM += u.netWorth; });
    
    let volume24h = 0;
    let value24h = 0;
    recentTrades.forEach(t => {
      volume24h += t.quantity;
      value24h += t.quantity * t.price;
    });

    const globalStats = {
      activePortfolios,
      totalAUM,
      volume24h,
      value24h
    };

    return NextResponse.json({ leaderboard, topHeldStocks, topTradedStocks, globalStats });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
