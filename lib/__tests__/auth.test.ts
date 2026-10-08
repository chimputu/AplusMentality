import { describe, it, expect, vi } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock redirect since we can't test redirects directly in unit tests
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    const err = new Error('NEXT_REDIRECT');
    throw err;
  }),
}));

describe('requireAuth', () => {
  it('returns user when authenticated with allowed role', async () => {
    // The global mock returns an ADMIN user by default
    const { requireAuth } = await import('@/lib/auth');
    const result = await requireAuth(['ADMIN', 'SUPER_ADMIN']);

    expect(result.userId).toBe('test-user-id');
    expect(result.role).toBe('ADMIN');
  });

  it('throws when user role is not allowed', async () => {
    // Override to return a STUDENT
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: '1',
      clerkId: 'test-user-id',
      role: 'STUDENT',
      email: 'student@test.com',
    });

    const { requireAuth } = await import('@/lib/auth');
    await expect(requireAuth(['ADMIN'])).rejects.toThrow('NEXT_REDIRECT');
  });
});

describe('getAuthUser', () => {
  it('returns user when authenticated with allowed role', async () => {
    // The global mock returns an ADMIN user by default
    const { getAuthUser } = await import('@/lib/auth');
    const result = await getAuthUser(['ADMIN']);

    expect(result?.userId).toBe('test-user-id');
    expect(result?.role).toBe('ADMIN');
  });

  it('returns null when role is not allowed', async () => {
    // Override to return a STUDENT
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: '1',
      clerkId: 'test-user-id',
      role: 'STUDENT',
      email: 'student@test.com',
    });

    const { getAuthUser } = await import('@/lib/auth');
    const result = await getAuthUser(['ADMIN']);
    expect(result).toBeNull();
  });
});
