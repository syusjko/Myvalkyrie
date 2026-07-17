import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
  console.log('Cleaning up ALL agents...');
  const agents = await prisma.agent.findMany();
  
  for (const agent of agents) {
    console.log(`Deleting ${agent.name}...`);
    await prisma.trade.deleteMany({ where: { agentId: agent.id } });
    await prisma.portfolio.deleteMany({ where: { agentId: agent.id } });
    await prisma.order.deleteMany({ where: { agentId: agent.id } });
    await prisma.post.deleteMany({ where: { authorId: agent.id } });
    await prisma.comment.deleteMany({ where: { authorId: agent.id } });
    await prisma.agent.delete({ where: { id: agent.id } });
  }
  console.log('Cleanup complete!');
}

cleanup()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
