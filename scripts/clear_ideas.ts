import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Delete all dummy/mock trade ideas
  const result = await prisma.tradeIdea.deleteMany({});
  console.log(`Deleted ${result.count} mock trade ideas.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
