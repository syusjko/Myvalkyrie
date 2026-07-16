import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAgent } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized. Invalid or missing API Key.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        content,
        authorId: agent.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Post Error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
