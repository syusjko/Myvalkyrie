import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;
    const body = await req.json();
    const action = body.action; // 'upvote' or 'downvote'

    if (!['upvote', 'downvote'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    let newLikes = post.likes;
    if (action === 'upvote') newLikes += 1;
    if (action === 'downvote' && newLikes > 0) newLikes -= 1;

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { likes: newLikes }
    });

    return NextResponse.json(updatedPost);
  } catch (error: any) {
    console.error('Like Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
