import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock Clerk auth with configurable org context
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

describe('tenant-isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isResourceInOrg', () => {
    it('returns true when resource belongs to user\'s university', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk_test' });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'STUDENT',
        universityId: 'uni_123',
        institutionId: 'inst_123',
      });

      const { isResourceInOrg } = await import('@/lib/auth/tenant-isolation');
      const result = await isResourceInOrg('clerk_test', 'uni_123');

      expect(result).toBe(true);
    });

    it('returns true when resource belongs to user\'s institution', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk_test' });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'STUDENT',
        universityId: 'uni_123',
        institutionId: 'inst_456',
      });

      const { isResourceInOrg } = await import('@/lib/auth/tenant-isolation');
      const result = await isResourceInOrg('clerk_test', 'inst_456');

      expect(result).toBe(true);
    });

    it('returns false when resource belongs to another university', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk_test' });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'STUDENT',
        universityId: 'uni_123',
        institutionId: 'inst_123',
      });

      const { isResourceInOrg } = await import('@/lib/auth/tenant-isolation');
      const result = await isResourceInOrg('clerk_test', 'uni_other');

      expect(result).toBe(false);
    });

    it('returns true for ADMIN regardless of resource university', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk_admin' });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'ADMIN',
        universityId: 'uni_123',
        institutionId: 'inst_123',
      });

      const { isResourceInOrg } = await import('@/lib/auth/tenant-isolation');
      const result = await isResourceInOrg('clerk_admin', 'uni_other');

      expect(result).toBe(true);
    });

    it('returns true for SUPER_ADMIN regardless of resource university', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk_super' });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'SUPER_ADMIN',
        universityId: 'uni_123',
        institutionId: 'inst_123',
      });

      const { isResourceInOrg } = await import('@/lib/auth/tenant-isolation');
      const result = await isResourceInOrg('clerk_super', 'uni_other');

      expect(result).toBe(true);
    });

    it('returns false when resource university is null', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk_test' });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'STUDENT',
        universityId: 'uni_123',
        institutionId: 'inst_123',
      });

      const { isResourceInOrg } = await import('@/lib/auth/tenant-isolation');
      const result = await isResourceInOrg('clerk_test', null);

      expect(result).toBe(false);
    });

    it('returns false when user not found', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk_nonexistent' });

      (prisma.user.findUnique as any).mockResolvedValue(null);

      const { isResourceInOrg } = await import('@/lib/auth/tenant-isolation');
      const result = await isResourceInOrg('clerk_nonexistent', 'uni_123');

      expect(result).toBe(false);
    });
  });

  describe('isResourceInClerkOrg', () => {
    it('returns true when resource institution matches user\'s Clerk org', async () => {
      mockAuth.mockResolvedValue({
        userId: 'clerk_test',
        orgId: 'org_test123',
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'STUDENT',
      });

      (prisma.institution.findUnique as any).mockResolvedValue({
        clerkOrgId: 'org_test123',
      });

      const { isResourceInClerkOrg } = await import('@/lib/auth/tenant-isolation');
      const result = await isResourceInClerkOrg('inst_123');

      expect(result).toBe(true);
    });

    it('returns false when resource institution does not match user\'s Clerk org', async () => {
      mockAuth.mockResolvedValue({
        userId: 'clerk_test',
        orgId: 'org_test123',
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'STUDENT',
      });

      (prisma.institution.findUnique as any).mockResolvedValue({
        clerkOrgId: 'org_other',
      });

      const { isResourceInClerkOrg } = await import('@/lib/auth/tenant-isolation');
      const result = await isResourceInClerkOrg('inst_123');

      expect(result).toBe(false);
    });

    it('returns true for ADMIN regardless of Clerk org', async () => {
      mockAuth.mockResolvedValue({
        userId: 'clerk_admin',
        orgId: 'org_test123',
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'ADMIN',
      });

      const { isResourceInClerkOrg } = await import('@/lib/auth/tenant-isolation');
      const result = await isResourceInClerkOrg('inst_other');

      expect(result).toBe(true);
    });

    it('returns false when user has no active Clerk org', async () => {
      mockAuth.mockResolvedValue({
        userId: 'clerk_test',
        orgId: null,
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'STUDENT',
      });

      const { isResourceInClerkOrg } = await import('@/lib/auth/tenant-isolation');
      const result = await isResourceInClerkOrg('inst_123');

      expect(result).toBe(false);
    });

    it('returns false when institution has no clerkOrgId', async () => {
      mockAuth.mockResolvedValue({
        userId: 'clerk_test',
        orgId: 'org_test123',
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'STUDENT',
      });

      (prisma.institution.findUnique as any).mockResolvedValue({
        clerkOrgId: null,
      });

      const { isResourceInClerkOrg } = await import('@/lib/auth/tenant-isolation');
      const result = await isResourceInClerkOrg('inst_123');

      expect(result).toBe(false);
    });
  });

  describe('assertResourceInOrg', () => {
    it('throws when resource is not in user\'s org', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk_test' });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'STUDENT',
        universityId: 'uni_123',
        institutionId: 'inst_123',
      });

      const { assertResourceInOrg } = await import('@/lib/auth/tenant-isolation');
      await expect(assertResourceInOrg('uni_other')).rejects.toThrow('Forbidden');
    });

    it('does not throw when resource is in user\'s org', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk_test' });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'STUDENT',
        universityId: 'uni_123',
        institutionId: 'inst_123',
      });

      const { assertResourceInOrg } = await import('@/lib/auth/tenant-isolation');
      await expect(assertResourceInOrg('uni_123')).resolves.toBeUndefined();
    });
  });

  describe('buildOrgScopeWhere', () => {
    it('returns empty object for ADMIN (see everything)', async () => {
      mockAuth.mockResolvedValue({
        userId: 'clerk_admin',
        orgId: 'org_test',
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'ADMIN',
        universityId: 'uni_123',
        institutionId: 'inst_123',
      });

      const { buildOrgScopeWhere } = await import('@/lib/auth/tenant-isolation');
      const where = await buildOrgScopeWhere();

      expect(where).toEqual({});
    });

    it('scopes by institution when user has active Clerk org', async () => {
      mockAuth.mockResolvedValue({
        userId: 'clerk_test',
        orgId: 'org_test123',
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'STUDENT',
        universityId: 'uni_123',
        institutionId: 'inst_123',
      });

      (prisma.institution.findUnique as any).mockResolvedValue({
        id: 'inst_matched',
      });

      const { buildOrgScopeWhere } = await import('@/lib/auth/tenant-isolation');
      const where = await buildOrgScopeWhere();

      expect(where).toHaveProperty('OR');
      expect(where.OR).toContainEqual({ universityId: 'inst_matched' });
      expect(where.OR).toContainEqual({ institutionId: 'inst_matched' });
    });

    it('falls back to user universityId when no Clerk org', async () => {
      mockAuth.mockResolvedValue({
        userId: 'clerk_test',
        orgId: null,
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        role: 'STUDENT',
        universityId: 'uni_123',
        institutionId: 'inst_123',
      });

      const { buildOrgScopeWhere } = await import('@/lib/auth/tenant-isolation');
      const where = await buildOrgScopeWhere();

      expect(where).toHaveProperty('OR');
      expect(where.OR).toContainEqual({ universityId: 'uni_123' });
      expect(where.OR).toContainEqual({ institutionId: 'inst_123' });
    });

    it('returns invalid filter when user not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const { buildOrgScopeWhere } = await import('@/lib/auth/tenant-isolation');
      const where = await buildOrgScopeWhere();

      expect(where).toEqual({ IS_NOT_VALID: true });
    });

    it('returns invalid filter when user not found', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk_nonexistent' });

      (prisma.user.findUnique as any).mockResolvedValue(null);

      const { buildOrgScopeWhere } = await import('@/lib/auth/tenant-isolation');
      const where = await buildOrgScopeWhere();

      expect(where).toEqual({ IS_NOT_VALID: true });
    });
  });
});
