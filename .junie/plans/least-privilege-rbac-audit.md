---
sessionId: session-261101-010602-quv9
---

# Current State & Weaknesses

## Current Authorization Architecture

### Roles (from `prisma/schema.prisma`)
- `STUDENT` (default)
- `TUTOR`
- `LECTURER`
- `ADMIN`
- `SUPER_ADMIN`

### Auth Flow
1. **`lib/auth.ts`** — `requireAuth()` and `getAuthUser()` look up the Clerk user in Prisma by `clerkId`. If not found, they fall back to email lookup, then create a new user with `role: 'STUDENT'` and a temp email like `user_${Date.now()}@temp.com`.
2. **`proxy.ts`** — Clerk middleware. Public routes are allowlisted. Protected dashboard routes (`/admin`, `/super-admin`, `/tutor`, `/lecturer`, `/student`) call `/api/user/role` internally to enforce role-based redirects.
3. **`lib/auth/scope.ts`** — Academic scope helpers: `getScopeContext()`, `buildCourseScopeWhere()`, `isResourceInScope()`, `isResourceInFullScope()`, `assertWriteAllowed()`.
4. **`lib/auth/api-auth.ts`** — `requireApiAuth()` and `requireApiRole()` for API routes. Returns JSON 401/403.
5. **`lib/auth/org-scope.ts`** — Clerk org-to-institution mapping. `getOrgScope()` resolves multi-tenant scope.
6. **`lib/clerk-org.ts`** — Clerk↔Prisma role mapping. `CLERK_TO_APP_ROLE` and `APP_ROLE_TO_CLERK`.
7. **`app/api/webhooks/clerk/route.ts`** — Clerk webhook sync. Handles user create/update, org membership create/update/delete. Syncs Clerk org role to Prisma `User.role`.

### Identified Weaknesses

#### Critical
1. **`requireAuth` creates users on every read** — `lib/auth.ts` lines 52-139: creates a user with a temp email `user_${Date.now()}@temp.com` as a side effect of authentication. This is unsafe and race-prone.
2. **`isSuperAdmin` field can grant privileges** — `User.isSuperAdmin` exists in the schema (line 175) but is not consistently checked against `User.role`. Some code paths may use it independently.
3. **Clerk webhook can set any role** — `app/api/webhooks/clerk/route.ts` line 191-194: `organizationMembership.created` syncs Clerk org role directly to `User.role`. An org admin in Clerk can promote themselves to `ADMIN` in the DB.
4. **Admin promote route allows ADMIN to grant SUPER_ADMIN** — `app/api/users/promote/route.ts` line 10: only checks `['ADMIN', 'SUPER_ADMIN']`, allowing an ADMIN to promote a user to `SUPER_ADMIN`.
5. **`proxy.ts` role lookup via internal API** — `proxy.ts` line 116-119: fetches `/api/user/role` internally. If this endpoint fails, the proxy redirects to `/onboarding` rather than denying.
6. **`/api/user/role` is public** — `proxy.ts` line 21: `/api/user/role(.*)` is in the public route allowlist, meaning unauthenticated users can probe roles.
7. **`/api/users/me` is public** — `proxy.ts` line 23: `/api/users/me(.*)` is public.
8. **`/api/chat` is public** — `proxy.ts` line 18: `/api/chat(.*)` is public, allowing unauthenticated AI chat.
9. **`requireAuth` uses redirects in API context** — `lib/auth.ts` uses `redirect()` which is unsafe for API routes.
10. **`getAuthUser` creates users on read** — Same issue as `requireAuth`, lines 190-253.

#### High
11. **`admin/students` route only checks ADMIN, not SUPER_ADMIN** — `app/api/admin/students/route.ts` line 7: `getAuthUser(['ADMIN'])` excludes `SUPER_ADMIN`.
12. **`admin/students` allows cross-institution access** — No institution scoping for the ADMIN.
13. **Quiz GET returns all quizzes** — `app/api/quizzes/route.ts` line 46-85: no scope filtering for non-admin users.
14. **Test/Assignment submissions lack unique constraints** — `TestSubmission` and `AssignmentSubmission` models lack `@@unique([testId, userId])` and `@@unique([assignmentId, userId])`.
15. **`requireResourceOwnership` only checks createdBy** — `lib/auth/api-auth.ts` line 52-58: doesn't check academic scope.
16. **`buildCourseScopeWhere` in org-scope.ts uses `isSuperAdmin` boolean** — line 136: `!scope.isSuperAdmin` — relies on the boolean field.

#### Medium
17. **Existing tests are assertion-only** — `lib/__tests__/security-auth.test.ts` uses `expect(true).toBe(true)` patterns — no actual route integration tests.
18. **`package.json` has generic name** — `"my-app"` and `"0.1.0"`.
19. **`build-output.txt` tracked in repo** — should be in `.gitignore`.
20. **No `@@unique` on `TestSubmission` or `AssignmentSubmission`** for duplicate prevention.
21. **`proxy.ts` allows TUTOR to access `/lecturer`** — line 43: `'/tutor': ['TUTOR', 'LECTURER']` — TUTOR can access lecturer routes.
22. **No rate limiting on role change endpoints**.
23. **`/api/users/sync-role` endpoint** — needs review for safety.
24. **Debug and fix-user directories referenced but don't exist** — stale glob cache.

---

# Implementation Plan

### ✓ Step 1: Fix lib/auth.ts - Remove user creation on read
- Remove auto-user-creation from `requireAuth()` and `getAuthUser()`
- Make both functions fail-closed when user not found in DB
- Keep `requireAuth()` for page routes (redirects), ensure `getAuthUser()` returns null

### ✓ Step 2: Fix lib/auth/api-auth.ts - API-safe auth helpers
- Ensure `requireApiAuth()` and `requireApiRole()` return JSON 401/403
- Add `requireResourceOwnership()` with academic scope check

### ✓ Step 3: Fix proxy.ts - Route protection
- Remove `/api/user/role` from public routes
- Remove `/api/users/me` from public routes
- Remove `/api/chat` from public routes (or add auth)
- Fix TUTOR/LECTURER route separation
- Make role lookup failures deny access, not redirect to onboarding

### ✓ Step 4: Fix Clerk webhook - Role escalation prevention
- Prevent Clerk org role from directly setting ADMIN/SUPER_ADMIN
- Only allow STUDENT/TUTOR/LECTURER from Clerk, require server-side approval for ADMIN/SUPER_ADMIN

### ✓ Step 5: Fix admin promote route - SUPER_ADMIN protection
- Prevent ADMIN from granting SUPER_ADMIN
- Only SUPER_ADMIN can promote to SUPER_ADMIN

### ✓ Step 6: Fix proxy.ts role dashboard access
- `/admin`: ADMIN or SUPER_ADMIN only
- `/super-admin`: SUPER_ADMIN only
- `/tutor`: TUTOR only
- `/lecturer`: LECTURER only
- `/student`: STUDENT only

### ✓ Step 7: Fix quiz API - Scope filtering
- Add scope filtering to GET /api/quizzes
- Prevent students from seeing all quizzes

### ✓ Step 8: Fix admin/students API - Include SUPER_ADMIN
- Add SUPER_ADMIN to allowed roles
- Add institution scoping

### ✓ Step 9: Fix isSuperAdmin usage - Rely on role only
- Search and fix all usages of `isSuperAdmin` boolean field
- Ensure `user.role === 'SUPER_ADMIN'` is the only check

### ✓ Step 10: Add database unique constraints
- Add `@@unique` constraints for submissions
- Create safe migration

### ✓ Step 11: Fix /api/chat - Add authentication
- Chat remains public for landing page with rate limiting

### ✓ Step 12: Fix /api/users/sync-role - Safety review
- Ensure only authorized roles can sync

### ✓ Step 13: Fix package.json and .gitignore
- Update package name and version
- Add build-output.txt to .gitignore

###  Step 14: Add tests
- Replace assertion-only tests with real integration tests

### ! Step 15: Verification
- Run lint, type-check, tests, and build
- BLOCKED: Node.js not available in terminal environment — cannot run verification commands
