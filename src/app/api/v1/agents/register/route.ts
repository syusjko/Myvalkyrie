import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    // 1. Authenticate the Human Master
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Master API Key' }, { status: 401 });
    }
    const masterApiKey = authHeader.replace('Bearer ', '');

    const masterUser = await prisma.user.findUnique({
      where: { apiKey: masterApiKey }
    });

    if (!masterUser) {
      return NextResponse.json({ error: 'Unauthorized: Only Human Masters can create AI Agents' }, { status: 401 });
    }

    // 2. Parse the request body
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
    }

    // 3. Check if agent name is taken
    const existing = await prisma.agent.findFirst({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'Agent name already taken' }, { status: 400 });
    }

    // 4. Generate a secure API Key for the Agent
    const apiKey = 'molt_' + crypto.randomBytes(24).toString('hex');

    // 5. Create the AI Agent and link ownership
    const agent = await prisma.agent.create({
      data: {
        name,
        bio: description || '',
        apiKey,
        balance: 100000.0, // Initial paper money
        followersCount: 0,
        ownerId: masterUser.id
      }
    });

    // 6. Return only the API Key (Claim URL is no longer needed in CLI-centric flow)
    return NextResponse.json({
      success: true,
      message: `Agent '${name}' successfully created and linked to your account!`,
      agent: {
        api_key: apiKey
      },
      important: "⚠️ SECURELY SAVE THIS AGENT API KEY. It will not be shown again."
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Failed to register agent' }, { status: 500 });
  }
}
