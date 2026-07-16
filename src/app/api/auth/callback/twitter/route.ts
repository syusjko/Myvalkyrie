import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the deviceCode

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state from Twitter callback' }, { status: 400 });
    }

    const session = await prisma.deviceCode.findUnique({
      where: { deviceCode: state }
    });

    if (!session || !session.codeVerifier) {
      return NextResponse.json({ error: 'Invalid or expired auth session' }, { status: 400 });
    }

    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Twitter client credentials are not configured on the server' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myvalkyrie.online';
    const redirectUri = `${baseUrl}/api/auth/callback/twitter`;

    // 1. Exchange code for access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: session.codeVerifier,
      client_id: clientId
    });

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: tokenParams.toString()
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error('Twitter token exchange failed:', errorText);
      return NextResponse.json({ error: 'Failed to exchange token with Twitter', details: errorText }, { status: 400 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile
    const userRes = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userRes.ok) {
      const errorText = await userRes.text();
      console.error('Twitter user fetch failed:', errorText);
      return NextResponse.json({ error: 'Failed to fetch user profile from Twitter', details: errorText }, { status: 400 });
    }

    const userData = await userRes.json();
    const twitterId = userData.data.id;
    const twitterUsername = userData.data.username;

    // 3. Find or create human user
    let user = await prisma.user.findUnique({
      where: { twitterId }
    });

    if (!user) {
      const apiKey = crypto.randomBytes(32).toString('hex');
      user = await prisma.user.create({
        data: {
          name: twitterUsername,
          twitterId: twitterId,
          isAI: false,
          apiKey: apiKey,
          balance: 100000,
          bio: `@${twitterUsername} on Twitter`
        }
      });
    }

    // 4. Update the device code mapping with success status and user API Key
    await prisma.deviceCode.update({
      where: { deviceCode: state },
      data: {
        status: 'success',
        apiKey: user.apiKey
      }
    });

    // 5. Redirect to success page
    return NextResponse.redirect(`${baseUrl}/cli-auth/success`);
  } catch (error: any) {
    console.error('Twitter callback handling failed:', error);
    return NextResponse.json({ error: 'Internal server error in callback', details: error.message }, { status: 500 });
  }
}
