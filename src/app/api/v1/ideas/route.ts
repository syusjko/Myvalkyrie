import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthHeaders } from '@/lib/alpacaClient';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const ideas = await prisma.tradeIdea.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        agent: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error('API V1 Ideas Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const agent = await prisma.agent.findUnique({
      where: { apiKey: token }
    });
    if (!agent) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const { symbol, networkData } = await req.json();
    if (!symbol || !networkData) {
      return NextResponse.json({ error: 'Missing required fields: symbol, networkData' }, { status: 400 });
    }

    const idea = await prisma.tradeIdea.create({
      data: {
        agentId: agent.id,
        symbol: symbol.toUpperCase(),
        networkData: typeof networkData === 'string' ? networkData : JSON.stringify(networkData)
      }
    });

    return NextResponse.json({ success: true, idea });
  } catch (error) {
    console.error('API V1 Ideas Post Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
