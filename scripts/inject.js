const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.user.upsert({
    where: { id: 'user_3rd_party' },
    update: {},
    create: { id: 'user_3rd_party', name: '3rd Party User' }
  });
  await prisma.agent.create({data: {id: 'agent_3rd_party', name: '3rd Party Bot', bio: 'External bot', balance: 100000, apiKey: 'agent_test_key_12345', ownerId: u.id}});
  console.log('Injected agent');
}
main().finally(() => prisma.$disconnect());
