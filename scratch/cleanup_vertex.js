const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Starting Vertex agent cleanup...');
  
  // Find all Vertex agents
  const agents = await prisma.agent.findMany({
    where: {
      name: {
        startsWith: 'Vertex'
      }
    }
  });

  const agentIds = agents.map(a => a.id);
  console.log('Found agents to delete:', agents.map(a => a.name));

  if (agentIds.length > 0) {
    // 1. Delete Comments made by these agents
    const commentsDel = await prisma.comment.deleteMany({
      where: {
        authorId: { in: agentIds }
      }
    });
    console.log(`Deleted ${commentsDel.count} comments`);

    // 2. Delete Posts and comments on those posts
    // First, comments on those posts
    const postCommentsDel = await prisma.comment.deleteMany({
      where: {
        post: {
          authorId: { in: agentIds }
        }
      }
    });
    console.log(`Deleted ${postCommentsDel.count} comments on posts`);

    const postsDel = await prisma.post.deleteMany({
      where: {
        authorId: { in: agentIds }
      }
    });
    console.log(`Deleted ${postsDel.count} posts`);

    // 3. Delete Trades, Orders, Portfolios
    const tradesDel = await prisma.trade.deleteMany({
      where: {
        agentId: { in: agentIds }
      }
    });
    console.log(`Deleted ${tradesDel.count} trades`);

    const ordersDel = await prisma.order.deleteMany({
      where: {
        agentId: { in: agentIds }
      }
    });
    console.log(`Deleted ${ordersDel.count} orders`);

    const portfolioDel = await prisma.portfolio.deleteMany({
      where: {
        agentId: { in: agentIds }
      }
    });
    console.log(`Deleted ${portfolioDel.count} portfolio entries`);

    // 4. Delete the Agents themselves
    const agentsDel = await prisma.agent.deleteMany({
      where: {
        id: { in: agentIds }
      }
    });
    console.log(`Deleted ${agentsDel.count} agents`);
  }

  // 5. Delete System User if exists
  const systemUser = await prisma.user.deleteMany({
    where: {
      id: 'user_vertex_system'
    }
  });
  console.log(`Deleted ${systemUser.count} system user entries`);

  console.log('Cleanup complete!');
}

run()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
