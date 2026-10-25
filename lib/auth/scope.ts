import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Represents the academic scope of the current user.
 * Used to filter all data queries so students only see content for their
 * university, year, and semester.
 *
 * - `mode: 'OWN'` — the user is viewing their own university's content.
 * - `mode: 'EXPLORING'` — the user is browsing another university (read-only).
 * - `mode: 'ADMIN'` — the user is an admin with full access.
 */
export interface ScopeContext {
  userId: string;
  role: string;
  universityId: string | null;
  institutionId: string | null;
  year: number | null;
  period: string | null;
  mode: 'OWN' | 'EXPLORING' | 'ADMIN';
  readOnly: boolean;
}

/**
 * Resolve the current user's academic scope.
 *
 * Returns the user's university, year, and semester so that every
 * data-fetching function can filter by these three fields.
 *
 * Admins bypass all filtering.
 * Students without a university profile return null scope fields.
 */
export async function getScopeContext(): Promise<ScopeContext> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return {
      userId: '',
      role: 'GUEST',
      universityId: null,
      institutionId: null,
      year: null,
      period: null,
      mode: 'OWN',
      readOnly: true,
    };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
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
    return {
      userId: '',
      role: 'GUEST',
      universityId: null,
      institutionId: null,
      year: null,
      period: null,
      mode: 'OWN',
      readOnly: true,
    };
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  return {
    userId: user.id,
    role: user.role,
    universityId: user.universityId,
    institutionId: user.institutionId,
    year: user.year,
    period: user.period,
    mode: isAdmin ? 'ADMIN' : 'OWN',
    readOnly: false,
  };
}

/**
 * Build a Prisma `where` clause for Course queries scoped to the user's
 * academic context.
 *
 * Admins get an empty where clause (no filtering).
 * Students get filtered by universityId, year, and period.
 */
export function buildCourseScopeWhere(scope: ScopeContext) {
  if (scope.mode === 'ADMIN') {
    return {};
  }

  const where: Record<string, any> = { isPublished: true };

  // Prefer universityId (legacy) if set, fall back to institution via programme
  if (scope.universityId) {
    where.universityId = scope.universityId;
  }

  if (scope.year !== null && scope.year !== undefined) {
    where.year = scope.year;
  }

  if (scope.period !== null && scope.period !== undefined) {
    where.period = scope.period;
  }

  return where;
}

/**
 * Build a Prisma `where` clause for any resource that belongs to a Course
 * (LectureSlide, Quiz, Test, Assignment, PastPaper, Video).
 *
 * Filters by the course's universityId so students only see resources
 * from their own university's courses.
 */
export function buildCourseResourceScopeWhere(scope: ScopeContext) {
  if (scope.mode === 'ADMIN') {
    return {};
  }

  const where: Record<string, any> = {};

  if (scope.universityId) {
    where.course = {
      universityId: scope.universityId,
    };
  }

  return where;
}

/**
 * Verify that a resource (identified by its universityId) belongs to the
 * current user's academic scope. Returns true if the user is an admin or
 * the resource's university matches the user's university.
 *
 * Used in IDOR protection for detail pages and write operations.
 */
export function isResourceInScope(
  scope: ScopeContext,
  resourceUniversityId: string | null
): boolean {
  if (scope.mode === 'ADMIN') {
    return true;
  }

  // If the user has no university set, they can't access anything scoped
  if (!scope.universityId) {
    return false;
  }

  return resourceUniversityId === scope.universityId;
}

/**
 * Check if a write operation is allowed.
 * Throws an error if the user is in exploration mode (browsing another university).
 */
export function assertWriteAllowed(scope: ScopeContext) {
  if (scope.mode === 'ADMIN') {
    return;
  }

  if (scope.readOnly) {
    throw new Error(
      'You cannot perform this action while exploring another university.'
    );
  }
}
