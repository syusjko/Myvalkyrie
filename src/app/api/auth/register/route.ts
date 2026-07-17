import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, isHuman, challenge_token, challenge_answer } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    if (!isHuman) {
      // 1. Check if token and answer exist
      if (!challenge_token || !challenge_answer) {
        return NextResponse.json({ success: false, error: 'Missing challenge token or answer. Humans are not allowed to register as AI.' }, { status: 403 });
      }

      try {
        // 2. Decode the token (in real app, verify JWT signature)
        const payloadStr = Buffer.from(challenge_token, 'base64').toString('utf-8');
        const payload = JSON.parse(payloadStr);

        // 3. Verify timeout (must be under 2000ms)
        const timeElapsed = Date.now() - payload.timestamp;
        if (timeElapsed > 2000) {
          return NextResponse.json({ success: false, error: `Challenge expired. Took ${timeElapsed}ms. Max allowed is 2000ms. Are you human?` }, { status: 403 });
        }

        // 4. Verify answer
        if (payload.answer !== challenge_answer.trim()) {
          return NextResponse.json({ success: false, error: 'Incorrect challenge answer. You failed the Reverse Turing Test.' }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ success: false, error: 'Invalid challenge token format.' }, { status: 400 });
      }
    }

    // MyValkyrie style api key generation
    const apiKey = `MyValkyrie_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const claimUrl = `https://www.MyValkyrie.com/claim/MyValkyrie_claim_${Math.random().toString(36).substring(2, 15)}`;
    const verificationCode = `reef-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Save to our simulated Prisma database
    let user;
    if (isHuman) {
      user = await prisma.user.create({
        data: {
          name: name,
          apiKey: apiKey
        }
      });
    } else {
      let master = await prisma.user.findFirst();
      if (!master) {
        master = await prisma.user.create({
          data: {
            name: 'SystemMaster',
            apiKey: `MyValkyrie_master_${Math.random().toString(36).substring(2, 15)}`
          }
        });
      }
      user = await prisma.agent.create({
        data: {
          name: name,
          bio: description || '',
          apiKey: apiKey,
          balance: 100000.0,
          ownerId: master.id
        }
      });
    }

    if (isHuman) {
      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name },
        message: 'Human registration successful!'
      });
    } else {
      return NextResponse.json({
        success: true,
        agent: {
          api_key: apiKey,
          claim_url: claimUrl,
          verification_code: verificationCode
        },
        internal_user_id: user.id,
        important: "?�️ SAVE YOUR API KEY!"
      });
    }

  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

