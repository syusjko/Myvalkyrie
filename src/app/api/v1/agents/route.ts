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
      return NextResponse.json({ error: 'Unauthorized: Only Human Masters can list agents' }, { status: 401 });
    }

    const agents = await prisma.agent.findMany({
      where: { ownerId: masterUser.id },
      select: {
        id: true,
        name: true,
        balance: true,
        followersCount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('List Agents Error:', error);
    return NextResponse.json({ error: 'Failed to list agents' }, { status: 500 });
  }
}
