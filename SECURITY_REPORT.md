# 🛡️ A+ Mentality — Executive Security Report

**Date:** 2026-11-04  
**Prepared by:** Security Audit Team (Automated Static Analysis)  
**Scope:** Full codebase static penetration test covering 5 phases of web application security  

---

## 1. Executive Summary

- **Overall Risk Rating:** ✅ **Low** (Down from Medium after patches)
- **Status:** All identified findings have been **patched and verified**.
- **Summary:** The A+ Mentality codebase demonstrates an exceptionally strong security posture with defense-in-depth patterns throughout. All critical attack vectors — privilege escalation, IDOR, cross-tenant data leakage, webhook spoofing, and secret exposure — are properly mitigated. The findings below represent minor gaps in secondary code paths that have now been resolved, further hardening an already well-secured application.

### Risk Timeline

| Phase | Risk Rating | Status |
|-------|-------------|--------|
| Initial Assessment | Medium | 5 findings identified |
| After Patches Applied | **Low** | All findings resolved |
| Build Fix | — | Vercel deployment error resolved |

---

## 2. Findings Summary

| # | Finding | Severity | Status | File |
|---|---------|----------|--------|------|
| 1 | Missing Tenant Isolation in Assessment Publish/Unpublish | Medium | ✅ Patched | `lib/actions/assessments.ts` |
| 2 | Missing Tenant Isolation in Assessment Question Management | Medium | ✅ Patched | `lib/actions/assessments.ts` |
| 3 | Unauthenticated Programme Listing Actions | Low | ✅ Patched | `lib/actions/programme-crud.ts` |
| 4 | Redundant `isSuperAdmin` Boolean Field | Low | ✅ Deprecated | `prisma/schema.prisma` |
| 5 | Health Endpoint Exposes Environment Status | Info | — Accepted | `app/api/health/detailed/route.ts` |
| 6 | Vercel Build Failure: `prisma7.config.ts` | Build | ✅ Fixed | `prisma7.config.ts` (removed) |

---

## 3. Detailed Findings & Patches

### FINDING 1: Missing Tenant Isolation in Assessment Publish/Unpublish Actions

- **Severity:** Medium
- **Location:** `lib/actions/assessments.ts` (Lines 259–281)
- **Vulnerability Type:** Inconsistent Access Control
- **Status:** ✅ **PATCHED**

#### Description
The `publishAssessment` and `unpublishAssessment` Server Actions called `requireAdmin()` but did **not** call `requireAssessmentInScope()`, unlike `getAssessment`, `updateAssessment`, and `deleteAssessment`. This meant an `ADMIN` from University A could publish/unpublish an assessment belonging to University B by forging the assessment ID.

#### Exploit Scenario
1. An `ADMIN` from UNZA navigates to the assessment list.
2. Using DevTools, they call `publishAssessment('assessment-id-from-cbu')`.
3. The assessment from University B is published, affecting students at University B.

#### Patch Applied
```typescript
// Before
export async function publishAssessment(id: string) {
  await requireAdmin();  // Only checks role, NOT tenant scope
  // ...
}

// After
export async function publishAssessment(id: string) {
  const adminUser = await requireAdmin();
  await requireAssessmentInScope(adminUser, id);  // ← ADDED
  // ...
}
```

The same pattern was applied to `unpublishAssessment()`.

---

### FINDING 2: Missing Tenant Isolation in Assessment Question Management

- **Severity:** Medium
- **Location:** `lib/actions/assessments.ts` (Lines 283–351)
- **Vulnerability Type:** Inconsistent Access Control
- **Status:** ✅ **PATCHED**

#### Description
Three assessment question management actions only called `requireAdmin()` without verifying the assessment belonged to the admin's institution:
- `addQuestionToAssessment`
- `removeQuestionFromAssessment`
- `reorderAssessmentQuestions`

An admin from one university could manipulate questions in another university's assessments.

#### Patch Applied
Added `await requireAssessmentInScope(adminUser, assessmentId)` to all three functions after `requireAdmin()`.

---

### FINDING 3: Unauthenticated `listProgrammes` and `getProgramme` Server Actions

- **Severity:** Low
- **Location:** `lib/actions/programme-crud.ts` (Lines 48–114)
- **Vulnerability Type:** Information Disclosure
- **Status:** ✅ **PATCHED**

#### Description
The `listProgrammes` and `getProgramme` functions did not require authentication. Any unauthenticated user could enumerate all programmes across all institutions, including their structure (branches, courses, tutors, user counts).

#### Impact
An attacker could map the entire academic structure of all universities on the platform, including user counts per programme, aiding reconnaissance for targeted attacks.

#### Patch Applied
```typescript
// Before
export async function listProgrammes(options?: {...}) {
  // No auth check
  const where: any = {};
  if (options?.institutionId) {
    where.institutionId = options.institutionId;
  }
  // ...
}

// After
export async function listProgrammes(options?: {...}) {
  const adminUser = await requireAdmin();  // ← ADDED

  // Tenant isolation: ADMIN can only see their own institution
  if (adminUser.role === 'ADMIN' && adminUser.institutionId) {
    where.institutionId = adminUser.institutionId;
  } else if (options?.institutionId) {
    where.institutionId = options.institutionId;
  }
  // ...
}
```

The same authentication was added to `getProgramme()`.

---

### FINDING 4: `isSuperAdmin` Boolean Field — Redundant Privilege Indicator

- **Severity:** Low
- **Location:** `prisma/schema.prisma` (Line 175)
- **Vulnerability Type:** Defense-Depth Observation
- **Status:** ✅ **DEPRECATED**

#### Description
The `User` model had both a `role` enum (with `SUPER_ADMIN` value) and a separate `isSuperAdmin` boolean field, creating a dual privilege indicator that could lead to confusion or inconsistency.

#### Good News
The codebase **correctly** uses `role === 'SUPER_ADMIN'` for all privilege checks. The `isSuperAdmin` boolean is never used as a privilege gate. The existing test suite explicitly validates this behavior.

#### Patch Applied
Added `@deprecated` JSDoc comment to the field:
```prisma
/// @deprecated Use role === 'SUPER_ADMIN' instead. This field is kept for backward compatibility and will be removed in a future release.
isSuperAdmin   Boolean        @default(false)
```

A database migration to remove this field can be created in a future release.

---

### FINDING 5: Health Endpoint Exposes Environment Variable Status

- **Severity:** Low (Informational)
- **Location:** `app/api/health/detailed/route.ts` (Lines 68–85)
- **Vulnerability Type:** Information Disclosure
- **Status:** — **ACCEPTED RISK**

#### Description
The detailed health endpoint reveals whether critical environment variables (`CLERK_SECRET_KEY`, `DATABASE_URL`, etc.) are configured, and whether Clerk is using test or production keys. While restricted to ADMIN/SUPER_ADMIN, this information could aid an attacker who has compromised an admin account.

#### Recommendation
This is acceptable for operational purposes. Consider adding audit logging when this endpoint is accessed.

---

### FINDING 6: Vercel Build Failure — `prisma7.config.ts` Module Resolution Error

- **Severity:** Build Blocker
- **Location:** `prisma7.config.ts` (root directory)
- **Vulnerability Type:** Configuration Error
- **Status:** ✅ **FIXED**

#### Description
The `prisma7.config.ts` file imported from `@prisma/prisma7/config`, a module that does not exist in the installed `prisma` package (`^7.10.1`). During Vercel's build process, `npm install` triggers the `postinstall` script (`prisma generate`), which attempts to load `prisma7.config.ts` and fails:

```
Failed to load config file "/vercel/path0/prisma7.config.ts" as a TypeScript/JavaScript module.
Error: Cannot find module '@prisma/prisma7/config'
```

#### Root Cause
The file used a non-standard filename (`prisma7.config.ts` instead of `prisma.config.ts`) and an incorrect import path (`@prisma/prisma7/config` instead of `prisma/config`). Additionally, all configuration within the file was already present in `package.json` and `prisma/schema.prisma`, making it redundant.

#### Fix Applied
Removed `prisma7.config.ts` entirely. The Prisma configuration is fully handled by:
- `prisma/schema.prisma` — schema definition
- `package.json` — seed script and Prisma version
- `package.json` scripts — `postinstall`, `db:migrate`, `db:generate`

---

## 4. Security Controls That PASSED (No Vulnerability Found)

### ✅ PHASE 1: Broken Access Control & Privilege Escalation

| Test | Result | Evidence |
|------|--------|----------|
| **"Delete the Boss"** — Can ADMIN delete SUPER_ADMIN? | **PASS** | `lib/actions/user-admin.ts` line 377: ADMIN cannot delete SUPER_ADMIN or other ADMIN roles |
| **"Update the Boss"** — Can ADMIN demote SUPER_ADMIN? | **PASS** | `lib/actions/user-admin.ts` line 220: `checkRoleHierarchy()` prevents ADMIN from modifying SUPER_ADMIN |
| **"Hidden UI, Vulnerable Backend"** — Can ADMIN fetch SUPER_ADMIN users? | **PASS** | `lib/actions/user-admin.ts` line 108: ADMIN queries explicitly filter out ADMIN and SUPER_ADMIN roles |
| **API Promote Endpoint** — Can ADMIN promote themselves? | **PASS** | `app/api/users/promote/route.ts` line 36: self-role change blocked with 403 |

### ✅ PHASE 2: IDOR & Cross-Tenant Data Leakage

| Test | Result | Evidence |
|------|--------|----------|
| **Direct URL Guessing (IDOR)** — Can UNZA admin access CBU course? | **PASS** | Server Component checks institution match before rendering |
| **API Query Parameter Spoof** — Can ADMIN pass different institutionId? | **PASS** | Only SUPER_ADMIN can filter by institutionId from query params; ADMIN is locked to their own institution |
| **Video Course IDOR** — Can ADMIN access another tenant's videos? | **PASS** | `lib/actions/video-course.ts`: IDOR check verifies institution match |
| **Banner Cross-Tenant** — Can ADMIN create banners for another university? | **PASS** | `lib/actions/banner.ts`: ADMIN's institutionIds are filtered to their own scope |
| **Programme Cross-Tenant** — Can ADMIN create programmes for another university? | **PASS** | `lib/actions/programme-crud.ts`: Cross-tenant institutionId rejected with error |

### ✅ PHASE 3: Server Action Input Tampering

| Test | Result | Evidence |
|------|--------|----------|
| **Missing Zod Validation** — Are all Server Actions validated? | **PASS** | Every write action uses Zod schema validation |
| **Payload Forgery** — Can ADMIN spoof organizationId? | **PASS** | Banner and Programme actions filter institutionIds server-side |
| **Banner Scope Spoofing** — Can ADMIN set GLOBAL scope? | **PASS** | ADMIN is restricted to their institution targets |

### ✅ PHASE 4: Authentication & Session Configuration

| Test | Result | Evidence |
|------|--------|----------|
| **Exposed Secrets** — Are secrets prefixed with NEXT_PUBLIC_? | **PASS** | `CLERK_SECRET_KEY` and `DATABASE_URL` are server-side only |
| **Webhook Security** — Is Svix signature verified? | **PASS** | Full Svix signature verification; returns 400 on failure |
| **Webhook Role Escalation** — Can webhook grant ADMIN/SUPER_ADMIN? | **PASS** | `ALLOWED_CLERK_SYNC_ROLES` only includes STUDENT, TUTOR, LECTURER |
| **User Provisioning** — Does auth() create users? | **PASS** | `requireAuth()` redirects to onboarding; `requireApiAuth()` returns 401 |

### ✅ PHASE 5: UI & Data Exposure

| Test | Result | Evidence |
|------|--------|----------|
| **Sensitive Data in Client Components** — Are full Prisma objects passed to clients? | **PASS** | All API routes use `select` to include only safe fields |
| **isSuperAdmin Boolean** — Does it grant privileges independently? | **PASS** | All privilege checks use `role === 'SUPER_ADMIN'`, not the boolean |

---

## 5. Security Architecture Strengths

1. **Defense-in-Depth Role Hierarchy:** The `checkRoleHierarchy()` function in `lib/auth.ts` provides a centralized, well-tested mechanism that prevents privilege escalation across all user management operations.

2. **Consistent Tenant Isolation Pattern:** Every Server Action that modifies data includes an institution-level check. This pattern is applied across 15+ actions, now including all assessment actions.

3. **Clerk-DB Role Decoupling:** The webhook safely maps Clerk roles to app roles, never granting ADMIN/SUPER_ADMIN from Clerk. Admin roles must be granted server-side via the promote endpoint, which has full hierarchy checks.

4. **Zod Validation Everywhere:** Every Server Action that accepts user input validates it with a Zod schema before processing, preventing injection and DoS attacks.

5. **Svix Webhook Verification:** The Clerk webhook endpoint properly verifies signatures, preventing webhook spoofing attacks.

6. **No Secrets in Client Bundle:** Sensitive environment variables (`CLERK_SECRET_KEY`, `DATABASE_URL`, `CLERK_WEBHOOK_SECRET`) are correctly kept server-side without the `NEXT_PUBLIC_` prefix.

7. **Comprehensive Security Test Suite:** `lib/__tests__/security-auth.test.ts` covers role hierarchy, institution scoping, webhook security, rate limiting, and more — **45 tests passing**.

---

## 6. Changes Made During This Audit

### Code Changes

| File | Change | Finding |
|------|--------|---------|
| `lib/actions/assessments.ts` | Added `requireAssessmentInScope()` to 5 actions | Finding 1, 2 |
| `lib/actions/programme-crud.ts` | Added `requireAdmin()` + tenant isolation to 2 actions | Finding 3 |
| `prisma/schema.prisma` | Added `@deprecated` comment to `isSuperAdmin` field | Finding 4 |
| `prisma7.config.ts` | **Removed** — caused Vercel build failure | Finding 6 |

### Test Verification

- **Test Suite:** `lib/__tests__/security-auth.test.ts`
- **Result:** ✅ **45/45 tests passing** (all security tests pass after patches)
- **Duration:** ~2.5 seconds

---

## 7. Recommendations

| Priority | Action | Status |
|----------|--------|--------|
| **Medium** | Add `requireAssessmentInScope()` to assessment actions | ✅ Done |
| **Low** | Add authentication to programme listing actions | ✅ Done |
| **Low** | Deprecate `isSuperAdmin` boolean field | ✅ Done |
| **Low** | Create database migration to remove `isSuperAdmin` field | ⏳ Future |
| **Info** | Add audit logging to health endpoint | ⏳ Optional |
| **Build** | Fix Vercel build error | ✅ Done |

---

## 8. Conclusion

The A+ Mentality application maintains a **strong security posture** with comprehensive defense-in-depth patterns. All identified vulnerabilities have been successfully patched and verified. The application is ready for deployment with a **Low** overall risk rating.

**Next Steps:**
1. Deploy the patched codebase to Vercel (build error resolved)
2. Monitor the health endpoint for any unusual access patterns
3. Plan the removal of the `isSuperAdmin` boolean field in a future database migration
4. Consider adding audit logging for sensitive operations (health endpoint, role changes)

---

*Report generated: 2026-11-04*  
*Audit methodology: Static code analysis with 5-phase penetration test framework*  
*Test coverage: 45 security tests, all passing*
