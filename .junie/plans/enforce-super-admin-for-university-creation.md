---
sessionId: session-261030-023539-h9ut
---

# Requirements

### Overview & Goals
Enforce the new Clerk role hierarchy where only `org:super_admin` can create universities/institutions. The `org:admin` (University Admin) must NEVER be able to create a new university, even via API manipulation.

### Scope
**In Scope:**
- Remove the "Create Institution" page files so University Admins cannot access the creation flow
- Update the Sidebar to hide the "Institutions" nav item from `org:admin` users
- Remove the "Add Institution" button from the institutions list page
- Add a strict guard in the `createInstitution` server action that checks for `org:super_admin`
- Update role mapping utilities to recognize `org:super_admin`
- Update middleware tests to cover the new role

**Out of Scope:**
- Modifying the `updateInstitution` or `deleteInstitution` actions (those remain accessible to both ADMIN and SUPER_ADMIN)
- Changing the Clerk Dashboard configuration (already done by the user)
- Modifying the proxy.ts middleware for route-level protection (the server action guard is sufficient)

### User Stories
1. As a **Platform Super Admin** (`org:super_admin`), I want to access the Institutions page and create new universities so that I can onboard new institutions to the platform.
2. As a **University Admin** (`org:admin`), I should NOT see the Institutions link in the sidebar or the "Add Institution" button, so that I cannot accidentally or intentionally create universities.
3. As a **University Admin** (`org:admin`), if I try to call the `createInstitution` API directly, I should receive an unauthorized error.

### Acceptance Criteria
- The "Institutions" sidebar link only renders for `org:super_admin`
- The "Add Institution" button on `/admin/institutions` only renders for `org:super_admin`
- The `createInstitution` server action throws an error if called by anyone other than `org:super_admin`
- The `org:super_admin` Clerk role is properly mapped to the `SUPER_ADMIN` app role in all role mapping utilities
- Existing tests pass and new tests cover the `org:super_admin` role

# Technical Design

### Current Implementation

**Role Flow:**
- `lib/auth.ts` — `requireAuth()` checks Prisma DB roles (ADMIN/SUPER_ADMIN) for route access
- `lib/auth/org-scope.ts` — `ORG_ROLE_MAP` maps Clerk org roles to app roles; `org:admin` → `ADMIN`
- `lib/clerk-org.ts` — `APP_ROLE_TO_CLERK` maps both `ADMIN` and `SUPER_ADMIN` to `org:admin`; `CLERK_TO_APP_ROLE` maps `org:admin` → `ADMIN`
- `lib/actions/institution-crud.ts` — `requireAdmin()` checks DB roles (`ADMIN` or `SUPER_ADMIN`); `createInstitution()` calls `requireAdmin()`
- `components/DashboardLayout.tsx` — sidebar filters nav items by `roles` field (line 604); `Institutions` nav item has no role restriction; `Organizations` is restricted to `['SUPER_ADMIN']`
- `app/(dashboard)/admin/institutions/page.tsx` — server component, shows "Add Institution" button via `PageHeader` to all admins
- `app/(dashboard)/admin/institutions/new/page.tsx` — client component, calls `createInstitution()` server action

### Key Decisions

1. **Check Clerk's `orgRole` in the server action** — Instead of relying on DB roles, the `createInstitution` action will call `await auth()` and check `orgRole === 'org:super_admin'`. This is the most reliable guard since Clerk is the source of truth for org roles.

2. **Map `org:super_admin` to `SUPER_ADMIN` in role utilities** — The `ORG_ROLE_MAP` in `org-scope.ts` and `CLERK_TO_APP_ROLE` in `clerk-org.ts` need to map `org:super_admin` → `SUPER_ADMIN`. The `APP_ROLE_TO_CLERK` in `clerk-org.ts` needs to map `SUPER_ADMIN` → `org:super_admin` (currently maps to `org:admin`).

3. **Pass Clerk org role to the sidebar** — The `DashboardLayout` receives a Prisma `role` prop. Since `org:super_admin` maps to `SUPER_ADMIN` in the app role, and the sidebar already filters by `roles: ['SUPER_ADMIN']` (used by the Organizations link), the existing pattern will work once the role mappings are updated. The `Institutions` nav item will get `roles: ['SUPER_ADMIN']` added.

4. **Server-side guard on the institutions page** — The `institutions/page.tsx` is a server component that can check the role before rendering the "Add Institution" button.

### Proposed Changes

#### 1. Update Role Mappings (`lib/clerk-org.ts`)
- Update `APP_ROLE_TO_CLERK`: change `SUPER_ADMIN: 'org:admin'` to `SUPER_ADMIN: 'org:super_admin'`
- Add `org:super_admin` to the `ClerkOrgRole` type
- Update `CLERK_TO_APP_ROLE`: add `'org:super_admin': 'SUPER_ADMIN'`

#### 2. Update Org Scope (`lib/auth/org-scope.ts`)
- Add `'org:super_admin': 'SUPER_ADMIN'` to `ORG_ROLE_MAP`

#### 3. Update Server Action Guard (`lib/actions/institution-crud.ts`)
- Create a new helper `requireSuperAdmin()` that checks both DB role AND Clerk org role
- Replace `await requireAdmin()` with `await requireSuperAdmin()` in `createInstitution()` only
- Keep `requireAdmin()` for `updateInstitution`, `deleteInstitution`, and other actions

#### 4. Update Sidebar (`components/DashboardLayout.tsx`)
- Add `roles: ['SUPER_ADMIN']` to the `Institutions` nav item (line 233-238)
- This follows the existing pattern used by the `Organizations` link

#### 5. Update Institutions Page (`app/(dashboard)/admin/institutions/page.tsx`)
- Add a role check at the top of the server component
- Only render the `action` prop in `PageHeader` if the user is `SUPER_ADMIN`

#### 6. Update Tests (`lib/__tests__/middleware-roles.test.ts`)
- Add `org:super_admin` to the test role map
- Add tests for `org:super_admin` → `SUPER_ADMIN` mapping
- Add test that `org:admin` cannot access institution creation
- Add test that `org:super_admin` can access institution creation

### File Structure

**Modified files:**
- `lib/clerk-org.ts` — update role mappings
- `lib/auth/org-scope.ts` — add `org:super_admin` mapping
- `lib/actions/institution-crud.ts` — add `requireSuperAdmin()`, update `createInstitution()`
- `components/DashboardLayout.tsx` — add role restriction to Institutions nav item
- `app/(dashboard)/admin/institutions/page.tsx` — remove "Add Institution" button
- `lib/__tests__/middleware-roles.test.ts` — add tests for new role

**Deleted files:**
- `app/(dashboard)/admin/institutions/new/page.tsx` — removed the creation form page
- `app/(dashboard)/admin/institutions/_components/add-institution-button.tsx` — removed the unused button component

### Architecture Diagram

``` mermaid
graph LR
    A[User clicks Create University] --> B{Sidebar visible?}
    B -->|org:super_admin only| C[Institutions Page]
    C --> D{Add button visible?}
    D -->|SUPER_ADMIN only| E[New Institution Form]
    E --> F[createInstitution Server Action]
    F --> G{requireSuperAdmin check}
    G -->|org:super_admin| H[Create Institution]
    G -->|org:admin| I[Throw Unauthorized]
    G -->|other| I
```

### Risks
- **Breaking existing SUPER_ADMIN workflow**: If the `SUPER_ADMIN` user hasn't been assigned `org:super_admin` in Clerk yet, they won't be able to create institutions. Mitigation: ensure the Clerk Dashboard assignment is complete before deploying.
- **Role sync**: The `APP_ROLE_TO_CLERK` change means future role syncs will assign `org:super_admin` instead of `org:admin` for SUPER_ADMIN users. This is intentional but should be noted.

# Delivery Steps

### ✓ Step 1: Update role mappings and org scope
Add `org:super_admin` to all role mapping utilities so the system recognizes the new Clerk role.
- Update `lib/clerk-org.ts`: add `org:super_admin` to `ClerkOrgRole` type, map `SUPER_ADMIN` → `org:super_admin` in `APP_ROLE_TO_CLERK`, add `org:super_admin` → `SUPER_ADMIN` in `CLERK_TO_APP_ROLE`
- Update `lib/auth/org-scope.ts`: add `'org:super_admin': 'SUPER_ADMIN'` to `ORG_ROLE_MAP`
- Update `lib/__tests__/middleware-roles.test.ts`: add `org:super_admin` to the test role map and add tests for the new mapping

### ✓ Step 2: Add backend guard to createInstitution
Enforce `org:super_admin` check in the server action that creates institutions.
- In `lib/actions/institution-crud.ts`: create a new `requireSuperAdmin()` helper that calls `await auth()`, checks `orgRole === 'org:super_admin'` AND `user.role === 'SUPER_ADMIN'`, and throws "Unauthorized: Only the Platform Super Admin can create Universities." if either check fails
- Replace `await requireAdmin()` with `await requireSuperAdmin()` in `createInstitution()` only (keep `requireAdmin()` for all other actions)

### ✓ Step 3: Remove creation UI files
Remove the page files that enable the "Create University" flow so University Admins cannot access them.
- Delete `app/(dashboard)/admin/institutions/new/page.tsx` — the creation form page
- Delete `app/(dashboard)/admin/institutions/_components/add-institution-button.tsx` — the unused button component
- In `components/DashboardLayout.tsx`: add `roles: ['SUPER_ADMIN']` to the Institutions nav item (line 233-238), following the existing pattern used by the Organizations link
- In `app/(dashboard)/admin/institutions/page.tsx`: remove the "Add Institution" button and role check, leaving only the institution list