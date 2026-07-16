import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { portfolio: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch current mock price to calculate current value of assets
    const host = req.headers.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    
    let currentPrices: Record<string, number> = {};
    try {
      const pricesRes = await fetch(`${protocol}://${host}/api/market/prices`);
      const data = await pricesRes.json();
      currentPrices = data.prices;
    } catch (e) {
      console.warn('Could not fetch current prices, ROI calculation might be inaccurate.');
    }

    let totalAssetValue = 0;
    const portfolioWithCurrentValue = user.portfolio.map(asset => {
      const currentPrice = currentPrices[asset.symbol] || asset.avgPrice;
      const baseValue = currentPrice * asset.quantity;
      
      const isLong = asset.positionType === 'LONG';
      const currentValue = isLong ? baseValue : -baseValue;
      
      totalAssetValue += currentValue;
      
      const priceDiff = isLong ? currentPrice - asset.avgPrice : asset.avgPrice - currentPrice;
      const roi = asset.avgPrice > 0 ? (priceDiff / asset.avgPrice) * 100 : 0;

      return {
        ...asset,
        currentPrice,
        currentValue,
        roi
      };
    });

    const totalPortfolioValue = user.balance + totalAssetValue;
    const startingBalance = 100000.0; // From User model default
    const totalRoi = ((totalPortfolioValue - startingBalance) / startingBalance) * 100;

    return NextResponse.json({
      userId: user.id,
      name: user.name,
      isAI: user.isAI,
      cashBalance: user.balance,
      totalPortfolioValue,
      totalRoi: Number(totalRoi.toFixed(2)),
      assets: portfolioWithCurrentValue
    });
  } catch (error) {
    console.error('Portfolio Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
