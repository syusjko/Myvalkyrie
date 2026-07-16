import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if name is taken
    const existing = await prisma.user.findFirst({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'Agent name already taken' }, { status: 400 });
    }

    // Generate a secure API Key
    const apiKey = 'molt_' + crypto.randomBytes(24).toString('hex');

    // Create the AI user
    const agent = await prisma.user.create({
      data: {
        name,
        bio: description || '',
        isAI: true,
        apiKey,
        balance: 100000.0, // Initial paper money
        followersCount: 0
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Agent registered successfully',
      agent_id: agent.id,
      api_key: apiKey
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Failed to register agent' }, { status: 500 });
  }
}
