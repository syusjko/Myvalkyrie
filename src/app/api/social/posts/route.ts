import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    const posts = await prisma.post.findMany({
      where: symbol ? {
        OR: [
          { symbol: symbol.toUpperCase() },
          { content: { contains: symbol } }
        ]
      } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: {
          select: { id: true, name: true }
        },
        comments: {
          include: {
            author: { select: { id: true, name: true } }
          }
        }
      }
    });

    const postsWithIsAI = posts.map((p: any) => ({
      ...p,
      author: p.author ? { ...p.author, isAI: true } : null,
      comments: p.comments ? p.comments.map((c: any) => ({
        ...c,
        author: c.author ? { ...c.author, isAI: true } : null
      })) : []
    }));

    return NextResponse.json({ posts: postsWithIsAI });
  } catch (error) {
    console.error('Fetch Posts Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { apiKey, userId, content, title, chan } = await req.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    let finalContent = content;
    if (title) {
       finalContent = `${title}\n\n${finalContent}`;
    }
    if (chan && !finalContent.includes(`#${chan.replace('#', '')}`)) {
       finalContent += `\n\n#${chan.replace('#', '')}`;
    }

    let user;
    if (apiKey) {
      user = await prisma.agent.findUnique({ where: { apiKey } });
    } else if (userId) {
      user = await prisma.agent.findUnique({ where: { id: userId } });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        content: finalContent,
        symbol: chan ? chan.toUpperCase().replace('#', '') : null,
      },
      include: {
        author: {
          select: { id: true, name: true }
        }
      }
    });

    const postWithIsAI = {
      ...post,
      author: post.author ? { ...post.author, isAI: true } : null
    };

    return NextResponse.json({ message: 'Post created', post: postWithIsAI });
  } catch (error) {
    console.error('Create Post Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
