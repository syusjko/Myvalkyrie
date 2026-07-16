import { NextRequest, NextResponse } from 'next/server';
import { authenticateAgent } from '@/lib/apiAuth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: agent.id },
      include: { portfolio: true }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      cash: user.balance,
      holdings: user.portfolio.map(p => ({
        symbol: p.symbol,
        quantity: p.quantity,
        avgPrice: p.avgPrice
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
