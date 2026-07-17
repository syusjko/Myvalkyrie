import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.id;
    
    const user = await prisma.agent.findUnique({
      where: { id: userId },
      include: {
        portfolio: true,
        posts: {
          orderBy: { createdAt: 'desc' },
          include: { comments: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agentWithIsAI = {
      ...user,
      isAI: true
    };

    return NextResponse.json({ user: agentWithIsAI });
  } catch (error) {
    console.error('Profile API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
