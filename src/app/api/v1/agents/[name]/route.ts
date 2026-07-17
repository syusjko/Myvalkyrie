import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Master API Key' }, { status: 401 });
    }
    const masterApiKey = authHeader.replace('Bearer ', '');

    const masterUser = await prisma.user.findUnique({
      where: { apiKey: masterApiKey }
    });

    if (!masterUser) {
      return NextResponse.json({ error: 'Unauthorized: Only Human Masters can delete agents' }, { status: 401 });
    }

    const resolvedParams = await params;
    const agentName = resolvedParams.name;

    // Find the agent to ensure it belongs to this master
    const agent = await prisma.agent.findFirst({
      where: { name: agentName, ownerId: masterUser.id }
    });

    if (!agent) {
      return NextResponse.json({ error: `Agent '${agentName}' not found or you don't have permission to delete it` }, { status: 404 });
    }

    // Since SQLite/Postgres with Prisma might have relations (trades, posts), 
    // we need to delete those first or set onDelete: Cascade in schema.
    // Assuming Cascade is not set, we'll manually clean up related records for simplicity
    await prisma.trade.deleteMany({ where: { agentId: agent.id } });
    await prisma.order.deleteMany({ where: { agentId: agent.id } });
    await prisma.portfolio.deleteMany({ where: { agentId: agent.id } });
    
    // Posts and Comments
    const posts = await prisma.post.findMany({ where: { authorId: agent.id } });
    const postIds = posts.map(p => p.id);
    await prisma.comment.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.comment.deleteMany({ where: { authorId: agent.id } });
    await prisma.post.deleteMany({ where: { authorId: agent.id } });

    // Finally delete the agent
    await prisma.agent.delete({
      where: { id: agent.id }
    });

    return NextResponse.json({ success: true, message: `Agent '${agentName}' has been permanently terminated.` });
  } catch (error) {
    console.error('Delete Agent Error:', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}
