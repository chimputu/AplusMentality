---
sessionId: session-261025-171810-1pct

---

### ✓ Step 1: Create lecturer layout, dashboard page, and navigation

### ✓ Step 2: Create lecturer content management pages

### ✓ Step 3: Create lecturer grades and enrollments pages

### ✓ Lecturer Dashboard (all steps complete)

# Phase 1 — Multi-Tenant Architecture: Schema & Role Scope

## Phase 1 Steps

### ✓ Step 1: Create `lib/auth/org-scope.ts` with `getOrgScope()`

### ✓ Step 2: Verify Prisma schema supports org scoping

### ✓ Step 3: Verify `TutorApplication` model has all required fields

### ✓ Phase 1 Complete — Ready for Phase 2

# Phase 2 — Role Elevation Flow (Tutor Application Approval + Clerk API Sync)

## Phase 2 Steps

### ✓ Step 1: Add `updateUserClerkOrgRole()` to `lib/clerk-org.ts`

### ✓ Step 2: Fix `approveTutorApplication()` to sync Clerk org role to `org:tutor`

### ! Step 3: Fix Clerk webhook role sync (incomplete - needs review)

### ✓ Phase 2 Complete — Ready for Phase 3

# Phase 3 — Middleware and Route Protection

## Phase 3 Steps

### ✓ Step 1: Create `middleware.ts` for Clerk auth + org role-based route protection

### ✓ Step 2: Create `lib/auth/tenant-isolation.ts` with IDOR protection helpers

### ✓ Step 3: Verify middleware works with existing layout auth

### ✓ Phase 3 Complete — Ready for Phase 4

# Phase 4 — UI (OrganizationSwitcher) and Verification Tests

## Phase 4 Steps

### ✓ Step 1: Add Clerk OrganizationSwitcher to DashboardLayout sidebar

### ✓ Step 2: Create verification tests for role-based access control

### ✓ Phase 4 Complete — Multi-Tenant Architecture Done

# Role UI/UX Fixes

## Role UI/UX Steps

### ✓ Step 1: Fix Turbopack build error (not a code issue — build output shows `spawn EPERM` permission error)

### ✓ Step 2: Fix role label in DashboardLayout to show actual role (Admin, Tutor, Lecturer, Student)

### ✓ Step 3: Fix username default from "Student" to "User"

### ✓ Role UI/UX Fixes Complete

## Requirements

### Overview & Goals

When an admin approves a tutor application, the system must:
1. Update Prisma: application status → APPROVED, user role → TUTOR
2. Sync Clerk: update the user's org membership role from `org:member` to `org:tutor`
3. If Clerk API fails, the Prisma changes still commit (Clerk sync is best-effort, logged for retry)

### Current Bug

`approveTutorApplication()` in `lib/actions/tutor-application.ts` adds the user to the Clerk org as `'org:member'` instead of `'org:tutor'`. This means approved tutors don't get tutor privileges via Clerk's org role system.

### Proposed Changes

#### 1. Add `updateUserClerkOrgRole()` to `lib/clerk-org.ts`

New function that calls `PATCH /v1/organizations/{org_id}/memberships/{user_id}` to update an existing member's role. Handles 404 (not a member) by falling back to `addUserToClerkOrg()`.

#### 2. Fix `approveTutorApplication()` in `lib/actions/tutor-application.ts`

Change the Clerk org sync from `'org:member'` to `'org:tutor'`. Use `updateUserClerkOrgRole()` to handle both new and existing members.

### Files Modified

| File | Change |
|------|--------|
| `lib/clerk-org.ts` | Add `updateUserClerkOrgRole()` function |
| `lib/actions/tutor-application.ts` | Fix approve action to use `'org:tutor'` role |

## Requirements

### Overview & Goals

Build the foundation for **multi-tenant data isolation** using Clerk Organizations. Each university gets its own Clerk Organization. Users belong to organizations with roles (`org:admin`, `org:tutor`, `org:lecturer`, `org:member`). Data is strictly isolated — University A cannot see University B's data.

**Phase 1 deliverables:**
1. `getOrgScope()` — unified auth helper that reads Clerk's active org, maps org role to app role, and returns a scope object.
2. Confirm the Prisma schema already supports org scoping (it does — no schema changes needed).
3. Confirm `TutorApplication` has all required fields (it does — no changes needed).

### Scope

**In Scope:**
- Create `getOrgScope()` in `lib/auth/org-scope.ts` — reads Clerk's active org from `auth()`, maps org role to app role, returns `OrgScope`.
- Confirm the Prisma schema already supports org scoping (no schema changes needed).
- Confirm `TutorApplication` has all required fields (no changes needed).

**Out of Scope:**
- Phase 2: Role elevation flow (Tutor application approval + Clerk API sync).
- Phase 3: Middleware and route protection.
- Phase 4: UI (OrganizationSwitcher) and Playwright tests.
- Modifying existing resource models — they already chain to `Institution.clerkOrgId`.

### User Stories

- As a student, I want to be required to join a university organization before accessing the dashboard.
- As an admin, I want to approve tutor applications and have the user's Clerk org role updated automatically.
- As a tutor, I want my org role to determine what pages I can access.
- As a user belonging to multiple universities, I want to switch organizations and see different data.

### Functional Requirements

1. **`getOrgScope()`** — Returns the user's active org context (org ID, institution ID, org role, app role, user fields). Throws if no active org.
2. **Org role mapping** — `org:admin` → `ADMIN`, `org:tutor` → `TUTOR`, `org:lecturer` → `LECTURER`, `org:member` → `STUDENT`.
3. **No-org protection** — Users without an active org cannot access the dashboard. They should be redirected to onboarding.

# Technical Design

### Current Implementation

**Existing org infrastructure:**

| File | What it does |
|------|-------------|
| `prisma/schema.prisma` | `User` has `clerkOrgId`, `clerkOrgRole`; `Institution` has `clerkOrgId` (unique); `OrganizationMembership` tracks memberships with roles |
| `lib/auth/scope.ts` | `getScopeContext()` — returns university/year/period scope. **No org awareness.** |
| `lib/auth.ts` | `requireAuth()` — checks user's Prisma role. **Does not check org membership.** |
| `lib/clerk-org.ts` | `addUserToClerkOrg()`, `removeUserFromClerkOrg()`, `createClerkOrg()` — Clerk API helpers |
| `lib/orgs/lookup.ts` | `getInstitutionByClerkOrgId()`, `getUserOrganizations()`, `isUserMemberOfOrg()`, `getUserOrgRole()` |
| `app/api/webhooks/clerk/route.ts` | Handles all org webhook events (created, updated, deleted, membership created/updated/deleted) |

**Schema already supports multi-tenancy:**
- `Institution.clerkOrgId` (unique) — links each institution to exactly one Clerk org
- `OrganizationMembership` — tracks user→org memberships with `role`, `status`, `clerkOrgSlug`
- `User.clerkOrgId` / `User.clerkOrgRole` — per-user active org fields
- `TutorApplication` — has `id`, `userId` (unique), `institutionId`, `status` (PENDING/UNDER_REVIEW/APPROVED/REJECTED/WITHDRAWN), `adminNotes`, `rejectionReason`
- Resource models chain to institution: `Course.universityId` → `University`/`Institution`, `Video.courseId` → `Course`, etc.

### Key Decisions

1. **No new `Organization` model** — The `Institution` model already serves as the Organization model via `clerkOrgId`. No separate model is needed. `Institution` IS the tenant.

2. **`getOrgScope()` uses Clerk's `auth()`** — Clerk's `auth()` returns `orgId` and `orgRole` for the user's *active* organization (the one they switched to via `OrganizationSwitcher`). This is the source of truth for the current tenant context.

3. **Org role maps to app role** — Clerk org roles (`org:admin`, `org:tutor`, `org:lecturer`, `org:member`) map to Prisma `Role` enum values. The mapped role is used for authorization. If the org role doesn't match a known mapping, fall back to the user's Prisma `role`.

4. **`getOrgScope()` throws if no org** — Users without an active org are not onboarded. They should be redirected to onboarding, not allowed to access the dashboard. This is enforced by throwing an error.

5. **Resource scoping via existing `institutionId` chain** — Resources already have `universityId`/`institutionId`. The `getOrgScope()` returns `institutionId` for the user's active org. Queries can scope by this `institutionId`. No schema changes needed.

### Proposed Changes

#### 1. Create `lib/auth/org-scope.ts`

**New file** with:
- `OrgScope` interface — contains `userId`, `clerkUserId`, `clerkOrgId`, `institutionId`, `institutionName`, `orgRole`, `appRole`, `universityId`, `year`, `period`
- `ORG_ROLE_MAP` — maps Clerk org roles to app roles
- `getOrgScope()` — reads `auth()`, finds institution by `clerkOrgId`, finds user by `clerkId`, maps role, returns `OrgScope`
- Throws if: no `clerkUserId`, no `orgId`, institution not found, user not found

```typescript
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

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

const ORG_ROLE_MAP: Record<string, string> = {
  'org:admin': 'ADMIN',
  'org:tutor': 'TUTOR',
  'org:lecturer': 'LECTURER',
  'org:member': 'STUDENT',
};

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
```

#### 2. Prisma Schema — No Changes Needed

The schema already has everything required:
- ✅ `User.organizationId` — exists as `User.clerkOrgId`
- ✅ `Organization` model — `Institution` serves this role via `clerkOrgId`
- ✅ `Course`, `Video`, `Assignment` scoped to org — via `universityId`/`institutionId` chain
- ✅ `TutorApplication` — exists with `id`, `userId`, `institutionId`, `status`, `adminNotes`, `rejectionReason`

#### 3. `TutorApplication` — No Changes Needed

The model already has all required fields:
- `id`, `userId` (unique), `institutionId`
- `status` (PENDING, UNDER_REVIEW, APPROVED, REJECTED, WITHDRAWN)
- `adminNotes`, `rejectionReason`
- Relations to `User` and `Institution`

### Architecture Diagram

```mermaid
graph LR
  A[User logs in] --> B[Clerk auth()]
  B --> C{Has orgId?}
  C -->|No| D[Throw: not onboarded]
  C -->|Yes| E[getOrgScope()]
  E --> F[Find Institution by clerkOrgId]
  F --> G[Find User by clerkId]
  G --> H[Map orgRole to appRole]
  H --> I[Return OrgScope]
  I --> J[Scope all queries by institutionId]
```

### File Structure

| File | Action | Description |
|------|--------|-------------|
| `lib/auth/org-scope.ts` | **Create** | `getOrgScope()`, `OrgScope` interface, role mapping |
| `prisma/schema.prisma` | **No changes** | Schema already supports org scoping |
| `lib/auth/scope.ts` | **No changes** | Existing `getScopeContext()` remains for backward compat |

### Data Models / Contracts

**OrgScope interface:**
```typescript
interface OrgScope {
  userId: string;              // Prisma user.id
  clerkUserId: string;         // Clerk user.id
  clerkOrgId: string;          // Active Clerk org.id
  institutionId: string;       // Prisma Institution.id (the tenant)
  institutionName: string;     // Human-readable name
  orgRole: string;             // Clerk org role
  appRole: string;             // Mapped app role (ADMIN, STUDENT, etc.)
  universityId: string | null; // Legacy universityId if set
  year: number | null;
  period: string | null;
}
```

**Org role mapping:**
```typescript
const ORG_ROLE_MAP = {
  'org:admin': 'ADMIN',
  'org:tutor': 'TUTOR',
  'org:lecturer': 'LECTURER',
  'org:member': 'STUDENT',
};
```

# Testing

### Validation Approach

After implementing `getOrgScope()`, verify the following scenarios.

### Key Scenarios

1. **Authenticated user with active org**: `getOrgScope()` returns correct `institutionId`, `appRole`, and user fields.
2. **Authenticated user without org**: `getOrgScope()` throws "no active organization" error.
3. **Unauthenticated user**: `getOrgScope()` throws "not authenticated" error.
4. **Org role mapping**: `org:admin` maps to `ADMIN`, `org:member` maps to `STUDENT`, etc.
5. **Institution not linked**: If `clerkOrgId` doesn't match any institution, throw error.
6. **User not in database**: If Clerk user has no Prisma record, throw error.

### Edge Cases

- **User belongs to multiple orgs**: Clerk's `auth()` returns the active (switched) org. `getOrgScope()` uses that.
- **User's Prisma role differs from org role**: Org role takes precedence via mapping. If org role is unknown, fall back to Prisma role.
- **Institution exists but `clerkOrgId` is null**: `findUnique` returns null, error is thrown.
- **Webhook hasn't synced membership yet**: `OrganizationMembership` might not exist, but `getOrgScope()` uses Clerk's `auth()` directly — no dependency on the membership table.

### Schema Verification

- Run `npx prisma validate` to confirm the schema is valid.
- Verify `TutorApplication` has all required fields.
- Confirm `Institution.clerkOrgId` is unique (it is).