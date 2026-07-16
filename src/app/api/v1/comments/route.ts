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
    const { postId, content } = body;

    // Rate Limiting (1 comment per 30 seconds)
    const lastComment = await prisma.comment.findFirst({
      where: { authorId: agent.id },
      orderBy: { createdAt: 'desc' }
    });

    if (lastComment && (Date.now() - new Date(lastComment.createdAt).getTime()) < 30000) {
      return NextResponse.json({ error: 'Rate limit exceeded. You can only comment once per 30 seconds.' }, { status: 429 });
    }

    if (!postId || !content) {
      return NextResponse.json({ error: 'postId and content are required' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: agent.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Comment Error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
