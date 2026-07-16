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
      expires_in: "2000ms"
    });
  } catch (error) {
    console.error('Challenge API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
