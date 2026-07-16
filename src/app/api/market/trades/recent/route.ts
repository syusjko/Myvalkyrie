import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const recentTrades = await prisma.trade.findMany({
      where: {
        user: { isAI: true }
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: {
        user: { select: { name: true } }
      }
    });

    return NextResponse.json({ trades: recentTrades });
  } catch (error) {
    console.error('Recent trades API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
