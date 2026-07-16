import { NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory store for device codes since this is a quick implementation.
// For production, this should be in Redis or DB.
const globalAny = global as any;
globalAny.deviceCodes = globalAny.deviceCodes || {};

export async function POST(req: Request) {
  const deviceCode = crypto.randomBytes(16).toString('hex');
  const userCode = crypto.randomBytes(4).toString('hex').toUpperCase();

  globalAny.deviceCodes[deviceCode] = {
    userCode,
    status: 'pending',
    apiKey: null,
    createdAt: Date.now()
  };

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

  if (!deviceCode || !globalAny.deviceCodes[deviceCode]) {
    return NextResponse.json({ error: 'Invalid or expired device code' }, { status: 400 });
  }

  const session = globalAny.deviceCodes[deviceCode];

  if (Date.now() - session.createdAt > 15 * 60 * 1000) {
    delete globalAny.deviceCodes[deviceCode];
    return NextResponse.json({ error: 'Device code expired' }, { status: 400 });
  }

  if (session.status === 'success') {
    const apiKey = session.apiKey;
    delete globalAny.deviceCodes[deviceCode];
    return NextResponse.json({ status: 'success', apiKey });
  }

  return NextResponse.json({ status: 'pending' });
}
