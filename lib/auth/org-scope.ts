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
  universityId: string | null;
  year: number | null;
  period: string | null;
}

/**
 * Maps Clerk organization roles to application role enum values.
 */
const ORG_ROLE_MAP: Record<string, string> = {
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

  const institution = await prisma.institution.findUnique({
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

  return {
    userId: user.id,
    clerkUserId,
    clerkOrgId: orgId,
    institutionId: institution.id,
    institutionName: institution.name,
    orgRole: orgRole ?? 'org:member',
    appRole,
    universityId: user.universityId,
    year: user.year,
    period: user.period,
  };
}
