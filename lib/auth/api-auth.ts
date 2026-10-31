import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Authenticate the current Clerk user and return their Prisma user record.
 * Returns a 401 JSON response if not authenticated — safe for API routes.
 * Unlike requireAuth() which redirects, this is designed for API handlers.
 */
export async function requireApiAuth(): Promise<NextResponse | { userId: string; user: any }> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    // User exists in Clerk but not in Prisma yet. Return 401 rather than
    // creating a user as a side effect of an API call. The webhook will
    // provision the user record idempotently.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return { userId: user.id, user };
}

/**
 * Authenticate and verify the user has one of the allowed roles.
 * Returns 401 if not authenticated, 403 if authenticated but wrong role.
 */
export async function requireApiRole(
  allowedRoles: string[]
): Promise<NextResponse | { userId: string; user: any }> {
  const result = await requireApiAuth();
  if (result instanceof NextResponse) return result;

  if (!allowedRoles.includes(result.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return result;
}

/**
 * Verify that the authenticated user owns or has access to a resource.
 * The resource must have a createdBy field matching the user's clerkId,
 * or the user must be ADMIN/SUPER_ADMIN within the same institution.
 * ADMIN users are scoped to their own institution — they cannot access
 * resources from other institutions.
 */
export function requireResourceOwnership(
  user: any,
  resourceCreatedBy: string,
  resourceInstitutionId?: string | null
): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  // ADMIN is scoped to their institution
  if (user.role === 'ADMIN') {
    if (resourceInstitutionId && user.institutionId && resourceInstitutionId !== user.institutionId) {
      return false;
    }
    return true;
  }
  return user.clerkId === resourceCreatedBy;
}

/**
 * Verify that the authenticated user has access to a resource based on
 * ownership, assignment, or academic scope. Checks:
 * 1. Resource ownership (createdBy)
 * 2. Institution scope for ADMIN/SUPER_ADMIN
 * 3. Course assignment for TUTOR/LECTURER
 */
export function requireResourceAccess(
  user: any,
  resource: any,
  options?: {
    checkOwnership?: boolean;
    checkInstitutionScope?: boolean;
    checkCourseAssignment?: boolean;
  }
): boolean {
  const {
    checkOwnership = true,
    checkInstitutionScope = true,
    checkCourseAssignment = false,
  } = options || {};

  // SUPER_ADMIN has access to everything
  if (user.role === 'SUPER_ADMIN') return true;

  // ADMIN scoped to their institution
  if (user.role === 'ADMIN' && checkInstitutionScope) {
    const resourceInstId = resource.institutionId || resource.course?.institutionId;
    if (resourceInstId && user.institutionId && resourceInstId !== user.institutionId) {
      return false;
    }
    return true;
  }

  // Check ownership
  if (checkOwnership && resource.createdBy === user.clerkId) return true;

  // Check course assignment for TUTOR/LECTURER
  if (checkCourseAssignment && (user.role === 'TUTOR' || user.role === 'LECTURER')) {
    if (resource.courseId && user.assignedCourseIds?.includes(resource.courseId)) {
      return true;
    }
  }

  return false;
}
