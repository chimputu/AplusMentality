---
sessionId: session-261026-113201-pz9y
---

# Diagnosis & Requirements

## Diagnosis: Why Period Filtering Fails

### Root Cause
The `buildCourseResourceScopeWhere` function in `lib/auth/scope.ts` only filters by `universityId`. It does **not** include `year` or `period` in the Prisma `where` clause. This means a student in Semester 1 can see all materials from all semesters and years at their university.

### Additional Vulnerabilities Found

1. **`/api/lecture-slides/route.ts`** — uses `buildCourseResourceScopeWhere` which only scopes by `universityId`. Missing `year` and `period`.
2. **`/api/past-papers/route.ts`** — **no scope filtering at all**. Any authenticated user can see all past papers from all universities.
3. **`/api/videos/route.ts`** — **no scope filtering at all**. Same problem.
4. **`/api/tests/route.ts`** — **no scope filtering at all**. Same problem.
5. **Detail pages** (`[id]/route.ts`) — IDOR protection only checks `universityId` via `isResourceInScope()`, not `year` or `period`. A Semester 1 student can access Semester 2 materials by URL.
6. **Upload validation** — `LectureSlideForm.tsx` has period selection, but the backend POST handler in `/api/lecture-slides/route.ts` does not validate that the tutor is uploading to a course matching their own scope.

### Requirements

#### R1: Fix `buildCourseResourceScopeWhere`
Extend it to also filter by `year` and `period` through the nested `course` relation, matching the user's academic scope.

#### R2: Fix `isResourceInScope`
Extend it to also verify `year` and `period` match, not just `universityId`.

#### R3: Apply Scope Filtering to All Material API Routes
- `/api/lecture-slides/route.ts` — already uses scope, but scope is incomplete (fixed by R1)
- `/api/past-papers/route.ts` — add scope filtering
- `/api/videos/route.ts` — add scope filtering
- `/api/tests/route.ts` — add scope filtering

#### R4: Secure Detail Pages (IDOR)
Update all `[id]/route.ts` files to check `year` and `period` in addition to `universityId`.

#### R5: Secure Upload Logic
Validate that tutors upload to courses matching their scope (orgId, programmeId, year, period).

#### R6: UI Empty States
Ensure student pages show "No materials found for this period" when filtered results are empty.

# Technical Design

## Current Implementation

### Scope System (`lib/auth/scope.ts`)
- `getScopeContext()` correctly retrieves `year` and `period` from the `User` model (lines 57-58)
- `buildCourseScopeWhere()` correctly filters by `year` and `period` for Course queries (lines 107-113)
- `buildCourseResourceScopeWhere()` only filters by `universityId` via `course.universityId` (lines 125-138) — **this is the bug**
- `isResourceInScope()` only compares `universityId` (lines 148-161) — **this is the IDOR gap**

### Data Model
- `User` has `year` (Int?) and `period` (String?) fields
- `Course` has `year` (Int?), `period` (String?), `universityId` (String?), and `programmeId` (String?)
- Materials (LectureSlide, PastPaper, Video, Test, etc.) link to `Course` via `courseId`

### API Routes Affected
| Route | Scope Filtering | IDOR Protection |
|-------|----------------|------------------|
| `/api/lecture-slides/route.ts` | universityId only | universityId only |
| `/api/lecture-slides/[id]/route.ts` | — | universityId only |
| `/api/past-papers/route.ts` | **none** | universityId only |
| `/api/past-papers/[id]/route.ts` | — | universityId only |
| `/api/videos/route.ts` | **none** | universityId only |
| `/api/videos/[id]/route.ts` | — | universityId only |
| `/api/tests/route.ts` | **none** | not checked |

## Proposed Changes

### 1. Update `buildCourseResourceScopeWhere` in `lib/auth/scope.ts`
Add `year` and `period` to the nested `course` filter:
```ts
if (scope.universityId) {
  where.course = { ...where.course, universityId: scope.universityId };
}
if (scope.year !== null && scope.year !== undefined) {
  where.course = { ...where.course, year: scope.year };
}
if (scope.period !== null && scope.period !== undefined) {
  where.course = { ...where.course, period: scope.period };
}
```

### 2. Update `isResourceInScope` in `lib/auth/scope.ts`
Add a new function `isResourceInFullScope` that checks `universityId`, `year`, and `period` from the course:
```ts
export function isResourceInFullScope(
  scope: ScopeContext,
  course: { universityId?: string | null; year?: number | null; period?: string | null } | null
): boolean {
  if (scope.mode === 'ADMIN') return true;
  if (!course) return false;
  if (scope.universityId && course.universityId !== scope.universityId) return false;
  if (scope.year !== null && scope.year !== undefined && course.year !== scope.year) return false;
  if (scope.period !== null && scope.period !== undefined && course.period !== scope.period) return false;
  return true;
}
```

### 3. Apply Scope to All Material List Routes
Add `getScopeContext()` + `buildCourseResourceScopeWhere()` to:
- `/api/past-papers/route.ts`
- `/api/videos/route.ts`
- `/api/tests/route.ts`

### 4. Update Detail Pages
Replace `isResourceInScope(scope, course?.universityId)` with `isResourceInFullScope(scope, course)` in all `[id]/route.ts` files.

### 5. Secure Upload POST Handlers
In `/api/lecture-slides/route.ts` POST and similar routes, validate the tutor's scope matches the target course before creating.

### 6. UI Empty States
The student pages already have empty states. The fix to scope filtering will naturally cause them to show "No materials" when a period has no content. Update the message to say "No materials found for this period".

# Delivery Steps

### ✓ Step 1: Fix scope.ts — add year/period filtering
Update `lib/auth/scope.ts` to enforce full academic scoping on all material queries and IDOR checks.
- Update `buildCourseResourceScopeWhere` to include `year` and `period` in the nested `course` where clause
- Add `isResourceInFullScope` function that checks `universityId`, `year`, and `period` from the course object
- Keep backward compatibility — existing callers of `isResourceInScope` still work, new callers use `isResourceInFullScope`

### ✓ Step 2: Secure material list API routes
Add scope filtering to all material list endpoints that currently lack it.
- `/api/past-papers/route.ts` GET: add `getScopeContext()` + `buildCourseResourceScopeWhere()` filtering for non-admin users
- `/api/videos/route.ts` GET: add same scope filtering
- `/api/tests/route.ts` GET: add same scope filtering
- `/api/lecture-slides/route.ts` GET: already uses scope, benefits automatically from the scope.ts fix

### ✓ Step 3: Secure material detail pages (IDOR)
Update all material detail endpoints to use full scope checking.
- `/api/lecture-slides/[id]/route.ts` GET: replace `isResourceInScope` with `isResourceInFullScope`, fetch course with `year` and `period` fields
- `/api/past-papers/[id]/route.ts` GET: same change
- `/api/videos/[id]/route.ts` GET: same change — currently uses manual university check, replace with `isResourceInFullScope`
- `/api/tests/[id]/route.ts` GET: had NO IDOR protection, now added full scope check
- Return 403 Forbidden when a user's year or period doesn't match the material's course

### ✓ Step 4: Secure upload POST handlers
Validate tutor scope on material creation.
- `/api/lecture-slides/route.ts` POST: after resolving the course, verify the course's `universityId`, `year`, and `period` match the tutor's scope (unless ADMIN)
- `/api/past-papers/route.ts` POST: same validation
- `/api/videos/route.ts` POST: same validation — also switched from `requireAuth` to `getAuthUser` to access the full user object
- `/api/tests/route.ts` POST: same validation — also switched from `requireAuth` to `getAuthUser`
- Return 403 if the tutor is not authorized to upload to that course's scope

### ✓ Step 5: Update UI empty states
Improve the empty state messages on student material pages to reflect period-aware filtering.
- `/student/lecture-slides/page.tsx`: update empty state text to "No lecture slides for your current period"
- `/student/past-papers/page.tsx`: update empty state text to "No past papers for your current period"
- `/student/videos/page.tsx` (if exists): same treatment
- Messages should distinguish between "no materials at all" vs "no materials for this period"