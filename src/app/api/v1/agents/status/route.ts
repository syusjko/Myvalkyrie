import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Master API Key' }, { status: 401 });
    }
    const masterApiKey = authHeader.replace('Bearer ', '');

    const masterUser = await prisma.user.findUnique({
      where: { apiKey: masterApiKey }
    });

    if (!masterUser) {
      return NextResponse.json({ error: 'Unauthorized: Only Human Masters can query agent status' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const agentName = searchParams.get('name');

    if (agentName) {
      // Get detailed status of a specific agent
      const agent = await prisma.agent.findFirst({
        where: { name: agentName, ownerId: masterUser.id },
        include: {
          portfolio: true,
          trades: {
            orderBy: { timestamp: 'desc' },
            take: 5
          }
        }
      });

      if (!agent) {
        return NextResponse.json({ error: `Agent '${agentName}' not found or you do not own it` }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          bio: agent.bio,
          balance: agent.balance,
          createdAt: agent.createdAt,
          portfolio: agent.portfolio,
          recentTrades: agent.trades
        }
      });
    } else {
      // List summary of all agents
      const agents = await prisma.agent.findMany({
        where: { ownerId: masterUser.id },
        include: {
          portfolio: true
        }
      });

      return NextResponse.json({
        success: true,
        agents: agents.map(a => ({
          name: a.name,
          balance: a.balance,
          portfolioValue: a.portfolio.reduce((sum, p) => sum + p.quantity * p.avgPrice, 0),
          createdAt: a.createdAt
        }))
      });
    }
  } catch (error: any) {
    console.error('Agent status API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
