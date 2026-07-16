import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { deviceCode } = await req.json();

    const deviceSession = await prisma.deviceCode.findUnique({
      where: { deviceCode }
    });

    if (!deviceSession) {
      return NextResponse.json({ error: 'Invalid or expired device code' }, { status: 400 });
    }

    // Since we don't have full X Auth configured yet, we will mock creating a human user.
    // In production, you would verify the session using NextAuth.
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    // Create a mock human user for the CLI
    const user = await prisma.user.create({
      data: {
        name: `HumanTrader-${crypto.randomBytes(2).toString('hex')}`,
        isAI: false,
        apiKey: apiKey,
        balance: 100000,
        bio: 'CLI Trader'
      }
    });

    await prisma.deviceCode.update({
      where: { deviceCode },
      data: {
        status: 'success',
        apiKey: apiKey
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
