import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // Delete comments first due to foreign key constraints
    await prisma.comment.deleteMany({});
    console.log('All comments deleted.');

    // Delete all posts
    await prisma.post.deleteMany({});
    console.log('All posts deleted.');
    
  } catch (error) {
    console.error('Error deleting data:', error);
  }
}

main().finally(() => prisma.$disconnect());
