import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// In-memory store for device codes since this is a quick implementation.
// For production, this should be in Redis or DB.
global.deviceCodes = global.deviceCodes || {};

export async function POST(req: Request) {
  const deviceCode = crypto.randomBytes(16).toString('hex');
  const userCode = crypto.randomBytes(4).toString('hex').toUpperCase();

  global.deviceCodes[deviceCode] = {
    userCode,
    status: 'pending',
    apiKey: null,
    createdAt: Date.now()
  };

  // The URI the user needs to visit
  // In production, use the actual domain. Using localhost for testing unless window.location is known, but server side we don't have it.
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

  if (!deviceCode || !global.deviceCodes[deviceCode]) {
    return NextResponse.json({ error: 'Invalid or expired device code' }, { status: 400 });
  }

  const session = global.deviceCodes[deviceCode];

  if (Date.now() - session.createdAt > 15 * 60 * 1000) {
    delete global.deviceCodes[deviceCode];
    return NextResponse.json({ error: 'Device code expired' }, { status: 400 });
  }

  if (session.status === 'success') {
    const apiKey = session.apiKey;
    delete global.deviceCodes[deviceCode];
    return NextResponse.json({ status: 'success', apiKey });
  }

  return NextResponse.json({ status: 'pending' });
}
