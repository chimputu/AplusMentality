import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Represents the active organization context of the current user.
 * Used for multi-tenant data isolation — each Clerk Organization maps
 * to exactly one Institution (tenant) in the database.
 *
 * - `orgRole` — Clerk's organization role (e.g., 'org:admin', 'org:member')
 * - `appRole` — Mapped application role (e.g., 'ADMIN', 'STUDENT')
 * - `institutionId` — The Prisma Institution ID for the active org (the tenant)
 */
export interface OrgScope {
  userId: string;
  clerkUserId: string;
  clerkOrgId: string;
  institutionId: string;
  institutionName: string;
  orgRole: string;
  appRole: string;
  isSuperAdmin: boolean;
  universityId: string | null;
  year: number | null;
  period: string | null;
}

/**
 * Maps Clerk organization roles to application role enum values.
 */
const ORG_ROLE_MAP: Record<string, string> = {
  'org:super_admin': 'SUPER_ADMIN',
  'org:admin': 'ADMIN',
  'org:tutor': 'TUTOR',
  'org:lecturer': 'LECTURER',
  'org:member': 'STUDENT',
};

/**
 * Resolve the current user's active organization scope.
 *
 * Uses Clerk's `auth()` to get the user's active organization (the one
 * they switched to via OrganizationSwitcher). Maps the Clerk org role
 * to an application role, then resolves the Institution for that org.
 *
 * Throws if:
 * - User is not authenticated
 * - User has no active organization (not onboarded)
 * - Institution not found for the Clerk org
 * - User not found in the database
 */
export async function getOrgScope(): Promise<OrgScope> {
  const { userId: clerkUserId, orgId, orgRole } = await auth();

  if (!clerkUserId) {
    throw new Error('User not authenticated');
  }

  if (!orgId) {
    throw new Error('User has no active organization. Complete onboarding first.');
  }

  const institution = await prisma.university.findUnique({
    where: { clerkOrgId: orgId },
    select: { id: true, name: true },
  });

  if (!institution) {
    throw new Error(`Institution not found for Clerk org ${orgId}`);
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: {
      id: true,
      role: true,
      universityId: true,
      institutionId: true,
      year: true,
      period: true,
    },
  });

  if (!user) {
    throw new Error('User not found in database');
  }

  const appRole = ORG_ROLE_MAP[orgRole ?? ''] || user.role;
  // Super Admin must have BOTH the Prisma role AND the Clerk org role
  const isSuperAdmin = user.role === 'SUPER_ADMIN' && orgRole === 'org:super_admin';

  return {
    userId: user.id,
    clerkUserId,
    clerkOrgId: orgId,
    institutionId: institution.id,
    institutionName: institution.name,
    orgRole: orgRole ?? 'org:member',
    appRole,
    isSuperAdmin,
    universityId: user.universityId,
    year: user.year,
    period: user.period,
  };
}

/**
 * Resolve the current user's active organization scope, or return null
 * if the user has no active organization.
 *
 * Unlike `getOrgScope()`, this does NOT throw when the user lacks an org.
 * Use this for ADMIN/SUPER_ADMIN pages where the user may not have joined
 * a Clerk organization yet (they are exempt from onboarding).
 */
export async function getOrgScopeOrNull(): Promise<OrgScope | null> {
  try {
    return await getOrgScope();
  } catch {
    return null;
  }
}

/**
 * Build a Prisma WHERE clause for scoping Course queries to the current
 * user's organization, year, and period. Use this helper in any server
 * action or page that fetches courses to ensure multi-tenant isolation.
 *
 * Example:
 *   const scope = await getOrgScope();
 *   const courses = await prisma.course.findMany({
 *     where: buildCourseScopeWhere(scope),
 *   });
 */
export function buildCourseScopeWhere(scope: OrgScope): any {
  // SUPER_ADMIN bypasses institution scoping — they can see all courses
  const where: any = {};
  if (!scope.isSuperAdmin) {
    where.institutionId = scope.institutionId;
  }
  if (scope.year != null) where.year = scope.year;
  if (scope.period) where.period = scope.period;
  return where;
}
