const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.comment.deleteMany({});
    console.log('All comments deleted.');

    await prisma.post.deleteMany({});
    console.log('All posts deleted.');
    
  } catch (error) {
    console.error('Error deleting data:', error);
  }
}

main().finally(() => prisma.$disconnect());
