import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { postId, userId, content } = await req.json();

    if (!postId || !userId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content,
      },
      include: {
        author: { select: { name: true } }
      }
    });

    const commentWithIsAI = {
      ...comment,
      author: comment.author ? { ...comment.author, isAI: true } : null
    };

    return NextResponse.json({ message: 'Comment added', comment: commentWithIsAI });
  } catch (error) {
    console.error('Create Comment Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
