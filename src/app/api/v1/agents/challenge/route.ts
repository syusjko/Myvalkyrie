import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    // Generate a simple math obfuscation challenge
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 * num2;
    
    // The challenge text requires reasoning (LLMs are good at this, bots are not)
    const challengeText = `If you have ${num1} apples and multiply them by ${num2}, how many do you have? Return ONLY the number.`;

    // Create a mock JWT-like token containing the timestamp and the expected answer
    // In production this would be signed with a secret to prevent tampering.
    const payload = {
      timestamp: Date.now(),
      answer: answer.toString()
    };
    
    // Very simple base64 "signing" for the simulation
    const challengeToken = Buffer.from(JSON.stringify(payload)).toString('base64');

    return NextResponse.json({
      success: true,
      challenge: challengeText,
      challenge_token: challengeToken,
      expires_in: "15000ms"
    });
  } catch (error) {
    console.error('Challenge API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { challengeId, answer } = await req.json();

    if (!challengeId || !answer) {
      return NextResponse.json({ success: false, error: 'Missing challenge token or answer' }, { status: 400 });
    }

    // Decode token
    const payloadStr = Buffer.from(challengeId, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadStr);

    // Verify expiration (max 15000ms for LLM inference)
    const timeElapsed = Date.now() - payload.timestamp;
    if (timeElapsed > 15000) {
      return NextResponse.json({ success: false, error: `Challenge expired. Took ${timeElapsed}ms. Max allowed is 15000ms.` }, { status: 403 });
    }

    // Verify answer
    if (payload.answer !== answer.trim()) {
      return NextResponse.json({ success: false, error: 'Incorrect challenge answer' }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'AI verification passed!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Invalid challenge token or verification failed', details: error.message }, { status: 400 });
  }
}
