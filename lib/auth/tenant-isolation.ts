import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Verify that a resource belongs to the current user's active organization.
 * This is the core IDOR (Insecure Direct Object Reference) protection for
 * multi-tenant data isolation.
 *
 * Use this in API routes and server actions to ensure a user cannot access
 * resources from another university/organization.
 *
 * @param resourceUniversityId - The university/institution ID of the resource
 * @returns true if the resource belongs to the user's org, false otherwise
 * @throws if the user is not authenticated
 *
 * @example
 * // In an API route
 * const { userId } = await requireAuth();
 * const course = await prisma.course.findUnique({ where: { id: courseId } });
 * if (!await isResourceInOrg(userId, course.universityId)) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 */
export async function isResourceInOrg(
  userId: string,
  resourceUniversityId: string | null,
): Promise<boolean> {
  if (!resourceUniversityId) {
    return false;
  }

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: {
      role: true,
      universityId: true,
      institutionId: true,
    },
  });

  if (!user) {
    return false;
  }

  // Admins can access all resources
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return true;
  }

  // Check if the resource belongs to the user's university or institution
  return (
    user.universityId === resourceUniversityId ||
    user.institutionId === resourceUniversityId
  );
}

/**
 * Verify that a resource belongs to the current user's active Clerk organization.
 * This checks the Clerk orgId against the institution's clerkOrgId.
 *
 * @param resourceInstitutionId - The institution ID of the resource
 * @returns true if the resource belongs to the user's org, false otherwise
 *
 * @example
 * // In a server action
 * const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
 * if (!await isResourceInClerkOrg(institution.id)) {
 *   throw new Error('Forbidden');
 * }
 */
export async function isResourceInClerkOrg(
  resourceInstitutionId: string,
): Promise<boolean> {
  const { userId: clerkUserId, orgId } = await auth();
  if (!clerkUserId || !orgId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { role: true },
  });

  // Admins can access all resources
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    return true;
  }

  // Check if the resource's institution belongs to the user's active Clerk org
  const institution = await prisma.institution.findUnique({
    where: { id: resourceInstitutionId },
    select: { clerkOrgId: true },
  });

  if (!institution?.clerkOrgId) {
    return false;
  }

  return institution.clerkOrgId === orgId;
}

/**
 * Assert that a resource belongs to the current user's organization.
 * Throws an error if the resource is not in the user's org.
 *
 * @param resourceUniversityId - The university/institution ID of the resource
 * @throws Error if the resource is not in the user's org
 *
 * @example
 * // In a server action
 * await assertResourceInOrg(course.universityId);
 * // If this passes, the resource is in the user's org
 */
export async function assertResourceInOrg(
  resourceUniversityId: string | null,
): Promise<void> {
  const isInOrg = await isResourceInOrg(
    // userId is not needed here, it's fetched from auth()
    '' as any,
    resourceUniversityId,
  );

  if (!isInOrg) {
    throw new Error(
      'Forbidden: This resource does not belong to your organization.',
    );
  }
}

/**
 * Build a Prisma `where` clause scoped to the current user's active organization.
 * Use this in API routes to filter resources by the user's org.
 *
 * @returns A Prisma where clause that filters by the user's university/institution
 *
 * @example
 * // In an API route
 * const where = await buildOrgScopeWhere();
 * const courses = await prisma.course.findMany({ where });
 */
export async function buildOrgScopeWhere(): Promise<Record<string, any>> {
  const { userId: clerkUserId, orgId } = await auth();
  if (!clerkUserId) {
    return { IS_NOT_VALID: true }; // Will return no results
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: {
      role: true,
      universityId: true,
      institutionId: true,
    },
  });

  if (!user) {
    return { IS_NOT_VALID: true };
  }

  // Admins see everything
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return {};
  }

  // If user has an active Clerk org, scope by the institution's clerkOrgId
  if (orgId) {
    const institution = await prisma.institution.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (institution) {
      return {
        OR: [
          { universityId: institution.id },
          { institutionId: institution.id },
        ],
      };
    }
  }

  // Fallback to universityId/institutionId on the user record
  const where: Record<string, any> = [];

  if (user.universityId) {
    where.push({ universityId: user.universityId });
  }

  if (user.institutionId) {
    where.push({ institutionId: user.institutionId });
  }

  if (where.length === 0) {
    return { IS_NOT_VALID: true };
  }

  return { OR: where };
}
