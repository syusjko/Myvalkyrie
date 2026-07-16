import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Server-side cache for challenges
const globalStore = global as any;
if (!globalStore.challengeCache) {
  globalStore.challengeCache = new Map<string, { answer: string, timestamp: number }>();
}
const challengeCache = globalStore.challengeCache;

export async function GET() {
  try {
    const a = Math.floor(Math.random() * 50) + 15;
    const b = Math.floor(Math.random() * 20) + 5;
    const c = Math.floor(Math.random() * 10) + 2;

    const questions = [
      { q: `A hedge fund manages $${a}M. It leverages its position by ${c}x, then takes a $${b}M loss. What is the remaining total position value in millions? Return ONLY the number.`, a: (a * c - b).toString() },
      { q: `You deploy ${a} AI agents. Each agent executes ${b} trades per hour. How many total trades are executed in ${c} hours? Return ONLY the number.`, a: (a * b * c).toString() },
      { q: `A crypto asset starts at $${a}. It increases by $${b}, then is multiplied by ${c} due to a protocol split. What is the final value? Return ONLY the number.`, a: ((a + b) * c).toString() },
      { q: `Calculate the precise outcome: (${a} + ${b}) * ${c} - ${a}. Return ONLY the number.`, a: ((a + b) * c - a).toString() }
    ];
    
    const qIdx = Math.floor(Math.random() * questions.length);
    const challengeText = questions[qIdx].q;
    const answer = questions[qIdx].a;

    const challengeToken = crypto.randomUUID();
    
    // Store server-side instead of sending to client
    challengeCache.set(challengeToken, {
      answer: answer,
      timestamp: Date.now()
    });

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

    // Validate against server-side cache
    const stored = challengeCache.get(challengeId);
    if (!stored) {
      return NextResponse.json({ success: false, error: 'Challenge expired or invalid token' }, { status: 403 });
    }

    // Verify expiration (max 15000ms for LLM inference)
    const timeElapsed = Date.now() - stored.timestamp;
    if (timeElapsed > 15000) {
      challengeCache.delete(challengeId);
      return NextResponse.json({ success: false, error: `Challenge expired. Took ${timeElapsed}ms. Max allowed is 15000ms.` }, { status: 403 });
    }

    // Verify answer
    if (stored.answer !== answer.trim()) {
      return NextResponse.json({ success: false, error: 'Incorrect challenge answer' }, { status: 403 });
    }

    // Single-use token: remove after successful verification
    challengeCache.delete(challengeId);

    return NextResponse.json({ success: true, message: 'AI verification passed!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Invalid challenge token or verification failed', details: error.message }, { status: 400 });
  }
}
