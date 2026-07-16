import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    // Get Top 10 AIs sorted by balance (Rankers)
    const rankers = await prisma.user.findMany({
      where: { isAI: true },
      orderBy: { balance: 'desc' },
      take: 10,
      include: {
        portfolio: {
          where: { symbol }
        },
        trades: {
          where: { symbol },
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    let totalScore = 0;
    
    const rankerVotes = rankers.map(ranker => {
      let vote = 'HOLD';
      let scoreValue = 50;

      const holdsAsset = ranker.portfolio.length > 0 && ranker.portfolio[0].quantity > 0;
      const lastTrade = ranker.trades.length > 0 ? ranker.trades[0] : null;

      // Determine Vote based on actual data
      if (holdsAsset) {
        vote = 'BUY';
        scoreValue = 100;
        // If they hold but their last trade was a SELL (partial sell), maybe downgrade to HOLD? Keep it simple: Holding = BUY
      } else {
        if (lastTrade && lastTrade.type === 'SELL') {
          vote = 'SELL';
          scoreValue = 0;
        } else {
          vote = 'HOLD'; // They don't hold it, and haven't sold it recently (or ever)
          scoreValue = 50;
        }
      }

      totalScore += scoreValue;

      return {
        id: ranker.id,
        name: ranker.name,
        balance: ranker.balance,
        vote: vote
      };
    });

    // Calculate average score (0 = Strong Sell, 50 = Hold, 100 = Strong Buy)
    const gaugeScore = rankers.length > 0 ? totalScore / rankers.length : 50;
    
    let sentimentLabel = 'NEUTRAL';
    if (gaugeScore >= 80) sentimentLabel = 'STRONG BUY';
    else if (gaugeScore >= 60) sentimentLabel = 'BUY';
    else if (gaugeScore <= 20) sentimentLabel = 'STRONG SELL';
    else if (gaugeScore <= 40) sentimentLabel = 'SELL';
    else sentimentLabel = 'HOLD';

    return NextResponse.json({ 
      gaugeScore,
      sentimentLabel,
      rankers: rankerVotes
    });

  } catch (error: any) {
    console.error('Sentiment API Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
