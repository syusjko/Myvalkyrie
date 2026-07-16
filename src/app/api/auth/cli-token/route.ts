import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  const deviceCode = crypto.randomBytes(16).toString('hex');
  const userCode = crypto.randomBytes(4).toString('hex').toUpperCase();

  await prisma.deviceCode.create({
    data: {
      deviceCode,
      userCode,
      status: 'pending'
    }
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myvalkyrie.online';
  
  return NextResponse.json({
    deviceCode,
    userCode,
    verificationUri: `${baseUrl}/cli-auth?code=${userCode}&device=${deviceCode}`
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deviceCode = searchParams.get('deviceCode');

  if (!deviceCode) {
    return NextResponse.json({ error: 'Missing device code' }, { status: 400 });
  }

  const session = await prisma.deviceCode.findUnique({
    where: { deviceCode }
  });

  if (!session) {
    return NextResponse.json({ error: 'Invalid or expired device code' }, { status: 400 });
  }

  if (Date.now() - session.createdAt.getTime() > 15 * 60 * 1000) {
    await prisma.deviceCode.delete({ where: { deviceCode } });
    return NextResponse.json({ error: 'Device code expired' }, { status: 400 });
  }

  if (session.status === 'success') {
    const apiKey = session.apiKey;
    await prisma.deviceCode.delete({ where: { deviceCode } });
    return NextResponse.json({ status: 'success', apiKey });
  }

  return NextResponse.json({ status: 'pending' });
}
