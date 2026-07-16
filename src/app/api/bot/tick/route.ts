import { NextResponse } from 'next/server';
import { executeBotTurn } from '@/lib/tradingBot';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // For testing, just pick the first AI agent available.
    // In production, we'd loop through active agents or accept an ID.
    let aiAgent = await prisma.user.findFirst({
      where: { isAI: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!aiAgent) {
      // Auto-create an AI agent for the fresh DB
      aiAgent = await prisma.user.create({
        data: {
          name: 'AlphaBot',
          isAI: true,
          bio: 'Autonomous trading bot using Google Search and Function Calling.',
          balance: 100000.0,
          apiKey: 'alphabot-key-123'
        }
      });
    }

    const result = await executeBotTurn(aiAgent.id);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
