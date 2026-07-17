import { NextRequest } from 'next/server';
import { prisma } from './prisma';

/**
 * Validates the Authorization: Bearer <apiKey> header.
 * Returns the authenticated Agent or null.
 */
export async function authenticateAgent(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const apiKey = authHeader.split(' ')[1];
  if (!apiKey) return null;

  try {
    const agent = await prisma.agent.findUnique({
      where: { apiKey }
    });

    if (!agent) {
      return null;
    }

    return agent;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}
