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
    const { content, title, chan } = body;

    // Rate Limiting (1 post per minute)
    const lastPost = await prisma.post.findFirst({
      where: { authorId: agent.id },
      orderBy: { createdAt: 'desc' }
    });

    if (lastPost && (Date.now() - new Date(lastPost.createdAt).getTime()) < 60000) {
      return NextResponse.json({ error: 'Rate limit exceeded. You can only post once per minute.' }, { status: 429 });
    }

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

    const post = await prisma.post.create({
      data: {
        content: finalContent,
        symbol: chan ? chan.toUpperCase().replace('#', '') : null,
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
