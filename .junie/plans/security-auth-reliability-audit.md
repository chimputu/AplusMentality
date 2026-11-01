---
sessionId: session-261101-104135-feu5
---

# Requirements

### Overview & Goals

Harden the authorization and institution-consolidation layers of the AplusMentality platform to eliminate ambiguous privilege paths, remove dead database artifacts, and ensure fail-closed behavior for unknown roles.

### Architecture Decisions (from user)

1. **User-facing terminology**: Institution.
2. **Canonical database model**: University (maps to the `Institution` table via `@@map("Institution")`).
3. **Keep `institutionId` naming where safe**, but it must reference the canonical University record.
4. **Do not maintain competing LegacyUniversity and University identities** — LegacyUniversity is orphaned and should be removed.
5. **Materials and assessments inherit institution scope through their course** — no direct institution reference needed on Quiz/Test/Assignment.
6. **The Prisma role is the authoritative permission source** — not the `isSuperAdmin` boolean.
7. **`isSuperAdmin` must not independently grant privileges** — it is a dead field that should be removed.
8. **Unknown, missing, or invalid roles must fail closed** — deny access rather than defaulting to a permissive role.

### In Scope

- Remove the `isSuperAdmin` boolean field from the `User` model in `prisma/schema.prisma` and create a migration.
- Remove the `LegacyUniversity` model from the schema and create a migration to drop the `University` table (the legacy database table).
- Remove `isSuperAdmin` from the `OrgScope` interface in `lib/auth/org-scope.ts` and all consumer code that references `scope.isSuperAdmin`.
- Replace all `scope.isSuperAdmin` checks with explicit `scope.appRole === 'SUPER_ADMIN'` or `scope.appRole === 'SUPER_ADMIN' || scope.appRole === 'ADMIN'` as appropriate.
- Harden `getOrgScope()` to fail closed when the role is unknown or missing.
- Add characterization tests for the security-sensitive behavior changes.
- Update existing tests to reflect the removed fields.

### Out of Scope

- Changing the Role enum values.
- Modifying Clerk integration or org role mapping logic (beyond removing the `isSuperAdmin` derivation).
- UI terminology changes beyond what is required by field removals.
- Deployment automation changes.
- Modifying the `isVerifiedTutor` field (it is separate and functional).

### Functional Requirements

1. **FR-1**: The `User.isSuperAdmin` column must no longer exist in the database or Prisma schema.
2. **FR-2**: The `LegacyUniversity` model and its underlying `University` table must no longer exist.
3. **FR-3**: All code paths that previously checked `scope.isSuperAdmin` must use `scope.appRole === 'SUPER_ADMIN'` instead.
4. **FR-4**: `getOrgScope()` must throw when a user's role cannot be resolved to a known value.
5. **FR-5**: The Prisma role (`user.role`) remains the single source of truth for all privilege decisions.

### Non-Functional Requirements

- **NFR-1**: No destructive operations against production — migrations are additive/drop-only and reversible via rollback.
- **NFR-2**: All existing tests must pass after changes.
- **NFR-3**: The production build (`next build`) must pass.
- **NFR-4**: Lint and type-check must pass.


# Technical Design

### Validation Approach

After each stage, run the following validation pipeline:
1. `pnpm test` — all unit tests pass
2. `pnpm lint` — no lint errors
3. `npx tsc --noEmit` — no type errors
4. `npx prisma validate` — schema is valid
5. `pnpm build` — production build succeeds

### Key Scenarios

1. **Super admin role check**: A user with `role = SUPER_ADMIN` can still access all admin routes, export all data, and manage banners across institutions.
2. **Admin role check**: A user with `role = ADMIN` is scoped to their own institution for all operations.
3. **Student role check**: A user with `role = STUDENT` cannot access admin routes or cross-tenant data.
4. **Unknown role**: A user with an unknown/missing role is denied access and redirected.
5. **LegacyUniversity removal**: No code path references the LegacyUniversity model after changes.
6. **isSuperAdmin removal**: No code path reads or writes the `isSuperAdmin` field after changes.

### Edge Cases

1. **User with `role = null`**: Should fail closed — `getOrgScope()` throws.
2. **User with corrupted role string**: Should fail closed — `getOrgScope()` throws.
3. **Banner operations by ADMIN on another institution's banner**: Should be denied.
4. **Export routes with no active org**: Should throw from `getOrgScope()`.
5. **Migration on empty database**: Should succeed without errors (use `DROP TABLE IF EXISTS`).

### Test Changes

- **Update**: `lib/__tests__/org-scope.test.ts` — remove `isSuperAdmin` assertions, add unknown role rejection test.
- **Add**: `lib/__tests__/security-auth.test.ts` — fail-closed role behavior test.
- **Update**: `vitest.setup.ts` — remove `isSuperAdmin` from mock user data if present.
- **Verify**: All existing tests in `lib/__tests__/` continue to pass.

# Delivery Steps

###   Step 1: Remove isSuperAdmin from schema and drop LegacyUniversity
Remove the dead `isSuperAdmin` boolean from the `User` model and drop the orphaned `LegacyUniversity` model, then generate a Prisma migration.
- Remove `isSuperAdmin Boolean @default(false)` from `User` in `prisma/schema.prisma`.
- Remove the `LegacyUniversity` model block from `prisma/schema.prisma`.
- Run `npx prisma migrate dev --name remove_is_superadmin_and_legacy_university` to generate the migration SQL.
- Run `npx prisma validate` to confirm the schema is valid.
- Run `npx prisma generate` to regenerate the client.

###   Step 2: Remove isSuperAdmin from OrgScope and harden role validation
Update `lib/auth/org-scope.ts` to remove `isSuperAdmin` from the `OrgScope` interface and `getOrgScope()` return value, and add fail-closed role validation.
- Remove `isSuperAdmin` from the `OrgScope` interface.
- Remove the `isSuperAdmin` derivation and return value from `getOrgScope()`.
- Add a validation step: if `user.role` is not a known Role enum value, throw an error.
- Update `buildCourseScopeWhere` to check `scope.appRole === 'SUPER_ADMIN'` instead of `scope.isSuperAdmin`.
- Run `pnpm test -- org-scope` to verify existing tests (they will fail — expected).
- Update `lib/__tests__/org-scope.test.ts` to remove `isSuperAdmin` assertions and add an unknown-role rejection test.
- Run `pnpm test` to confirm all tests pass.

###   Step 3: Update API routes and server actions to use role-based checks
Replace all `scope.isSuperAdmin` references in API routes and server actions with explicit `scope.appRole === 'SUPER_ADMIN'` checks.
- `app/api/export/gradebook/route.ts`: Replace `scope.isSuperAdmin` with `scope.appRole === 'SUPER_ADMIN'`.
- `app/api/export/students/route.ts`: Replace `scope.isSuperAdmin`, remove `isSuperAdmin` from the returned scope object.
- `app/api/export/tutors/route.ts`: Replace `scope.isSuperAdmin`, remove `isSuperAdmin` from the returned scope object.
- `lib/actions/banner.ts`: Replace all 5 occurrences of `scope.isSuperAdmin` with `scope.appRole === 'SUPER_ADMIN'`.
- Run `npx tsc --noEmit` to check for type errors.
- Run `pnpm test` to verify tests pass.

###   Step 4: Rename isSuperAdmin prop in banner UI components
Rename the `isSuperAdmin` prop to `canManageAllBanners` in the banner form and its consuming pages for clarity.
- `components/banner-form.tsx`: Rename `isSuperAdmin` prop to `canManageAllBanners` in the interface and usage.
- `app/(dashboard)/admin/banners/[id]/edit/page.tsx`: Rename the local variable and prop passed to `BannerForm`.
- `app/(dashboard)/admin/banners/new/page.tsx`: Same rename.
- Run `npx tsc --noEmit` to verify no type errors.
- Run `pnpm lint` to check for lint issues.

###   Step 5: Final validation: tests, lint, type-check, and build
Run the full validation pipeline to confirm all changes are correct and the project is in a healthy state.
- Run `pnpm test` — all tests pass.
- Run `pnpm lint` — no lint errors.
- Run `npx tsc --noEmit` — no type errors.
- Run `npx prisma validate` — schema is valid.
- Run `pnpm build` — production build succeeds.
- Report any remaining failures.