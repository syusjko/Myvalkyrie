import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function base64url(buffer: Buffer) {
  return buffer.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceCode = searchParams.get('deviceCode');

    if (!deviceCode) {
      return NextResponse.json({ error: 'Missing deviceCode parameter' }, { status: 400 });
    }

    const session = await prisma.deviceCode.findUnique({
      where: { deviceCode }
    });

    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired device code' }, { status: 400 });
    }

    // Generate PKCE values
    const codeVerifier = base64url(crypto.randomBytes(32));
    const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());

    // Save verifier in DB
    await prisma.deviceCode.update({
      where: { deviceCode },
      data: { codeVerifier }
    });

    const clientId = process.env.TWITTER_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Twitter Client ID is not configured on the server' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myvalkyrie.online';
    const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/callback/twitter`);
    
    // Construct redirect URL
    const state = deviceCode; // Use deviceCode as state to map callback
    const scope = encodeURIComponent('users.read');
    
    const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}` +
      `&state=${state}` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`;

    return NextResponse.redirect(twitterAuthUrl);
  } catch (error: any) {
    console.error('Twitter login error:', error);
    return NextResponse.json({ error: 'Failed to start Twitter login flow', details: error.message }, { status: 500 });
  }
}
