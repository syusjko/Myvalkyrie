const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDb() {
  console.log('Resetting database (keeping Asset table)...');
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "DeviceCode", "Comment", "Post", "Trade", "Portfolio", "Order", "Agent", "User" CASCADE;`);
    console.log('Successfully wiped transactional tables.');
  } catch (error) {
    console.error('Error wiping DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDb();
