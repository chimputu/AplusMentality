---
sessionId: session-261008-224427-1333
---

# Requirements

### Overview & Goals
Add Clerk Organization support to the A+ Mentality app as a **low-risk, additive-only** foundation. No existing behavior should change. The app must work identically after this phase.

### Scope

**In Scope:**
- Add `clerkOrgId` and `clerkOrgSlug` fields to `Institution` model
- Add `clerkOrgId` and `clerkOrgRole` fields to `User` model
- Create new `OrganizationMembership` model
- Add 6 webhook event handlers for Clerk org events
- Create read-only lookup helpers in `lib/orgs/lookup.ts`
- Create admin-only `/admin/organizations` page (SUPER_ADMIN only)
- Add "Organizations" link to admin sidebar
- Create `lib/env.ts` for environment variable validation

**Out of Scope:**
- Removing or modifying existing fields (institutionId, role stay)
- Changing existing server actions or pages
- Modifying middleware or `getScopeContext`
- Creating Clerk organizations (manual later)
- Backfilling users (Phase 11B)
- Adding `<OrganizationSwitcher />` component

### Key Constraints
- This is a **live production app** with real users
- All new fields must be nullable
- No breaking changes to existing API or UI
- Run `tsc + lint + build` after each deliverable


# Technical Design

### Current Implementation

**Prisma Schema** (`prisma/schema.prisma`):
- `Institution` model (lines 1123-1160): Has `slug` (unique), `name`, `type`, `logoUrl`, and relations to levels, periods, faculties, programmes, users, banners
- `User` model (lines 163-224): Has `clerkId` (unique), `email`, `role`, `institutionId` (nullable FK), and many relations
- No `clerkOrgId`/`clerkOrgSlug` fields exist yet
- No `OrganizationMembership` model exists

**Webhook Handler** (`app/api/webhooks/clerk/route.ts`):
- Uses `if/else` blocks (not switch) for `user.created`, `user.updated`, `user.deleted`
- Signature verification with Svix is already in place
- Returns 200 on success

**Admin Layout** (`components/DashboardLayout.tsx`):
- `adminNavItems` array defines all sidebar links
- Both ADMIN and SUPER_ADMIN see the same nav items (no per-item role filtering)
- `Building2` icon from `lucide-react` is already imported
- Nav items are grouped by `section` property

**Admin Pages** (`app/(dashboard)/admin/`):
- Pattern: Server component page fetches data, renders `PageHeader` + table component
- Example: `institutions/page.tsx` calls `listInstitutions()` action, renders `InstitutionTable`

**Prisma Client** (`lib/prisma.ts`):
- Uses `@prisma/adapter-pg` with `DATABASE_URL` from env
- No env validation exists yet

### Key Decisions

1. **Webhook handler style**: The existing handler uses `if/else` (not switch). New org handlers will follow the same `if/else` pattern for consistency.

2. **Admin page access**: The organizations page will use `requireAuth(['SUPER_ADMIN'])` in the page component. The sidebar link will be visible to all admins but the page itself enforces SUPER_ADMIN only.

3. **Orgs lookup helpers**: Placed in `lib/orgs/lookup.ts` as a new module. Not imported anywhere yet — prepared for Phase 11B.

4. **Env validation**: `lib/env.ts` using Zod schema. Imported only in `lib/prisma.ts` to trigger at startup.

### Proposed Changes

#### Deliverable 1 — Prisma Schema
- Add `clerkOrgId String? @unique` and `clerkOrgSlug String?` to `Institution`
- Add `clerkOrgId String?` and `clerkOrgRole String?` to `User`
- Add `organizationMemberships OrganizationMembership[]` relation to `User`
- Add `@@index([clerkOrgId])` to `User`
- Create `OrganizationMembership` model with all specified fields, unique constraint, and indexes
- Run migration: `npx prisma migrate dev --name add_clerk_organization_fields`

#### Deliverable 2 — Webhook Handler
- Add 6 new `if` blocks after existing handlers in `app/api/webhooks/clerk/route.ts`:
  - `organization.created` — link org to institution by slug
  - `organization.updated` — update slug
  - `organization.deleted` — nullify links, revoke memberships
  - `organizationMembership.created` — upsert membership record
  - `organizationMembership.updated` — update role
  - `organizationMembership.deleted` — revoke membership

#### Deliverable 3 — Lookup Helpers
- Create `lib/orgs/lookup.ts` with 4 functions:
  - `getInstitutionByClerkOrgId(clerkOrgId)`
  - `getUserOrganizations(userId)`
  - `isUserMemberOfOrg(userId, clerkOrgId)`
  - `getUserOrgRole(userId, clerkOrgId)`

#### Deliverable 4 — Admin Page
- Create `app/(dashboard)/admin/organizations/page.tsx`
- Server component with `requireAuth(['SUPER_ADMIN'])`
- Fetch all institutions with clerkOrg fields + count users without org memberships
- Display summary cards and a table showing linkage status
- Add nav item to `adminNavItems` in `DashboardLayout.tsx` (SUPER_ADMIN only via conditional rendering)

#### Deliverable 5 — Env Validation
- Create `lib/env.ts` with Zod schema validating required env vars
- Import at the top of `lib/prisma.ts`

#### Deliverable 6 — Verification
- Run `tsc --noEmit`, `npm run lint`, `npm run build`
- Verify migration status
- Confirm existing pages still work


# Testing

### Validation Approach
After each deliverable, run the full validation suite to ensure nothing breaks.

### Key Scenarios
1. **Schema migration**: New fields appear in Prisma Studio on Institution, User, and OrganizationMembership tables
2. **Webhook handlers**: Existing user.created/updated/deleted handlers still work (no regression)
3. **Admin page**: SUPER_ADMIN can access `/admin/organizations`; regular ADMIN gets blocked
4. **Lookup helpers**: Functions compile without errors (not called yet, but type-check)
5. **Env validation**: App starts normally with valid env vars

### Edge Cases
- Webhook fires for org with no matching institution slug → logged as warning, no error
- Membership created for unknown Clerk user → logged as warning, no error
- Organization deleted → memberships revoked, institution fields nullified
- Admin page shows correct counts when no orgs exist yet (all zeros)

### Test Changes
- No new tests required for Phase 11A (additive-only, no behavior change)
- Existing tests should pass unchanged


# Delivery Steps

###   Step 1: Deliverable 1 — Prisma Schema: Add Clerk org fields
Add nullable Clerk organization fields to the database schema and run the migration.

- Update `prisma/schema.prisma`: Add `clerkOrgId String? @unique` and `clerkOrgSlug String?` to `Institution` model
- Update `prisma/schema.prisma`: Add `clerkOrgId String?`, `clerkOrgRole String?`, and `organizationMemberships OrganizationMembership[]` relation to `User` model
- Update `prisma/schema.prisma`: Add `@@index([clerkOrgId])` to `User` model
- Create `OrganizationMembership` model with fields: id, userId, user relation, clerkOrgId, clerkOrgSlug, role, status, joinedAt, revokedAt, unique constraint, and indexes
- Run `npx prisma migrate dev --name add_clerk_organization_fields` then `npx prisma generate`
- Verify with `npx prisma migrate status`
- Run `tsc --noEmit` and `npm run lint` to confirm no type errors

###   Step 2: Deliverable 2 — Webhook Handler: Add org event handlers
Extend the Clerk webhook handler to process 6 organization-related events.

- Update `app/api/webhooks/clerk/route.ts`: Add `if` blocks for `organization.created`, `organization.updated`, `organization.deleted`, `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`
- Follow the existing `if/else` pattern (not switch) to match current code style
- Do NOT modify existing user.created/updated/deleted handlers
- Do NOT change signature verification logic
- Run `tsc --noEmit`, `npm run lint`, and `npm run build` to verify

###   Step 3: Deliverable 3 — Lookup Helpers: Create lib/orgs/lookup.ts
Create read-only database lookup functions for organization data (prepared for Phase 11B).

- Create `lib/orgs/lookup.ts` with four exported functions:
  - `getInstitutionByClerkOrgId(clerkOrgId)` — find institution by Clerk org ID
  - `getUserOrganizations(userId)` — fetch active memberships with linked institution data
  - `isUserMemberOfOrg(userId, clerkOrgId)` — check active membership
  - `getUserOrgRole(userId, clerkOrgId)` — get active membership role
- These functions are NOT imported anywhere yet
- Run `tsc --noEmit` and `npm run lint` to verify types

###   Step 4: Deliverable 4 — Admin Page: Organizations overview
Create a read-only admin page for monitoring Clerk org linkage (SUPER_ADMIN only).

- Create `app/(dashboard)/admin/organizations/page.tsx` as a server component
- Use `requireAuth(['SUPER_ADMIN'])` to restrict access
- Fetch all institutions with clerkOrg fields; count users without org memberships
- Render summary cards (total institutions, linked, not linked, users without memberships)
- Render a table: Name | Slug | Clerk Org ID | Clerk Org Slug | Status (Linked ✅ / Not linked ⚠️)
- Update `components/DashboardLayout.tsx`: Add "Organizations" nav item to `adminNavItems` with `Building2` icon, visible only to SUPER_ADMIN (add conditional filtering)
- Run `tsc --noEmit`, `npm run lint`, and `npm run build` to verify

###   Step 5: Deliverable 5 — Env Validation: Create lib/env.ts
Add environment variable validation at startup using Zod.

- Create `lib/env.ts` with Zod schema validating: DATABASE_URL, CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_WEBHOOK_SECRET, NEXT_PUBLIC_APP_URL
- Import `lib/env.ts` at the top of `lib/prisma.ts` to trigger validation at startup
- Run `tsc --noEmit`, `npm run lint`, and `npm run build` to verify

###   Step 6: Deliverable 6 — Final Verification
Run the complete validation suite and confirm everything works.

- Run `npx tsc --noEmit` — no type errors
- Run `npm run lint` — no lint errors
- Run `npm run build` — successful build
- Run `npx prisma migrate status` — schema up to date
- Report summary: migration name, fields added, models added, webhook events handled, files created/modified, any warnings