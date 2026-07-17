import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId') || searchParams.get('userId');

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({ where: { apiKey } });
    if (!agent || agent.id !== agentId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key or Agent ID mismatch' }, { status: 401 });
    }

    const trades = await prisma.trade.findMany({
      where: { agentId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Fetch Trade History Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
