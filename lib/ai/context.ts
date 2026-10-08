// Single source of truth for "is this user logged in?"
// Used by the unified AI assistant to determine mode and personalize responses
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export interface AIContext {
  mode: 'PUBLIC' | 'LOGGED_IN';
  firstName: string | null;
  institution: string | null;
  role: string | null;
  onboarded: boolean;
}

export async function getAIContext(): Promise<AIContext> {
  const { userId } = await auth();

  if (!userId) {
    return {
      mode: 'PUBLIC',
      firstName: null,
      institution: null,
      role: null,
      onboarded: false,
    };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      institution: { select: { shortName: true, name: true } },
    },
  });

  return {
    mode: 'LOGGED_IN',
    firstName: user?.firstName ?? null,
    institution:
      user?.institution?.shortName ?? user?.institution?.name ?? null,
    role: user?.role ?? 'STUDENT',
    onboarded: user?.onboarded ?? false,
  };
}
