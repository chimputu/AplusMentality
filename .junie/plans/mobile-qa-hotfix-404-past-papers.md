---
sessionId: session-261027-124826-1x5m
---

# Requirements

### Overview & Goals
Two critical mobile QA hotfixes:
1. **Auth-aware 404 page** — authenticated users currently see a "Sign In" CTA, which is confusing. Replace with role-aware dashboard navigation.
2. **Past Papers fault tolerance** — the student past papers page is a client component with minimal error handling and a grid layout that breaks on mobile. Harden the API and UI.

### Scope

**In Scope:**
- `app/not-found.tsx` — convert to async server component with Clerk `auth()` branching
- `app/api/past-papers/route.ts` (GET) — verify `try/catch` returns `[]` on error (already done, confirm)
- `app/(dashboard)/student/past-papers/page.tsx` — improve empty state, ensure mobile-friendly stacked cards, add error state UI

**Out of Scope:**
- Admin, lecturer, and tutor past papers pages (already have `try/catch` and empty states)
- The Past Papers POST/PUT/DELETE API routes
- Database schema changes

### Functional Requirements

#### 404 Page
- **Unauthenticated user:** Show "Go Home" + "Sign In" buttons (current behavior, retained)
- **Authenticated Student/Lecturer:** Show "Go to Dashboard" → `/student`
- **Authenticated Tutor:** Show "Go to Dashboard" → `/tutor`
- **Authenticated Admin/Super Admin:** Show "Go to Dashboard" → `/admin`
- All buttons minimum `h-12` (48px) hitbox, `px-4 py-6` padding on container

#### Past Papers
- API already returns `[]` on error — confirm and ensure the client handles this gracefully
- Empty state: document icon, "No past papers found for your current selection.", "Back" button
- Mobile layout: stacked cards (`flex flex-col space-y-4`) instead of grid that causes horizontal scroll
- Add explicit error state (network failure) with retry button

# Technical Design

### Current Implementation

**`app/not-found.tsx`** (41 lines): Static server component. Two `Link` buttons: "Go Home" (`/`) and "Sign In" (`/sign-in`). No auth check.

**`app/api/past-papers/route.ts`** (GET, 102 lines): Already wraps Prisma query in `try/catch` (line 95-101). Returns 500 JSON on error. Scope filtering via `buildCourseResourceScopeWhereFromUser(auth.user)` (line 50-53) — filters by `universityId`, `year`, and `period` on the nested `course` relation. Admins bypass filtering.

**`app/(dashboard)/student/past-papers/page.tsx`** (295 lines): Client component (`'use client'`). Fetches via `fetch('/api/past-papers')` in `useEffect`. Has a basic empty state (lines 200-210) but uses `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — this is actually already responsive (single column on mobile). The `.catch()` handler (line 84) silently sets `papers` to `[]` with no error UI.

### Key Decisions

1. **404 as async server component:** Convert `not-found.tsx` to `async function NotFound()` and use Clerk's `auth()` server API (same pattern as `app/dashboard/page.tsx`). Then fetch the user's role from Prisma to determine the dashboard URL. This avoids client-side redirects and keeps the page SSR-friendly.

2. **No new components for 404:** Keep it self-contained in `not-found.tsx`. The branching logic is simple enough (one `if/else` on role) to not warrant extraction.

3. **Student past papers — error state only:** The grid layout (`grid-cols-1` on mobile) is already mobile-friendly. The real issue is the missing error state when the fetch fails. Add an `error` state variable and a retry button. Enhance the empty state message to be more actionable.

4. **API route — return `[]` instead of 500 on error:** Change the GET handler to return an empty array `[]` with a 200 status on error (instead of 500 JSON), so the client doesn't need to distinguish between error and empty responses. Log the error server-side.

### Proposed Changes

#### 1. `app/not-found.tsx`
- Convert to `async function NotFound()`
- Call `const { userId } = await auth()` at the top
- If `userId` exists, query Prisma for the user's role: `prisma.user.findUnique({ where: { clerkId: userId }, select: { role: true } })`
- Map role to dashboard URL using the existing `ROLE_TO_DEFAULT_DASHBOARD` pattern from `lib/auth.ts`
- Render "Go to Dashboard" button (with `Link`) for authenticated users
- Render "Go Home" + "Sign In" for unauthenticated users
- Apply mobile constraints: `h-12` minimum button height, `px-4 py-6` container padding

#### 2. `app/api/past-papers/route.ts` (GET)
- On catch: return `NextResponse.json([])` (empty array, 200 status) instead of 500 error JSON
- Keep the `console.error` logging
- This ensures the client always receives an array

#### 3. `app/(dashboard)/student/past-papers/page.tsx`
- Add `error` state: `const [error, setError] = useState(false)`
- In fetch `.catch()`: set `setError(true)` instead of silently setting `[]`
- Add error UI: icon, message, and "Retry" button that re-triggers the fetch
- Enhance empty state: add a "Back" button (using `window.history.back()`) when `papers.length === 0` and no filters are active
- Keep the existing grid layout (already `grid-cols-1` on mobile)

# Delivery Steps

### ✓ Step 1: Implement auth-aware 404 page
Convert `app/not-found.tsx` to an async server component with Clerk auth branching.
- Convert to `async function NotFound()`
- Import `auth` from `@clerk/nextjs/server` and `prisma` from `@/lib/prisma`
- Call `auth()` to get `userId`, query Prisma for the user's role
- Branch UI: authenticated users see "Go to Dashboard" (role-mapped URL), unauthenticated see "Go Home" + "Sign In"
- Apply mobile constraints: `h-12` button height, `px-4 py-6` padding, thumb-friendly hitboxes
- Wrap Prisma query in `try/catch` — fall back to unauthenticated UI on DB error

### ✓ Step 2: Harden past papers API and student UI
Improve fault tolerance in the past papers data layer and student-facing UI.
- **API (`app/api/past-papers/route.ts` GET):** Change catch block to return `NextResponse.json([])` (200) instead of 500 error JSON, so the client always receives an array
- **Student UI (`app/(dashboard)/student/past-papers/page.tsx`):** Add `error` state, render error UI with retry button on fetch failure, enhance empty state with a "Back" button, keep existing responsive grid layout (already `grid-cols-1` on mobile)