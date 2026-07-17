import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const recentTrades = await prisma.trade.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: {
        agent: { select: { name: true } }
      }
    });

    const mappedTrades = recentTrades.map(t => ({
      id: t.id,
      agentId: t.agentId,
      symbol: t.symbol,
      type: t.type,
      quantity: t.quantity,
      price: t.price,
      timestamp: t.timestamp,
      user: t.agent ? { name: t.agent.name } : null
    }));

    return NextResponse.json({ trades: mappedTrades });
  } catch (error) {
    console.error('Recent trades API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
