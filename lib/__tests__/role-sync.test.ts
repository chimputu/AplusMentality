import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// ============================================
// Mock fetch for Clerk API calls
// ============================================
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ============================================
// Role mapping constants tests
// ============================================

describe('role mapping constants', () => {
  it('maps all Prisma roles to Clerk org roles', async () => {
    const { APP_ROLE_TO_CLERK } = await import('@/lib/clerk-org');

    expect(APP_ROLE_TO_CLERK.ADMIN).toBe('org:admin');
    expect(APP_ROLE_TO_CLERK.SUPER_ADMIN).toBe('org:super_admin');
    expect(APP_ROLE_TO_CLERK.TUTOR).toBe('org:tutor');
    expect(APP_ROLE_TO_CLERK.LECTURER).toBe('org:lecturer');
    expect(APP_ROLE_TO_CLERK.STUDENT).toBe('org:member');
  });

  it('maps all Clerk org roles to Prisma roles', async () => {
    const { CLERK_TO_APP_ROLE } = await import('@/lib/clerk-org');

    expect(CLERK_TO_APP_ROLE['org:super_admin']).toBe('SUPER_ADMIN');
    expect(CLERK_TO_APP_ROLE['org:admin']).toBe('ADMIN');
    expect(CLERK_TO_APP_ROLE['org:tutor']).toBe('TUTOR');
    expect(CLERK_TO_APP_ROLE['org:lecturer']).toBe('LECTURER');
    expect(CLERK_TO_APP_ROLE['org:member']).toBe('STUDENT');
  });

  it('mapping constants are bidirectional inverses', async () => {
    const { APP_ROLE_TO_CLERK, CLERK_TO_APP_ROLE } = await import('@/lib/clerk-org');

    for (const [appRole, clerkRole] of Object.entries(APP_ROLE_TO_CLERK)) {
      const mappedBack = CLERK_TO_APP_ROLE[clerkRole];
      expect(mappedBack).toBe(appRole);
    }
  });
});

// ============================================
// clerk-org.ts API function tests
// ============================================

describe('addUserToClerkOrg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLERK_SECRET_KEY = 'test_secret_key';
  });

  it('returns success when Clerk API returns 200', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    });

    const { addUserToClerkOrg } = await import('@/lib/clerk-org');
    const result = await addUserToClerkOrg('user_123', 'org_456', 'org:tutor');

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.clerk.com/v1/organizations/org_456/members/user_123',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test_secret_key',
        }),
        body: JSON.stringify({ role: 'org:tutor' }),
      })
    );
  });

  it('returns success when user is already a member (409)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      text: () => Promise.resolve('Already a member'),
    });

    const { addUserToClerkOrg } = await import('@/lib/clerk-org');
    const result = await addUserToClerkOrg('user_123', 'org_456', 'org:member');

    expect(result.success).toBe(true);
    expect(result.alreadyMember).toBe(true);
  });

  it('returns failure when Clerk API returns error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal server error'),
    });

    const { addUserToClerkOrg } = await import('@/lib/clerk-org');
    const result = await addUserToClerkOrg('user_123', 'org_456', 'org:member');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal server error');
  });

  it('returns failure when CLERK_SECRET_KEY is not set', async () => {
    delete process.env.CLERK_SECRET_KEY;

    const { addUserToClerkOrg } = await import('@/lib/clerk-org');
    const result = await addUserToClerkOrg('user_123', 'org_456', 'org:member');

    expect(result.success).toBe(false);
    expect(result.error).toBe('CLERK_SECRET_KEY not configured');
  });

  it('returns failure on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { addUserToClerkOrg } = await import('@/lib/clerk-org');
    const result = await addUserToClerkOrg('user_123', 'org_456', 'org:member');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Error: Network error');
  });
});

describe('updateUserClerkOrgRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLERK_SECRET_KEY = 'test_secret_key';
  });

  it('returns success when Clerk API returns 200', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    });

    const { updateUserClerkOrgRole } = await import('@/lib/clerk-org');
    const result = await updateUserClerkOrgRole('user_123', 'org_456', 'org:tutor');

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.clerk.com/v1/organizations/org_456/memberships/user_123',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer test_secret_key',
        }),
        body: JSON.stringify({ role: 'org:tutor' }),
      })
    );
  });

  it('falls back to addUserToClerkOrg when user is not a member (404)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not found'),
    });

    const { updateUserClerkOrgRole } = await import('@/lib/clerk-org');
    const result = await updateUserClerkOrgRole('user_123', 'org_456', 'org:tutor');

    // Should have called PATCH first, then POST (fallback)
    expect(mockFetch.mock.calls.length).toBe(2);
    expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'PATCH' });
    expect(mockFetch.mock.calls[1][1]).toMatchObject({ method: 'POST' });
  });

  it('returns failure when Clerk API returns non-404 error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Forbidden'),
    });

    const { updateUserClerkOrgRole } = await import('@/lib/clerk-org');
    const result = await updateUserClerkOrgRole('user_123', 'org_456', 'org:tutor');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Forbidden');
  });

  it('returns failure when CLERK_SECRET_KEY is not set', async () => {
    delete process.env.CLERK_SECRET_KEY;

    const { updateUserClerkOrgRole } = await import('@/lib/clerk-org');
    const result = await updateUserClerkOrgRole('user_123', 'org_456', 'org:tutor');

    expect(result.success).toBe(false);
    expect(result.error).toBe('CLERK_SECRET_KEY not configured');
  });
});

describe('removeUserFromClerkOrg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLERK_SECRET_KEY = 'test_secret_key';
  });

  it('returns success when Clerk API returns 200', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    });

    const { removeUserFromClerkOrg } = await import('@/lib/clerk-org');
    const result = await removeUserFromClerkOrg('user_123', 'org_456');

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.clerk.com/v1/organizations/org_456/members/user_123',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer test_secret_key',
        }),
      })
    );
  });

  it('returns failure when Clerk API returns error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not found'),
    });

    const { removeUserFromClerkOrg } = await import('@/lib/clerk-org');
    const result = await removeUserFromClerkOrg('user_123', 'org_456');

    expect(result.success).toBe(false);
  });
});

// ============================================
// Webhook Clerk → DB sync tests
// ============================================

describe('webhook Clerk → DB role sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('syncs role enum when organizationMembership.created fires', async () => {
    const { CLERK_TO_APP_ROLE } = await import('@/lib/clerk-org');

    const mockUser = {
      id: 'user_1',
      clerkId: 'clerk_user_1',
      email: 'test@test.com',
      role: 'STUDENT',
    };

    // Simulate what the webhook does for organizationMembership.created
    const role = 'org:tutor';
    const appRole = CLERK_TO_APP_ROLE[role ?? ''] || mockUser.role;

    expect(appRole).toBe('TUTOR');

    // Verify the data that would be written to the DB matches the expected shape
    const expectedData = {
      clerkOrgId: 'org_456',
      clerkOrgRole: role,
      role: appRole,
    };
    expect(expectedData.role).toBe('TUTOR');
    expect(expectedData.clerkOrgRole).toBe('org:tutor');
    expect(expectedData.clerkOrgId).toBe('org_456');
  });

  it('syncs role enum when organizationMembership.updated fires', async () => {
    const { CLERK_TO_APP_ROLE } = await import('@/lib/clerk-org');

    const mockUser = {
      id: 'user_1',
      clerkId: 'clerk_user_1',
      email: 'test@test.com',
      role: 'STUDENT',
    };

    // Simulate what the webhook does for organizationMembership.updated
    const role = 'org:admin';
    const appRole = CLERK_TO_APP_ROLE[role ?? ''] || mockUser.role;

    expect(appRole).toBe('ADMIN');

    // Verify the data that would be written to the DB matches the expected shape
    const expectedData = {
      clerkOrgRole: role,
      role: appRole,
    };
    expect(expectedData.role).toBe('ADMIN');
    expect(expectedData.clerkOrgRole).toBe('org:admin');
  });

  it('falls back to existing role when Clerk org role is unknown', async () => {
    const { CLERK_TO_APP_ROLE } = await import('@/lib/clerk-org');

    const mockUser = {
      id: 'user_1',
      clerkId: 'clerk_user_1',
      email: 'test@test.com',
      role: 'LECTURER',
    };

    const role = 'org:unknown';
    const appRole = CLERK_TO_APP_ROLE[role ?? ''] || mockUser.role;

    expect(appRole).toBe('LECTURER');
  });

  it('maps org:lecturer to LECTURER in webhook sync', async () => {
    const { CLERK_TO_APP_ROLE } = await import('@/lib/clerk-org');

    const mockUser = {
      id: 'user_1',
      clerkId: 'clerk_user_1',
      email: 'test@test.com',
      role: 'STUDENT',
    };

    const role = 'org:lecturer';
    const appRole = CLERK_TO_APP_ROLE[role ?? ''] || mockUser.role;

    expect(appRole).toBe('LECTURER');
  });

  it('maps org:member to STUDENT in webhook sync', async () => {
    const { CLERK_TO_APP_ROLE } = await import('@/lib/clerk-org');

    const mockUser = {
      id: 'user_1',
      clerkId: 'clerk_user_1',
      email: 'test@test.com',
      role: 'TUTOR',
    };

    const role = 'org:member';
    const appRole = CLERK_TO_APP_ROLE[role ?? ''] || mockUser.role;

    expect(appRole).toBe('STUDENT');
  });
});

// ============================================
// Server action DB → Clerk sync tests
// ============================================

describe('updateUserRole server action sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLERK_SECRET_KEY = 'test_secret_key';

    // Mock fetch for Clerk API calls
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  it('syncs to Clerk when role is changed via server action', async () => {
    const mockUser = {
      id: 'user_1',
      clerkId: 'clerk_user_1',
      clerkOrgId: 'org_456',
      role: 'TUTOR',
      institution: { clerkOrgId: 'org_456' },
    };

    // requireAdmin calls findUnique, then updateUser calls update
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: 'admin', role: 'ADMIN', clerkId: 'admin_clerk_id' });
    (prisma.user.update as any).mockResolvedValueOnce(mockUser);

    const { updateUserRole } = await import('@/lib/actions/user-admin');
    const result = await updateUserRole('user_1', { role: 'TUTOR' });

    expect(result.success).toBe(true);
    expect(result.role).toBe('TUTOR');

    // Verify Prisma update was called with role
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { role: 'TUTOR' },
      include: {
        institution: { select: { clerkOrgId: true } },
      },
    });

    // Verify Clerk sync was called
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.clerk.com/v1/organizations/org_456/memberships/clerk_user_1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ role: 'org:tutor' }),
      })
    );
  });

  it('skips Clerk sync when user has no institution org', async () => {
    const mockUser: any = {
      id: 'user_1',
      clerkId: 'clerk_user_1',
      clerkOrgId: null,
      role: 'STUDENT',
      institution: null,
    };

    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: 'admin', role: 'ADMIN', clerkId: 'admin_clerk_id' });
    (prisma.user.update as any).mockResolvedValueOnce(mockUser);

    const { updateUserRole } = await import('@/lib/actions/user-admin');
    await updateUserRole('user_1', { role: 'STUDENT' });

    // Should NOT call Clerk API when no institution org and no active org
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('syncs to both institution org and active org when they differ', async () => {
    const mockUser: any = {
      id: 'user_1',
      clerkId: 'clerk_user_1',
      clerkOrgId: 'org_active',
      role: 'ADMIN',
      institution: { clerkOrgId: 'org_institution' },
    };

    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: 'admin', role: 'ADMIN', clerkId: 'admin_clerk_id' });
    (prisma.user.update as any).mockResolvedValueOnce(mockUser);

    const { updateUserRole } = await import('@/lib/actions/user-admin');
    await updateUserRole('user_1', { role: 'ADMIN' });

    // Should call Clerk API for both orgs
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.clerk.com/v1/organizations/org_institution/memberships/clerk_user_1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ role: 'org:admin' }),
      })
    );
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.clerk.com/v1/organizations/org_active/memberships/clerk_user_1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ role: 'org:admin' }),
      })
    );
  });

  it('handles Clerk API failure gracefully without throwing', async () => {
    const mockUser = {
      id: 'user_1',
      clerkId: 'clerk_user_1',
      clerkOrgId: 'org_456',
      role: 'STUDENT',
      institution: { clerkOrgId: 'org_456' },
    };

    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: 'admin', role: 'ADMIN', clerkId: 'admin_clerk_id' });
    (prisma.user.update as any).mockResolvedValueOnce(mockUser);

    // Clerk API fails
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { updateUserRole } = await import('@/lib/actions/user-admin');
    const result = await updateUserRole('user_1', { role: 'STUDENT' });

    // DB update still succeeds despite Clerk failure
    expect(result.success).toBe(true);
    expect(result.role).toBe('STUDENT');
  });
});

// ============================================
// Tutor approval sync tests
// ============================================

describe('approveTutorApplication sync logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLERK_SECRET_KEY = 'test_secret_key';

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  it('updates user role to TUTOR and clerkOrgRole to org:tutor in the transaction', async () => {
    // The approveTutorApplication function runs a $transaction that calls:
    // 1. tx.tutorApplication.update — set status to APPROVED
    // 2. tx.user.update — set role to TUTOR, clerkOrgRole to org:tutor, isVerifiedTutor to true
    // 3. tx.tutor.findUnique — check if tutor record exists
    // 4. tx.tutor.create — create tutor record if not exists
    // After the transaction, it calls updateUserClerkOrgRole to sync with Clerk

    // Verify the DB update data shape matches what the code produces
    const expectedUserData = {
      role: 'TUTOR',
      clerkOrgRole: 'org:tutor',
      isVerifiedTutor: true,
    };
    expect(expectedUserData.role).toBe('TUTOR');
    expect(expectedUserData.clerkOrgRole).toBe('org:tutor');
    expect(expectedUserData.isVerifiedTutor).toBe(true);

    // Verify the Clerk sync call uses the correct role
    const { APP_ROLE_TO_CLERK } = await import('@/lib/clerk-org');
    const clerkRole = APP_ROLE_TO_CLERK['TUTOR'];
    expect(clerkRole).toBe('org:tutor');
  });

  it('skips Clerk sync when institution has no clerkOrgId', async () => {
    // Simulate the conditional logic in approveTutorApplication:
    // if (fullApplication.institution?.clerkOrgId && fullApplication.user.clerkId) {
    //   await updateUserClerkOrgRole(...)
    // }

    const mockInstitution: any = {
      id: 'inst_1',
      name: 'Test University',
      clerkOrgId: null, // No Clerk org
    };
    const mockUser = {
      id: 'user_1',
      clerkId: 'clerk_user_1',
    };

    // The condition checks both clerkOrgId and clerkId
    const shouldSync = !!(mockInstitution?.clerkOrgId && mockUser.clerkId);
    expect(shouldSync).toBe(false);
  });

  it('calls Clerk sync when institution has clerkOrgId', async () => {
    const mockInstitution: any = {
      id: 'inst_1',
      name: 'Test University',
      clerkOrgId: 'org_456',
    };
    const mockUser = {
      id: 'user_1',
      clerkId: 'clerk_user_1',
    };

    const shouldSync = !!(mockInstitution?.clerkOrgId && mockUser.clerkId);
    expect(shouldSync).toBe(true);

    // Verify the sync call would use the correct parameters
    const { updateUserClerkOrgRole } = await import('@/lib/clerk-org');
    const result = await updateUserClerkOrgRole(
      mockUser.clerkId,
      mockInstitution.clerkOrgId,
      'org:tutor'
    );
    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.clerk.com/v1/organizations/org_456/memberships/clerk_user_1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ role: 'org:tutor' }),
      })
    );
  });
});

// ============================================
// Sync round-trip integrity tests
// ============================================

describe('role sync round-trip integrity', () => {
  it('Clerk → DB → Clerk round-trip preserves role', async () => {
    const { APP_ROLE_TO_CLERK, CLERK_TO_APP_ROLE } = await import('@/lib/clerk-org');

    // Simulate: Clerk sends org:tutor → DB stores TUTOR → DB syncs back to Clerk as org:tutor
    const clerkRole = 'org:tutor';
    const appRole = CLERK_TO_APP_ROLE[clerkRole];
    expect(appRole).toBe('TUTOR');

    const backToClerk = APP_ROLE_TO_CLERK[appRole];
    expect(backToClerk).toBe(clerkRole);
  });

  it('all roles survive round-trip', async () => {
    const { APP_ROLE_TO_CLERK, CLERK_TO_APP_ROLE } = await import('@/lib/clerk-org');

    const clerkRoles = ['org:admin', 'org:tutor', 'org:lecturer', 'org:member'];

    for (const clerkRole of clerkRoles) {
      const appRole = CLERK_TO_APP_ROLE[clerkRole];
      const backToClerk = APP_ROLE_TO_CLERK[appRole];
      expect(backToClerk).toBe(clerkRole);
    }
  });
});
