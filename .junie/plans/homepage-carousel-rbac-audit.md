---
sessionId: session-261030-222104-1ick
---

# Requirements

## Task 1: Increase Carousel Speeds on Mobile

### Overview
The user finds the carousel animations too slow on mobile. Two carousels need speed adjustments:
1. **GradingCycle** (Degree Classification ↔ Grade Bands) — currently 6000ms interval
2. **UniversitiesCarousel** (Partner Institutions marquee) — currently 30s CSS animation

### Acceptance Criteria
- The GradingCycle should cycle faster (reduce from 6000ms to 4000ms)
- The UniversitiesCarousel marquee should scroll faster (reduce from 30s to 20s)
- Changes should apply to all screen sizes (mobile and desktop)

---

## Task 2: Clean Up Grading System Section

### Overview
Remove two elements from the "Zambian University Grading System" section on the homepage to simplify the page.

### Functional Requirements
1. **Remove the "View Full Grade Table" Accordion** — Delete the entire `AccordionTable` component and its usage. This includes the collapsible table with all grade data.
2. **Remove the Source Attribution Text** — Delete the paragraph: *"ℹ️ Source: Zambia Higher Education Authority (HEA) and university academic regulations. If your institution uses a different scale, check with your registrar."*
3. **Verify Layout** — The "Grade Bands" section (part of GradingCycle) should now be the final element before the next section ("Sign Up as a Tutor").

### Out of Scope
- The `GradingCycle` component itself (Degree Classification ↔ Grade Bands cycling) should remain.
- No new content should be added.

---

## Task 3: RBAC Security Audit

### Overview
Perform a code-level audit of the role-based access control system across 5 roles. This is a **read-only verification** — no new features will be written.

### The 5 Roles
1. `SUPER_ADMIN` (Platform Owner)
2. `ADMIN` (University Admin)
3. `LECTURER` (Lecturer)
4. `TUTOR` (Tutor)
5. `STUDENT` (Student)

### Deliverable
A Markdown verification report (table) covering:
- UI: Sidebar navigation items per role
- Backend: Server action authorization guards
- Data isolation: Multi-tenant checks in Prisma queries
- Pass/Fail status with code references

# Technical Design

### Task 1: Carousel Speed Adjustments

#### Current Implementation
- **File**: `components/HomePageClient.tsx`
- **GradingCycle** (line 316-324): `setInterval` with `6000ms` interval toggles between `'degree'` and `'gradeBands'` views.
- **UniversitiesCarousel** (line 231-267): Uses CSS class `animate-marquee` defined at line 1708-1713 with `animation: marquee 30s linear infinite`.

#### Proposed Changes
1. In `GradingCycle` (line 322): Change `6000` → `4000` (reduce interval from 6s to 4s)
2. In CSS keyframes (line 1709): Change `30s` → `20s` (reduce marquee duration from 30s to 20s)

---

### Task 2: Grading System Cleanup

#### Current Implementation
- **File**: `components/HomePageClient.tsx`
- **AccordionTable function**: Lines 48-228 — standalone component with state, accordion trigger button, and a full grade table with ~20 rows of grade data.
- **AccordionTable usage**: Lines 1351-1354 — rendered inside the Zambian Grading section.
- **Source Note**: Lines 1356-1359 — `<p>` tag with italic text and info emoji.

#### Proposed Changes
1. **Delete** the `AccordionTable` function definition (lines 48-228)
2. **Delete** the `<AccordionTable />` usage and its wrapper `<div>` (lines 1351-1354)
3. **Delete** the Source Note paragraph (lines 1356-1359)
4. The section will end with `<GradingCycle />` followed immediately by the closing `</div>` and `</motion.section>`

---

### Task 3: RBAC Security Audit — Architecture Context

#### Current Implementation

**Navigation (UI Layer)** — `components/DashboardLayout.tsx`:
- **adminNavItems** (lines 130-283): 24 items for ADMIN/SUPER_ADMIN. SUPER_ADMIN-only items have `roles: ['SUPER_ADMIN']` filter (Institutions at line 233-239, Organizations at line 264-270).
- **studentNavItems** (lines 286-407): 18 items for STUDENT — Dashboard, Videos, Courses, Past Papers, Quizzes, Profile, etc.
- **lecturerNavItems** (lines 410-483): 13 items for LECTURER — Courses, Videos, Grades, Enrollments.
- **tutorNavItems** (lines 486-577): 15 items for TUTOR — Requests, Specialties, Offerings, Reviews.
- **Role routing** (lines 592-605): `if (role === 'ADMIN' || role === 'SUPER_ADMIN')` → adminNavItems; else if LECTURER → lecturerNavItems; else if TUTOR → tutorNavItems; else → studentNavItems.
- **Role filtering** (line 605): `navItems.filter((item) => !item.roles || item.roles.includes(role))` — hides SUPER_ADMIN-only items from ADMIN.

**Authorization Guards (Backend Layer)** — `lib/actions/`:
- `institution-crud.ts`:
  - `requireSuperAdmin()` (lines 27-38): Checks `user.role !== 'SUPER_ADMIN' || orgRole !== 'org:super_admin'` → throws "Unauthorized".
  - `requireAdmin()` (lines 14-25): Checks `user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN'` → throws "Admin access required".
  - `createInstitution()` (line 110): Calls `requireSuperAdmin()` — only SUPER_ADMIN can create universities.
- `tutor-application.ts`:
  - `requireAdmin()` (lines 36-47): Same pattern — ADMIN or SUPER_ADMIN.
  - `requireAdminWithOrg()` (lines 49-53): Adds org scope via `getOrgScope()`.
  - `approveTutorApplication()` (line 483): Calls `requireAdminWithOrg()`, then checks `application.institutionId !== scope.institutionId` (multi-tenant isolation, line 495).
  - `rejectTutorApplication()` (line 616): Same pattern with multi-tenant isolation (line 631).
- `materials.ts`:
  - `getMaterialsForCourse()` (line 141): IDOR check at line 195 — `course.universityId !== user.universityId` → returns null.
  - `getCoursesWithMaterials()` (line 26): Non-admins scoped to `user.universityId`, `user.year`, `user.period`.
- `video-course.ts`:
  - `getVideosForCourse()` (line 96): IDOR check at line 134 — `course.universityId !== user.universityId` → returns null.
  - `getCoursesWithVideos()` (line 12): Same scoping pattern.

**Org Scope (Multi-Tenant Layer)** — `lib/auth/org-scope.ts`:
- `getOrgScope()` (line 51): Resolves user's active Clerk org → Institution mapping.
- `buildCourseScopeWhere()` (line 132): Builds Prisma WHERE clause scoped to `institutionId`, `year`, `period`. SUPER_ADMIN bypasses institution scoping.
- Role mapping (lines 30-36): `org:super_admin` → SUPER_ADMIN, `org:admin` → ADMIN, `org:tutor` → TUTOR, `org:lecturer` → LECTURER, `org:member` → STUDENT.

**Database Schema** — `prisma/schema.prisma`:
- `enum Role { ADMIN, SUPER_ADMIN, STUDENT, LECTURER, TUTOR }` (lines 18-24).
- `User` model: `role Role @default(STUDENT)`, `universityId String?`, `year Int?`, `period String?`.

#### Key Findings
- The RBAC system is well-structured with three layers: UI navigation, server action guards, and data isolation.
- SUPER_ADMIN has dual checks: `user.role === 'SUPER_ADMIN'` AND `orgRole === 'org:super_admin'` for institution creation.
- Multi-tenant isolation is enforced via `institutionId` checks in tutor applications and `universityId` checks in materials/videos.
- No explicit server actions found for `uploadVideo` or `createAssignment` — these may be handled via API routes not in `lib/actions/`.

# Delivery Steps

### ✓ Step 1: Increase carousel speeds in HomePageClient.tsx
Reduce the animation durations for both carousels to make them faster on mobile and desktop.
- In `GradingCycle` (line 322 of HomePageClient.tsx): change `setInterval` from `6000` to `4000` ms.
- In CSS keyframes (line 1709 of HomePageClient.tsx): change `.animate-marquee` duration from `30s` to `20s`.
- Verify that both carousels still pause on hover and cycle smoothly after the change.

### ✓ Step 2: Remove AccordionTable and Source Note from Grading System
Clean up the Zambian University Grading System section by removing two elements.
- Delete the `AccordionTable` function definition (lines 48-228 of HomePageClient.tsx).
- Delete the `<AccordionTable />` usage and its wrapper `<div className="max-w-4xl mx-auto">` (lines 1351-1354).
- Delete the Source Note paragraph with the HEA attribution (lines 1356-1359).
- Verify that the GradingCycle component is now the last element in the grading section, followed immediately by the "Sign Up as a Tutor" section with no awkward gaps.

### ✓ Step 3: Generate RBAC Security Audit Report
Produce a comprehensive Markdown verification report (table) auditing all 5 roles across UI, backend, and data isolation layers.
- **SUPER_ADMIN**: Verify Sidebar shows Institutions/Organizations/System Health, `createInstitution` requires `org:super_admin`, can view all users.
- **ADMIN**: Verify Sidebar shows Tutor Applications/Manage Users/Manage Courses, "Create University" is hidden, `createInstitution` blocks ADMIN with 403, data isolation via `institutionId`.
- **LECTURER**: Verify Sidebar shows Courses/Videos/Grades, lacks Manage Users, check if upload actions verify `course.lecturerId === user.id`.
- **TUTOR**: Verify Sidebar shows Requests/Offerings/Reviews, lacks Manage Users and Create Course, `approveTutorApplication` blocks TUTOR with 403, multi-tenant isolation.
- **STUDENT**: Verify Sidebar shows Dashboard/Videos/Courses/Past Papers/Profile, all upload/admin buttons hidden, IDOR protection in `getVideosForCourse` and `getMaterialsForCourse`.
- Output a Markdown table with columns: Role | Feature Tested | Expected Behavior | Pass/Fail | Code Fix (if Fail).
- Reference concrete file paths and line numbers from the investigation.