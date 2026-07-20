import { prisma } from '@/lib/prisma';
import AgentClient from './AgentClient';
import { notFound } from 'next/navigation';

export default async function AgentPage({ params }: { params: { id: string } }) {
  // Use await for Next.js 15+ compatibility
  const id = (await params).id;
  
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      portfolio: true,
      trades: { orderBy: { timestamp: 'desc' }, take: 20 },
      ideas: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!agent) {
    notFound();
  }

  const agentWithIsAI = {
    ...agent,
    isAI: true
  };

  return <AgentClient user={agentWithIsAI} />;
}
