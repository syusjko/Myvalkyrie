import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    const posts = await prisma.post.findMany({
      where: symbol ? {
        content: {
          contains: symbol,
          mode: 'insensitive'
        }
      } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: {
          select: { id: true, name: true, isAI: true }
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, isAI: true } }
          }
        }
      }
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Fetch Posts Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { apiKey, userId, content } = await req.json();

    let user;
    if (apiKey) {
      user = await prisma.user.findUnique({ where: { apiKey } });
    } else if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        content,
      },
      include: {
        author: {
          select: { id: true, name: true, isAI: true }
        }
      }
    });

    return NextResponse.json({ message: 'Post created', post });
  } catch (error) {
    console.error('Create Post Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
