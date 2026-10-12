---
sessionId: session-261012-101044-40wf
---

# Diagnosis

### What's Happening

When you sign in and try to access `/admin` or `/student`, you're redirected to `/unauthorized` repeatedly. The root cause is in the authentication flow.

### Flow Analysis

1. **Home page (`app/page.tsx`)**: After sign-in, it looks up your Clerk user in the database, then redirects based on role (ADMIN → `/admin`, others → `/student`).

2. **Dashboard layouts** (`app/(dashboard)/admin/layout.tsx` and `app/(dashboard)/student/layout.tsx`): Both call `requireAuth(['ADMIN', 'SUPER_ADMIN'])` or `requireAuth(['STUDENT'])` respectively.

3. **`lib/auth.ts` (`requireAuth`)**: This is where the problem occurs. There are **7 different code paths** that redirect to `/unauthorized`:
   - Database query fails (lines 26, 55, 70, 130)
   - User not found and can't be created (lines 122, 135)
   - Role doesn't match allowed roles (lines 32, 140–141)

### Most Likely Causes

**Cause 1: Database connection failing** — The Prisma Data Proxy connection (`db.prisma.io`) may be down or misconfigured. When `prisma.user.findUnique()` throws, the `catch` block redirects to `/unauthorized` immediately.

**Cause 2: User record missing or wrong role** — Your Clerk account exists, but the corresponding database `User` record either doesn't exist or has a role that doesn't match the dashboard you're trying to access. For example, if your role is `STUDENT` in the database, you'll be blocked from `/admin` (which requires ADMIN/SUPER_ADMIN), and if your role is `ADMIN`, you'll be blocked from `/student`.

**Cause 3: Role mismatch loop** — If your database role is something unexpected (e.g., `LECTURER`, `TUTOR`, or the default `STUDENT`), neither `/admin` nor `/student` will accept you if the roles don't align.

### Key Files
- `lib/auth.ts` — `requireAuth()` function with all redirect logic
- `app/(dashboard)/admin/layout.tsx` — requires ADMIN or SUPER_ADMIN role
- `app/(dashboard)/student/layout.tsx` — requires STUDENT role
- `app/page.tsx` — home page that redirects logged-in users
- `app/unauthorized/page.tsx` — the "Access Denied" page
- `lib/prisma.ts` — Prisma client initialization (Data Proxy vs direct)

# Delivery Steps

### ✓ Step 1: Diagnose root cause - check database connectivity and user records
Run diagnostic commands to identify the exact cause of the redirect loop.
- Test database connectivity: run a simple Prisma query to verify the Prisma Data Proxy connection works.
- Query your user record: use Prisma Studio or a direct query to check if your Clerk userId exists in the `User` table and what role is assigned.
- Check server logs for error messages from `requireAuth` (e.g., `[requireAuth] Failed to find user:`).
- Identify whether the issue is: (a) database unreachable, (b) missing user record, or (c) wrong role assigned.

**Result**: Root cause found — `lib/prisma.ts` was passing the `postgres://` DATABASE_URL as `accelerateUrl`, but Prisma 7 requires `prisma://` or `prisma+postgres://` protocol. Every DB query in `requireAuth` failed, triggering the catch block redirect to `/unauthorized`. Fixed by using `@prisma/adapter-pg` for all standard TCP connections.

### ✓ Step 2: Fix the root cause and improve error handling in requireAuth
Apply the fix based on the diagnosis and make the auth flow more resilient.
- **If database is unreachable**: Verify `DATABASE_URL` in `.env`, ensure the Prisma Data Proxy connection string is valid and active.
- **If user record is missing**: Create or update the user record with the correct role via Prisma Studio or a script.
- **If role is wrong**: Update the user's role in the database to match the expected dashboard (e.g., `ADMIN` for admin access).
- Improve `lib/auth.ts`: Add better logging before each `redirect('/unauthorized')` so the exact reason is visible in server logs (e.g., log the user's actual role vs. required roles).
- Update `app/unauthorized/page.tsx` to show a more helpful message with debugging info instead of a generic "Access Denied".

**Result**: Fixed `lib/prisma.ts` to use `@prisma/adapter-pg` for all standard PostgreSQL TCP connections (including `pooled.db.prisma.io`). The `accelerateUrl` mode is now only triggered for URLs starting with `prisma://` or `prisma+postgres://`. Added detailed logging to all 9 `redirect('/unauthorized')` calls in `lib/auth.ts` with reason and detail query parameters. Updated the unauthorized page to show specific error messages based on the failure reason.