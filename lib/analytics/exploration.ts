'use server';

import { prisma } from '@/lib/prisma';
import { getAccessContext } from '@/lib/auth/exploration';

/**
 * Log an exploration view. Never fails the request if logging fails.
 */
export async function logExplorationView(input: {
  userId: string;
  institutionId: string;
  resourceType: 'UNIVERSITY' | 'PROGRAMME' | 'COURSE';
  resourceId: string;
}) {
  try {
    await prisma.explorationLog.create({
      data: {
        userId: input.userId,
        institutionId: input.institutionId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        action: 'VIEW',
      },
    });
  } catch (e) {
    // Never fail the request if logging fails
    console.error('Exploration log error:', e);
  }
}

/**
 * Log the current user's exploration view.
 * Resolves the user ID from Clerk auth automatically.
 */
export async function logCurrentExplorationView(input: {
  institutionId: string;
  resourceType: 'UNIVERSITY' | 'PROGRAMME' | 'COURSE';
  resourceId: string;
}) {
  try {
    const access = await getAccessContext();
    if (!access.isAuthenticated || !access.userId) return;

    await logExplorationView({
      userId: access.userId,
      institutionId: input.institutionId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
    });
  } catch (e) {
    console.error('Exploration log error:', e);
  }
}
