import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { apiKey } });
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key or User ID mismatch' }, { status: 401 });
    }

    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Fetch Trade History Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
