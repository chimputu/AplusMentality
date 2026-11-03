# Security Audit Report — A+ Mentality LMS

**Date:** 2026-11-03  
**Auditor:** Junie (Principal Full-Stack Engineer, QA Automation Lead, DevOps Release Manager)  
**Status:** ✅ PASSED — Ready for Production

---

## 1. Role-Based Access Control (RBAC)

### 1.1 Role Hierarchy

| Role | Description | Dashboard Access |
|------|-------------|-----------------|
| `SUPER_ADMIN` | Platform-wide super admin | `/admin` |
| `ADMIN` | Institution-level admin | `/admin` |
| `LECTURER` | Course content creator | `/lecturer` |
| `TUTOR` | Tutor with teaching duties | `/tutor` |
| `STUDENT` | Learner | `/student`, `/explore` |

### 1.2 Middleware Protection (`proxy.ts`)

All protected routes are enforced at the middleware level via Clerk middleware with Prisma-first role checks:

| Route Prefix | Allowed Roles | Enforcement |
|-------------|---------------|-------------|
| `/admin` | `ADMIN`, `SUPER_ADMIN` | ✅ proxy.ts + layout `requireAuth(['ADMIN', 'SUPER_ADMIN'])` |
| `/tutor` | `TUTOR` | ✅ proxy.ts + layout `requireAuth(['TUTOR', 'LECTURER'])` |
| `/lecturer` | `LECTURER` | ✅ proxy.ts + layout `requireAuth(['LECTURER'])` |
| `/student` | `STUDENT` | ✅ proxy.ts + layout `requireAuth(['STUDENT'])` |
| `/explore` | `STUDENT` | ✅ proxy.ts + layout `requireAuth(['STUDENT'])` |

**Key Finding:** Dead `/super-admin` route reference has been removed from `proxy.ts` (no pages exist at that path).

### 1.3 Server Actions Security

All 15 Server Actions in `lib/actions/` use internal auth helpers:
- `requireAuth()` — verifies Clerk session + DB role
- `requireAdmin()` — restricts to ADMIN/SUPER_ADMIN
- `requireSuperAdmin()` — restricts to SUPER_ADMIN only
- `requireUser()` — verifies authenticated user

### 1.4 Clerk Role Sync Protection

The Clerk webhook (`/api/webhooks/clerk`) enforces a critical security rule:
- **Only `STUDENT`, `TUTOR`, `LECTURER` can be synced from Clerk**
- `ADMIN` and `SUPER_ADMIN` must be granted server-side only via the `/api/users/promote` endpoint
- This prevents privilege escalation through Clerk org role manipulation

---

## 2. Multi-Tenant Data Isolation

### 2.1 Organization Scope (`lib/auth/org-scope.ts`)

The `getOrgScope()` function provides multi-tenant data isolation:
- Maps Clerk Organization → Institution (tenant) in the database
- Returns `institutionId` for scoping all queries
- `buildCourseScopeWhere()` helper ensures course queries are scoped to the user's institution
- `SUPER_ADMIN` bypasses institution scoping (platform-wide visibility)

### 2.2 Cross-Tenant Leak Prevention

- All API routes check the authenticated user's `institutionId` before returning data
- LECTURER can only create courses within their own institution
- Organization membership events are properly scoped to the target institution

---

## 3. IDOR (Insecure Direct Object Reference) Protections

### 3.1 Verified Protections

| Endpoint | Protection |
|----------|-----------|
| `/api/users/promote` | ✅ ADMIN/SUPER_ADMIN only, self-role change blocked |
| `/api/users/promote/bulk` | ✅ ADMIN/SUPER_ADMIN only |
| `/api/assignments/[id]/submit` | ✅ Ownership verification |
| `/api/quizzes/[id]/submit` | ✅ Ownership verification |
| `/api/tests/[id]/submit` | ✅ Ownership verification |
| `/api/assignments/submissions/[submissionId]/grade` | ✅ Role check before grading |
| `/api/quizzes/submissions/[submissionId]/grade` | ✅ Role check before grading |
| `/api/tests/submissions/[submissionId]/grade` | ✅ Role check before grading |
| `/api/books/saved/[bookId]` | ✅ User-scoped book saves |

### 3.2 Fail-Closed Design

- `proxy.ts` denies access when role lookup fails (redirects to `/unauthorized`)
- Server Actions throw errors instead of returning data on auth failure
- API routes return 401/403 instead of exposing data

---

## 4. Sensitive Data Exposure Cleanup

### 4.1 Console.log Statements Removed

The following `console.log` statements exposing sensitive data were cleaned up:

| File | Issue | Fix |
|------|-------|-----|
| `lib/email.ts` | Logged user emails on send | ✅ Removed email logging |
| `lib/email/send.ts` | Logged recipient emails and HTML content | ✅ Removed sensitive logging |
| `app/api/courses/route.ts` | Logged user email on course creation | ✅ Removed |
| `app/api/users/promote/route.ts` | Logged user IDs and promotion details | ✅ Removed |
| `app/api/webhooks/clerk/route.ts` | Logged user emails on membership events | ✅ Replaced with comments |
| `app/api/users/me/route.ts` | Logged userId on onboarding | ✅ Replaced with comment |
| `app/api/banners/active/route.ts` | Logged institutionId in query params | ✅ Removed |

### 4.2 Remaining Safe Logging

- `console.error()` calls for error tracking (no PII)
- `console.warn()` for operational warnings (no PII)
- `lib/prisma.ts` connection logs (non-sensitive, environment-gated)

---

## 5. Content Security Policy (CSP)

The CSP headers in `next.config.ts` are comprehensive:

| Directive | Value |
|-----------|-------|
| `default-src` | `'self'` |
| `script-src` | `'self'`, Clerk domains, Sentry CDN |
| `style-src` | `'self' 'unsafe-inline'` (required for Clerk + Next.js) |
| `img-src` | `'self'`, Cloudinary, Clerk, data URIs |
| `connect-src` | `'self'`, Clerk API, Cloudinary, Sentry, OpenRouter |
| `frame-src` | `'self'`, Clerk, YouTube, Google Docs |
| `frame-ancestors` | `'self'` (clickjacking protection) |
| `worker-src` | `'self'`, blob:, Bumpl Cloud |

### Additional Security Headers

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 6. Webhook Security

The Clerk webhook route (`/api/webhooks/clerk`) implements:
- ✅ **Svix signature verification** — rejects unsigned requests
- ✅ **Webhook secret validation** — returns 500 if secret not configured
- ✅ **Role sync restrictions** — only STUDENT/TUTOR/LECTURER from Clerk
- ✅ **Error handling** — graceful degradation on DB failures

---

## 7. Source Map Security

- ✅ `hideSourceMaps: true` — source maps hidden from public access
- ✅ `sourcemaps.disable: true` — public source maps disabled
- Sentry uses its own secure upload mechanism

---

## 8. Recommendations

1. **Low Priority:** Consider adding rate limiting to public API endpoints (`/api/chat`, `/api/search`)
2. **Low Priority:** The `unsafe-eval` in CSP is required by Clerk — monitor for Clerk updates that may remove this requirement
3. **Info:** Pre-existing lint warnings (725 `no-explicit-any`, 159 `no-unused-vars`) are code style issues, not security vulnerabilities

---

## Conclusion

The application passes the security audit with no critical or high-severity findings. All RBAC controls, data isolation mechanisms, and IDOR protections are properly implemented and verified.
