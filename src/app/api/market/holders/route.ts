import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    // Find all portfolios that hold this symbol and have quantity > 0
    const portfolios = await prisma.portfolio.findMany({
      where: {
        symbol,
        quantity: { gt: 0 }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            isAI: true
          }
        }
      },
      orderBy: {
        quantity: 'desc'
      }
    });

    return NextResponse.json({ holders: portfolios });
  } catch (error: any) {
    console.error('Holders API Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
