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
      institutionId: true,
      year: true,
      period: true,
    },
  });

  if (!user) {
    return {
      userId: '',
      role: 'GUEST',
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
 * Students get filtered by institution (via programme), year, and period.
 */
export function buildCourseScopeWhere(scope: ScopeContext) {
  if (scope.mode === 'ADMIN') {
    return {};
  }

  const where: Record<string, any> = { isPublished: true };

  // Scope by canonical institution via programme
  if (scope.institutionId) {
    where.programme = {
      institutionId: scope.institutionId,
    };
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
 * Filters by the course's programme → institution, year, and period so students
 * only see resources from their own institution's courses for their current
 * academic period.
 */
export function buildCourseResourceScopeWhere(scope: ScopeContext) {
  if (scope.mode === 'ADMIN') {
    return {};
  }

  const where: Record<string, any> = {};

  if (scope.institutionId) {
    where.course = {
      ...where.course,
      programme: {
        institutionId: scope.institutionId,
      },
    };
  }

  if (scope.year !== null && scope.year !== undefined) {
    where.course = {
      ...where.course,
      year: scope.year,
    };
  }

  if (scope.period !== null && scope.period !== undefined) {
    where.course = {
      ...where.course,
      period: scope.period,
    };
  }

  return where;
}

/**
 * Build a Prisma `where` clause for course resources using a raw user object
 * (from `getAuthUser()` or `requireAuth()`). This avoids an extra DB call since
 * the user object already contains institutionId, year, and period.
 *
 * Admins and Super Admins get an empty where clause (no filtering).
 */
export function buildCourseResourceScopeWhereFromUser(
  user: { role?: string; institutionId?: string | null; year?: number | null; period?: string | null } | null
) {
  if (!user) {
    return {};
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  if (isAdmin) {
    return {};
  }

  const where: Record<string, any> = {};

  if (user.institutionId) {
    where.course = {
      ...where.course,
      programme: {
        institutionId: user.institutionId,
      },
    };
  }

  if (user.year !== null && user.year !== undefined) {
    where.course = {
      ...where.course,
      year: user.year,
    };
  }

  if (user.period !== null && user.period !== undefined) {
    where.course = {
      ...where.course,
      period: user.period,
    };
  }

  return where;
}

/**
 * Verify that a resource (identified by its institutionId) belongs to the
 * current user's academic scope. Returns true if the user is an admin or
 * the resource's institution matches the user's institution.
 *
 * Used in IDOR protection for detail pages and write operations.
 */
export function isResourceInScope(
  scope: ScopeContext,
  resourceInstitutionId: string | null
): boolean {
  if (scope.mode === 'ADMIN') {
    return true;
  }

  // If the user has no institution set, they can't access anything scoped
  if (!scope.institutionId) {
    return false;
  }

  return resourceInstitutionId === scope.institutionId;
}

/**
 * Full-scope IDOR check: verify that a course matches the user's institution
 * (via programme), year, AND period. Use this for detail pages where the
 * course object is already loaded from the database.
 *
 * Returns true for admins, false if any scope field mismatches.
 */
export function isResourceInFullScope(
  scope: ScopeContext,
  course: { programme?: { institutionId?: string | null } | null; year?: number | null; period?: string | null } | null
): boolean {
  if (scope.mode === 'ADMIN') return true;
  if (!course) return false;
  if (scope.institutionId && course.programme?.institutionId !== scope.institutionId) return false;
  if (scope.year !== null && scope.year !== undefined && course.year !== scope.year) return false;
  if (scope.period !== null && scope.period !== undefined && course.period !== scope.period) return false;
  return true;
}

/**
 * Full-scope IDOR check using a raw user object (from `getAuthUser()`).
 * Verifies that a course matches the user's institution (via programme),
 * year, AND period.
 */
export function isResourceInFullScopeFromUser(
  user: { role?: string; institutionId?: string | null; year?: number | null; period?: string | null } | null,
  course: { programme?: { institutionId?: string | null } | null; year?: number | null; period?: string | null } | null
): boolean {
  if (!user) return false;
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  if (isAdmin) return true;
  if (!course) return false;
  if (user.institutionId && course.programme?.institutionId !== user.institutionId) return false;
  if (user.year !== null && user.year !== undefined && course.year !== user.year) return false;
  if (user.period !== null && user.period !== undefined && course.period !== user.period) return false;
  return true;
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
