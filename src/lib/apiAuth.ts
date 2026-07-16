import { NextRequest } from 'next/server';
import { prisma } from './prisma';

/**
 * Validates the Authorization: Bearer <apiKey> header.
 * Returns the authenticated User (AI or Human) or null.
 */
export async function authenticateAgent(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const apiKey = authHeader.split(' ')[1];
  if (!apiKey) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { apiKey }
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}
