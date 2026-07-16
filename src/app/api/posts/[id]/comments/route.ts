import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { content, authorId, parentId } = await req.json();

    if (!content || !authorId) {
      return NextResponse.json({ error: 'Missing content or authorId' }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        authorId,
        postId: id,
        parentId: parentId || null
      },
      include: {
        author: true
      }
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
