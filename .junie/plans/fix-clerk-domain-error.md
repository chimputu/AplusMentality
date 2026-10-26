---
sessionId: session-261026-114602-7sms
---

# Secure Student Onboarding: Lock Institution + Hide OrganizationSwitcher

## Problem

Students can freely select any university during onboarding, including universities they don't belong to. Additionally, the Clerk `OrganizationSwitcher` in the dashboard sidebar allows students to create new organizations and switch between organizations, which should only be available to admins.

## Investigation Findings

### Onboarding Form (`app/onboarding/_components/onboarding-form.tsx`)
- Shows **all** institutions and universities in a single dropdown (`allSchools` array, lines 87-90).
- Any student can pick any institution — no filtering or restrictions.
- On submit, sends `institutionId` or `universityId` to `PATCH /api/users/me` (line 115).
- After onboarding, the student's `onboarded` flag is set to `true`.

### Onboarding Page (`app/onboarding/page.tsx`)
- Fetches all active institutions and all universities from the database.
- No filtering by role, email domain, or invite code.
- Redirects already-onboarded users to their dashboard.

### API Endpoint (`app/api/users/me/route.ts`)
- `PATCH` handler accepts `institutionId`, `universityId`, `programmeId`, `branchId`, `year`, `period`, `onboarded`, and `role` from the request body.
- **No server-side validation** — accepts any `institutionId` without checking if the student is eligible.
- A student could use a tool like Postman to change their institution to any university.

### Dashboard Layout (`components/DashboardLayout.tsx`)
- `OrganizationSwitcher` is shown to **all roles** (line 1132).
- Currently has `hidePersonal={true}` but no `createOrganizationMode` restriction.
- Students can create new Clerk organizations and switch between them.

### Existing Infrastructure
- `scripts/migrate-unboarded-users.ts` has an email domain → institution mapping (not used for onboarding, only for migration).
- `User` model has `onboarded` boolean field — once true, the user is considered fully onboarded.
- `Role` enum: `ADMIN`, `SUPER_ADMIN`, `STUDENT`, `LECTURER`, `TUTOR`.

## Proposed Changes

### Approach: Free Selection + Lock After

Students pick their university freely during onboarding (fast, no friction). Once onboarded, they **cannot change** their institution without admin help. The `OrganizationSwitcher` is hidden for students.

### Stage 1: Hide OrganizationSwitcher for Students

**File: `components/DashboardLayout.tsx`**

- Wrap the `OrganizationSwitcher` (line 1127-1141) in a role check: only render when `role` is `ADMIN` or `SUPER_ADMIN`.
- Students will never see the organization switcher or be able to create organizations from the UI.

```tsx
// Only show to admins
{(role === 'ADMIN' || role === 'SUPER_ADMIN') && !isCollapsed && (
  <div className="px-3 py-3 border-b border-border">
    ...
  </div>
)}
```

### Stage 2: Lock Institution After Onboarding

**File: `app/api/users/me/route.ts`**

- In the `PATCH` handler, add a server-side check: if the user is already `onboarded=true` and their role is `STUDENT`, reject any attempt to change `institutionId`, `universityId`, `programmeId`, or `branchId`.
- Admins and SUPER_ADMINs can still update these fields (for fixing mistakes).

```typescript
// Block students from changing institution after onboarding
if (user.onboarded && user.role === 'STUDENT') {
  const blockedFields = ['institutionId', 'universityId', 'programmeId', 'branchId'];
  for (const field of blockedFields) {
    if (body[field] !== undefined) {
      return NextResponse.json(
        { error: `Cannot change ${field} after onboarding. Contact an admin to update your institution.` },
        { status: 403 }
      );
    }
  }
}
```

### Stage 3: Block role self-elevation

**File: `app/api/users/me/route.ts`**

- Students should not be able to change their own `role` via the API. Remove or guard the `role` field update so only admins can change roles.

```typescript
// Only admins can change roles
if (body.role !== undefined && user.role !== 'SUPER_ADMIN') {
  return NextResponse.json(
    { error: 'Only super admins can change user roles.' },
    { status: 403 }
  );
}
```

## Architecture Diagram

``` mermaid
graph LR
  A[Student Signs Up] --> B[Onboarding Page]
  B --> C[Selects University Freely]
  C --> D[PATCH /api/users/me]
  D --> E{Already Onboarded?}
  E -->|No| F[Save institution, set onboarded=true]
  E -->|Yes| G[Reject: 403 Forbidden]
  F --> H[Redirect to /student]
  H --> I[Dashboard: No OrganizationSwitcher]
```

## Risks

- **Student picks wrong university**: They cannot self-correct. They must contact an admin. This is intentional — it prevents abuse. Admins can use the existing `PATCH /api/users/me` endpoint (since the check only blocks STUDENT role) or a database update to fix it.
- **Existing onboarded students**: The lock only applies to new PATCH requests. Students already onboarded are unaffected until they try to change their institution.

# Delivery Steps

### ✓ Step 1: Diagnose and provide Clerk Dashboard fix instructions
Review the investigation findings and provide the user with exact steps to fix the domain issue in the Clerk Dashboard and Vercel environment variables. The codebase is clean — no code changes are needed.

### ✓ Step 2: Verify .env.example reflects correct production configuration
Confirm that `.env.example` already contains the correct production Clerk keys (pk_live_/sk_live_) and the correct NEXT_PUBLIC_SITE_URL. No changes needed — the file is already correct at lines 21-23 and line 73.

### ✓ Step 3: Add error handling to `app/page.tsx` for Clerk auth
Wrap the `auth()` call in a try/catch so the page renders for anonymous users when Clerk fails, instead of crashing with a 500 error.

### ✓ Step 4: Provide Vercel environment variable checklist and redeploy instructions
Give the user the exact steps to update Vercel environment variables to test keys and redeploy without build cache.

### ✓ Step 5: Hide OrganizationSwitcher for students in DashboardLayout
Wrap the Clerk `OrganizationSwitcher` in `components/DashboardLayout.tsx` with a role check so only ADMIN and SUPER_ADMIN roles can see and use it. Students are locked to their assigned institution.

### ✓ Step 6: Lock institution after onboarding in PATCH /api/users/me
Add server-side validation in `app/api/users/me/route.ts` to reject attempts by onboarded STUDENT users to change their `institutionId`, `universityId`, `programmeId`, or `branchId`. Also block students from changing their own role.

### ✓ Step 7: Add custom error pages (404, 500, unauthorized)
Create app-level error pages so visitors never see the default Next.js error screen.
- Create `app/not-found.tsx` — a styled 404 page with a link back to the home page.
- Create `app/global-error.tsx` — a styled 500 error page with a retry button.
- Create `app/(dashboard)/unauthorized/page.tsx` — an access-denied page for blocked routes.

### ✓ Step 8: Create admin change request approval page
Build `/admin/change-requests` page so admins can review, approve, and reject student institution change requests.
- Create `app/(dashboard)/admin/change-requests/page.tsx` — fetches all InstitutionChangeRequests with user and institution details.
- Create `app/api/institution-change-request/admin/route.ts` — GET lists all requests (admin-only), PATCH approves/rejects a single request and updates the student's institution on approval.
- On approval: update the student's `institutionId`, `programmeId`, `year`, and `period` fields in the User record.
- Add 'Change Requests' nav item to `components/DashboardLayout.tsx` admin nav (after 'Users').

### ✓ Step 9: Enhance admin user management with search and filters
Improve the existing `/admin/users` page and `UserManagement` component with full search, role/institution filters, and inline editing.
- Update `app/(dashboard)/admin/users/page.tsx` to include institution data in the user query.
- Enhance `components/UserManagement.tsx`: add institution filter dropdown, real-time search by name/email, and an edit modal for updating user institution/role directly.
- Add server-side search support in `app/api/users/route.ts` (GET with query params for search, role filter, institution filter).

### ✓ Step 10: Complete lecturer course and quiz management
Give lecturers the ability to create and manage their own courses and quizzes from the lecturer dashboard.
- Create `app/(dashboard)/lecturer/courses/new/page.tsx` — a course creation form (title, code, description, institution, programme).
- Create `app/api/lecturer/courses/route.ts` — POST endpoint for lecturer course creation (auth: LECTURER role only).
- Create `app/(dashboard)/lecturer/quizzes/new/page.tsx` — a quiz creation form with question builder.
- Create `app/api/lecturer/quizzes/route.ts` — POST endpoint for lecturer quiz creation.
- Update lecturer course page 'New Course' button to link to `/lecturer/courses/new` instead of `/admin/courses/new`.

### ✓ Step 11: Add notification triggers for key events
Wire up the existing notification system so students receive in-app notifications when events occur.
- Create `lib/notifications.ts` — a utility function `createNotification(userId, type, title, description)` that inserts into the Notification model.
- Add notification trigger in `app/api/institution-change-request/admin/route.ts` — when a request is approved/rejected, create a notification for the student.
- Add notification trigger in `app/api/announcements/route.ts` — when a new announcement is created, notify all students.
- Add notification trigger in `app/api/assignments/route.ts` — when an assignment is published, notify enrolled students.
- Update the `NotificationBell` component to poll for new notifications every 30 seconds.

### ✓ Step 12: Add search functionality for students
Create a search page so students can find courses, past papers, lecture slides, and videos.
- Create `app/search/page.tsx` — a public search page that accepts `?q=` query param.
- Create `app/api/search/route.ts` — searches across courses, past papers, lecture slides, videos, and announcements.
- Add 'Search' nav item to the student sidebar in `components/DashboardLayout.tsx`.
- Make the search page public in `proxy.ts` by adding `/search` to `publicRoutePatterns`.

### ✓ Step 13: Add loading skeletons and empty states
Improve UX by adding loading states and empty states across key pages.
- Create `components/ui/LoadingSkeleton.tsx` — reusable skeleton components (card, table row, list item).
- Add empty states to: student courses page, student past papers, student videos, lecturer dashboard, and admin change requests page.
- Add loading skeletons to pages that fetch data on the client side (use React Suspense or conditional rendering).

### ✓ Step 14: Add analytics dashboard for admins
Create an analytics page for admins to view platform statistics.
- Create `app/(dashboard)/admin/analytics/page.tsx` — displays charts and stats for users, enrollments, assessments, and activity.
- Create `app/api/analytics/route.ts` — aggregates data: total users by role, active institutions, course enrollment counts, recent activity feed.
- Use simple bar/line charts with inline SVG or a lightweight chart library.
- Add 'Analytics' nav item to the admin sidebar in `components/DashboardLayout.tsx`.

### ✓ Step 15: Add rate limiting and mobile responsiveness polish
Final polish: add rate limiting on key API endpoints and improve mobile responsiveness.
- Create `lib/rate-limit.ts` — a simple in-memory rate limiter (requests per minute per user ID).
- Apply rate limiting to: `/api/institution-change-request`, `/api/users/me`, and sign-in/sign-up endpoints.
- Audit and fix mobile responsiveness in: `DashboardLayout` sidebar (ensure it collapses properly), student profile page, and admin change requests page.
- Add ARIA labels to interactive elements in the notification bell and sidebar navigation.

## Known Limitations

### 1. Admin approval UI for institution change requests (Missing)
- Students can submit institution change requests via `/student/profile`, but there is **no admin page** to review, approve, or reject these requests.
- The `InstitutionChangeRequest` model exists in the database and the API endpoint (`/api/institution-change-request`) works, but admins must manually update the database to approve/reject requests.
- **Follow-up**: Create an admin page (e.g., `/admin/change-requests`) to list pending requests and act on them.

### 2. Vercel environment variables may still have production keys
- `.env.example` contains test keys (`pk_test_` / `sk_test_`), but the **Vercel Dashboard** environment variables may still have production keys (`pk_live_` / `sk_live_`).
- If auth errors occur, update Vercel → Settings → Environment Variables to match the test keys in `.env.example`, then redeploy without build cache.
- **Manual steps**: Vercel Dashboard → Your Project → Settings → Environment Variables → update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` → Redeploy.

### 3. Database table for `InstitutionChangeRequest` may not exist
- The Prisma schema includes the `InstitutionChangeRequest` model, but the table may not exist in the production database if `prisma db push` or `prisma migrate` was not run after the schema change.
- **Fix**: Run `npx prisma db push` on Vercel as a post-deploy hook, or run it manually via Vercel's console.

### 4. Student profile page does not refresh after admin approval
- When an admin approves a change request (via database), the student's profile page still shows the old institution until they refresh or re-login.
- **Follow-up**: Add real-time updates or a manual refresh button, or redirect the student to re-fetch their profile after approval.

### 5. No notification system for change request status
- Students submit a change request but receive no email or in-app notification when the status changes from Pending → Approved/Rejected.
- **Follow-up**: Implement email notifications via Resend or in-app notifications when the admin reviews the request.

### 6. Clerk test keys limit production features
- Using test keys (`pk_test_`) means some Clerk features may be limited or behave differently in production (e.g., session limits, rate limits).
- **When ready for production**: Switch back to `pk_live_` / `sk_live_` keys and ensure the Clerk Dashboard domain is properly configured.