import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock Clerk auth with configurable org context
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

describe('getOrgScope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns OrgScope when user has active org', async () => {
    const mockOrgId = 'org_test123';
    const mockInstitutionId = 'inst_test123';
    const mockUserId = 'user_test123';

    mockAuth.mockResolvedValue({
      userId: 'clerk_test_user',
      orgId: mockOrgId,
      orgRole: 'org:member',
    });

    (prisma.institution.findUnique as any).mockResolvedValue({
      id: mockInstitutionId,
      name: 'Test University',
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: mockUserId,
      role: 'STUDENT',
      universityId: mockInstitutionId,
      institutionId: mockInstitutionId,
      year: 2,
      period: '2024A',
    });

    const { getOrgScope } = await import('@/lib/auth/org-scope');
    const scope = await getOrgScope();

    expect(scope).toBeDefined();
    expect(scope.clerkOrgId).toBe(mockOrgId);
    expect(scope.institutionId).toBe(mockInstitutionId);
    expect(scope.institutionName).toBe('Test University');
    expect(scope.appRole).toBe('STUDENT');
    expect(scope.orgRole).toBe('org:member');
    expect(scope.userId).toBe(mockUserId);
  });

  it('maps org:admin to ADMIN role', async () => {
    mockAuth.mockResolvedValue({
      userId: 'clerk_admin',
      orgId: 'org_test',
      orgRole: 'org:admin',
    });

    (prisma.institution.findUnique as any).mockResolvedValue({
      id: 'inst_1',
      name: 'Admin University',
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user_admin',
      role: 'STUDENT',
      universityId: 'inst_1',
      institutionId: 'inst_1',
      year: null,
      period: null,
    });

    const { getOrgScope } = await import('@/lib/auth/org-scope');
    const scope = await getOrgScope();

    expect(scope.appRole).toBe('ADMIN');
  });

  it('maps org:tutor to TUTOR role', async () => {
    mockAuth.mockResolvedValue({
      userId: 'clerk_tutor',
      orgId: 'org_test',
      orgRole: 'org:tutor',
    });

    (prisma.institution.findUnique as any).mockResolvedValue({
      id: 'inst_1',
      name: 'Tutor University',
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user_tutor',
      role: 'STUDENT',
      universityId: 'inst_1',
      institutionId: 'inst_1',
      year: null,
      period: null,
    });

    const { getOrgScope } = await import('@/lib/auth/org-scope');
    const scope = await getOrgScope();

    expect(scope.appRole).toBe('TUTOR');
  });

  it('maps org:lecturer to LECTURER role', async () => {
    mockAuth.mockResolvedValue({
      userId: 'clerk_lecturer',
      orgId: 'org_test',
      orgRole: 'org:lecturer',
    });

    (prisma.institution.findUnique as any).mockResolvedValue({
      id: 'inst_1',
      name: 'Lecturer University',
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user_lecturer',
      role: 'STUDENT',
      universityId: 'inst_1',
      institutionId: 'inst_1',
      year: null,
      period: null,
    });

    const { getOrgScope } = await import('@/lib/auth/org-scope');
    const scope = await getOrgScope();

    expect(scope.appRole).toBe('LECTURER');
  });

  it('throws when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      orgId: null,
      orgRole: null,
    });

    const { getOrgScope } = await import('@/lib/auth/org-scope');
    await expect(getOrgScope()).rejects.toThrow('User not authenticated');
  });

  it('throws when user has no active organization', async () => {
    mockAuth.mockResolvedValue({
      userId: 'clerk_test',
      orgId: null,
      orgRole: null,
    });

    const { getOrgScope } = await import('@/lib/auth/org-scope');
    await expect(getOrgScope()).rejects.toThrow('no active organization');
  });

  it('throws when institution not found for clerk org', async () => {
    mockAuth.mockResolvedValue({
      userId: 'clerk_test',
      orgId: 'org_nonexistent',
      orgRole: 'org:member',
    });

    (prisma.institution.findUnique as any).mockResolvedValue(null);

    const { getOrgScope } = await import('@/lib/auth/org-scope');
    await expect(getOrgScope()).rejects.toThrow('Institution not found');
  });

  it('throws when user not found in database', async () => {
    mockAuth.mockResolvedValue({
      userId: 'clerk_nonexistent',
      orgId: 'org_test',
      orgRole: 'org:member',
    });

    (prisma.institution.findUnique as any).mockResolvedValue({
      id: 'inst_1',
      name: 'Test University',
    });

    (prisma.user.findUnique as any).mockResolvedValue(null);

    const { getOrgScope } = await import('@/lib/auth/org-scope');
    await expect(getOrgScope()).rejects.toThrow('User not found');
  });

  it('falls back to Prisma role when org role is unknown', async () => {
    mockAuth.mockResolvedValue({
      userId: 'clerk_test',
      orgId: 'org_test',
      orgRole: 'org:unknown',
    });

    (prisma.institution.findUnique as any).mockResolvedValue({
      id: 'inst_1',
      name: 'Test University',
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user_1',
      role: 'TUTOR',
      universityId: 'inst_1',
      institutionId: 'inst_1',
      year: null,
      period: null,
    });

    const { getOrgScope } = await import('@/lib/auth/org-scope');
    const scope = await getOrgScope();

    expect(scope.appRole).toBe('TUTOR');
  });
});
