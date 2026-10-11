---
sessionId: session-261011-080428-v5vw
---

# Requirements

### Overview
This plan addresses two issues:
1. **Intermittent admin page failures** — `/admin` sometimes shows "Admin page error" but works on retry after ~2 seconds (transient failure pattern).
2. **Tutor application completeness** — The approve action doesn't copy the profile photo to `User.imageUrl`, and the application window management page is missing.
3. **Tutor application submit failure** — Clicking submit on "Apply as a Tutor" shows "Failed to fetch" error.

### Root Cause Analysis
The admin page at `app/(dashboard)/admin/page.tsx` makes 5 database queries (1 in layout via `requireAuth`, 4 in the page). The Prisma client in `lib/prisma.ts`:
- Uses `@prisma/adapter-pg` but creates a **new client every request** in production (no singleton pattern — the global caching is only in `development` mode)
- Has **no connection pool tuning** in the DATABASE_URL
- Has **no retry logic** for transient errors
- The error boundary has **no auto-retry** mechanism
- There's **no loading skeleton** to provide feedback during slow loads

The tutor application submit failure is caused by:
- **Validation schema mismatch** — `grade12ResultsUrl`, `currentInstitution`, `currentProgramme` were required in the schema but optional in the form
- **No retry logic** in `submitTutorApplication` server action
- **No error handling** — database errors (missing tables, connection issues) show generic "Failed to fetch"

### Key Deliverables
- Fix Prisma singleton pattern for production
- Add retry utility for transient DB failures
- Wrap admin page data fetches with retry
- Add auto-retry to error boundary (2s delay matching observed behavior)
- Add loading skeleton for admin page
- Add health check API endpoint
- Copy profile photo to `User.imageUrl` on tutor approval
- Create application window management page
- Fix tutor application submit validation schema mismatch
- Add retry logic to submitTutorApplication
- Add proper error messages for database failures

# Technical Design

### Current Implementation

**Admin page** (`app/(dashboard)/admin/page.tsx`): Server component that fetches announcements, videos, users, and courses in parallel via `Promise.all`. Each query has individual `.catch()` but the outer `try/catch` doesn't re-throw — it silently returns empty arrays.

**Admin layout** (`app/(dashboard)/admin/layout.tsx`): Calls `requireAuth(['ADMIN', 'SUPER_ADMIN'])` which does a DB query to find/create the user.

**Prisma client** (`lib/prisma.ts`): Creates `PrismaClient` with `PrismaPg` adapter. Only caches globally in non-production environments — in production, each request gets a fresh client, causing connection churn.

**Error boundary** (`app/(dashboard)/admin/error.tsx`): Client component with manual retry button. No auto-retry.

**Tutor approval** (`lib/actions/tutor-application.ts`, line 413-476): `approveTutorApplication` updates application status and marks user as verified tutor, but does NOT copy `profilePhotoUrl` to `User.imageUrl`.

### Proposed Changes

#### 1. Fix Prisma singleton (`lib/prisma.ts`)
- Move global caching to ALL environments (not just development)
- Add connection pool settings to the adapter

#### 2. Create retry utility (`lib/retry.ts`)
- `withRetry<T>()` function with exponential backoff
- Only retries transient errors (connection, timeout, pool exhaustion)
- Prisma error codes: P1001, P1002, P1008, P1017

#### 3. Wrap admin page fetches (`app/(dashboard)/admin/page.tsx`)
- Wrap `Promise.all` data fetches with `withRetry()`
- Add proper error state rendering (not just empty arrays)

#### 4. Improve error boundary (`app/(dashboard)/admin/error.tsx`)
- Add auto-retry after 2 seconds (matches observed successful pattern)
- Add "Go home" button

#### 5. Add loading skeleton (`app/(dashboard)/admin/loading.tsx`)
- Skeleton UI matching admin page layout

#### 6. Health check API (`app/api/health/route.ts`)
- Simple GET endpoint that pings the database

#### 7. Copy profile photo on approval (`lib/actions/tutor-application.ts`)
- In `approveTutorApplication`, add `imageUrl: application.profilePhotoUrl ?? undefined` to the User update inside the transaction

#### 8. Window management page (`app/(dashboard)/admin/tutor-applications/window/page.tsx`)
- List existing application windows
- Create/edit/delete windows
- Toggle open/closed status
- Server actions for CRUD

### File Structure

**NEW FILES:**
- `lib/retry.ts` — retry utility with exponential backoff
- `app/(dashboard)/admin/loading.tsx` — skeleton loading state
- `app/api/health/route.ts` — health check endpoint
- `app/(dashboard)/admin/tutor-applications/window/page.tsx` — window management

**UPDATED FILES:**
- `lib/prisma.ts` — singleton fix + pool tuning
- `app/(dashboard)/admin/page.tsx` — retry wrapper + error state
- `app/(dashboard)/admin/error.tsx` — auto-retry
- `lib/actions/tutor-application.ts` — copy photo on approval

# Testing

### Validation Approach
1. **Prisma singleton**: Verify only one client instance exists across requests by checking logs
2. **Retry logic**: Simulate transient DB failure to verify retry works
3. **Admin page reliability**: Load `/admin` 10+ times rapidly — should always succeed
4. **Error boundary**: Force an error to verify auto-retry after 2s
5. **Loading skeleton**: Verify skeleton shows during slow loads
6. **Health check**: Test `/api/health` returns 200 with DB connected
7. **Profile photo copy**: Approve a tutor application and verify `User.imageUrl` is set
8. **Window management**: Create, edit, and delete a window

### Key Scenarios
- Admin page loads on first attempt (no error)
- Transient DB failure triggers retry, then succeeds
- Persistent failure shows error state with retry button
- Auto-retry in error boundary works after 2s
- Profile photo appears on tutor profile after approval
- Window management CRUD works correctly

### Edge Cases
- Database completely unreachable (all retries exhausted)
- Clerk auth fails during admin layout
- Profile photo URL is null on approval
- No application windows exist (empty state)

# Delivery Steps

### ✓ Step 1: Fix Prisma singleton and add retry utility
Fix the Prisma client to use a singleton pattern in production and create a retry utility for transient failures.

- Update `lib/prisma.ts` to cache the PrismaClient globally in ALL environments (not just development)
- Create `lib/retry.ts` with `withRetry<T>()` function that retries transient errors (connection pool, timeout, network) with exponential backoff (3 attempts, 500ms initial delay, 2x backoff)
- Add `isTransientError()` helper that detects Prisma codes P1001, P1002, P1008, P1017 and network errors

### ✓ Step 2: Wrap admin page with retry and add error states
Make the admin page resilient to transient failures by wrapping data fetches with retry logic and adding proper error UI.

- Update `app/(dashboard)/admin/page.tsx` to wrap `Promise.all` data fetches with `withRetry()`
- Add a proper error state UI (instead of silently returning empty arrays) when all retries fail
- Update `app/(dashboard)/admin/error.tsx` to auto-retry after 2 seconds using `useEffect` with `setTimeout`
- Create `app/(dashboard)/admin/loading.tsx` with skeleton UI matching the admin page layout (header, stat cards, content area)

### ✓ Step 3: Add health check API and copy profile photo on approval
Create a health check endpoint for monitoring and fix the tutor approval to copy the profile photo.

- Create `app/api/health/route.ts` — GET endpoint that pings the database with `SELECT 1` and returns status + latency
- Update `approveTutorApplication` in `lib/actions/tutor-application.ts` to copy `application.profilePhotoUrl` to `User.imageUrl` inside the transaction (line ~451-454)
- Verify the photo copy happens atomically with the approval

### ✓ Step 4: Create application window management page
Build the admin page for managing tutor application windows (open/close/schedule).

- Create `app/(dashboard)/admin/tutor-applications/window/page.tsx` — server component that lists existing ApplicationWindow records
- Add server actions: `createWindow`, `updateWindow`, `deleteWindow`, `toggleWindow` (or inline form actions)
- Display windows in a table with status (open/closed), dates, and edit/delete controls
- Add a "Create New Window" form with fields: institutionId (optional), opensAt, closesAt, publicMessage, isOpen
- Link from the tutor applications list page