---
sessionId: session-261030-222104-1ick
---

# Requirements

## Previously Completed Tasks

### ✓ Carousel Speeds, Grading Cleanup, RBAC Audit, Color Modernization, Super Admin Privileges, Clerk Org Sync, PDF Exports (Institutions/Users)
All previously completed — see git history for details.

---

## ✓ Step 1: Create Student Roster Export API Route
## ✓ Step 2: Create Tutor Roster Export API Route
## ✓ Step 3: Create Gradebook Export API Route
## ✓ Step 4: Update UI Pages with Export Buttons
## ✓ Step 5: Verify Build & Push to GitHub

### Overview
The platform needs three new professional PDF exports for University Admins and Tutors. These PDFs must be branded, secure (role-gated), and dynamically named. The existing PDF infrastructure (`jspdf` + `jspdf-autotable`) is already installed and working for Super Admin exports at `app/api/export/institutions/route.ts` and `app/api/export/users/route.ts`.

### Functional Requirements

#### 1. University Admin — Export Student Roster (Highest Priority)
- **Location:** `/admin/users` page, replace the existing "Export PDF" button (which currently exports ALL users globally) with a new institution-scoped student-only export.
- **Data:** All users where `institutionId === activeOrgId` AND `role === 'STUDENT'`.
- **PDF Layout:** Header with "A+ Mentality" branding + university name + "Enrolled Students". Table columns: Name, Email, Programme, Year, Registration Date. Footer with generated date and total count.
- **File Name:** `{UniversityShortName}_Students_Report_{YYYY-MM-DD}.pdf`.

#### 2. University Admin — Export Tutor Roster
- **Location:** `/admin/tutors` page, next to the "Add Tutor" button.
- **Data:** All tutors where `universityId` matches the admin's institution.
- **PDF Layout:** Header with university name + "Tutor Roster". Table columns: Tutor Name, Email, Assigned Courses (from specialties), Status (Active/Inactive). Footer with generated date and total count.
- **File Name:** `{UniversityShortName}_Tutors_Report_{YYYY-MM-DD}.pdf`.

#### 3. Tutor — Export Gradebook
- **Location:** `/admin/assignments/[id]/submissions` page (used by tutors and admins for grading).
- **Data:** All submissions for a specific assignment, including student names, scores, and percentages.
- **PDF Layout:** Header with course name + "Gradebook" + assignment title. Table columns: Student Name, Assessment Title, Score, Max Marks, Percentage. Footer with generated date and class average.
- **File Name:** `{CourseCode}_Gradebook_{AssignmentTitle}_{YYYY-MM-DD}.pdf`.

### Security Requirements
- **Student Roster:** Only ADMIN and SUPER_ADMIN can export. Data scoped to their institution (SUPER_ADMIN can export any institution).
- **Tutor Roster:** Only ADMIN and SUPER_ADMIN can export. Data scoped to their institution.
- **Gradebook:** ADMIN, SUPER_ADMIN, LECTURER, and TUTOR can export. Tutors can only export gradebooks for assignments in courses they teach.

### Non-Functional Requirements
- Loading spinner on export buttons while PDF is being generated.
- Dynamic file naming with university/course identifiers and date.
- Consistent branding across all PDFs (dark header bar, alternating row colors matching the existing export style).
- Error handling — show an alert if export fails.

### Out of Scope
- PDF exports for quizzes and tests (can be added later using the same pattern).
- Bulk exports across multiple assignments.
- Custom branding per university.

---

## Pending Tasks (Moved to Backlog)

### Offline-First Architecture (PWA) — PENDING
### Super Admin Global Posting — PENDING
### Infinite Banner Carousel — PENDING
### Fix Sign-Up redirect and Onboarding Clerk org integration — PENDING
### Add course auto-assignment to tutor approval flow — PENDING
### Create Find-Tutor directory page for students — PENDING
### Verify Tutor CRUD course ownership checks — PENDING

# Technical Design

## Current Implementation

### Existing PDF Export Pattern
- **`app/api/export/institutions/route.ts`** (76 lines): GET endpoint, requires SUPER_ADMIN, fetches all institutions, generates landscape PDF with jsPDF + autoTable, returns blob with Content-Disposition header.
- **`app/api/export/users/route.ts`** (80 lines): Same pattern — GET endpoint, SUPER_ADMIN only, all users.
- Both use `requireAuth(['SUPER_ADMIN'])` from `lib/auth.ts`.
- Both use `jsPDF` with `autoTable` — dark header bar `fillColor: [49, 51, 63]`, grid theme, alternating row colors.

### Data Models (from `prisma/schema.prisma`)
- **User** (line 165): `role`, `institutionId`, `programmeId`, `year`, `period`, `name`, `email`, `createdAt`.
- **Tutor** (line 1121): `fullName`, `email`, `universityId`, `isActive`, `specialties[]` via TutorSpecialty to Course.
- **AssignmentSubmission** (line 584): `assignmentId`, `userId`, `score`, `total`, `feedback`, `status`, `submittedAt`. Links to Assignment to Course.

### Auth Helpers
- **`requireAuth(allowedRoles?)`** in `lib/auth.ts`: Checks Clerk auth, fetches user from Prisma, validates role.
- **`getOrgScope()`** in `lib/auth/org-scope.ts`: Resolves Clerk org to Institution mapping, returns `institutionId`, `isSuperAdmin`, etc.

## Key Decisions

### 1. API Route Pattern (not Server Actions)
Following the existing pattern, each PDF export will be a GET API route under `/api/export/`. This allows the browser to trigger a file download directly via `<a href="...">` or `window.location.href`, which is simpler than Server Actions for binary downloads.

### 2. Institution Scoping via `getOrgScope()`
Instead of replicating scoping logic in each route, use `getOrgScope()` to resolve the user's active institution. For ADMIN, scope queries to `institutionId`. For SUPER_ADMIN, bypass scoping.

### 3. Reuse Existing PDF Styling
All new PDFs will use the same visual style as existing exports: dark header bar (`fillColor: [49, 51, 63]`), grid theme, alternating rows (`fillColor: [245, 247, 250]`), landscape orientation, 8pt font.

### 4. Gradebook Export via Query Parameter
The gradebook route will accept `?assignmentId=xxx` as a query parameter, so the submissions page can link to `/api/export/gradebook?assignmentId=xxx`.

## Proposed Changes

### 1. Student Roster Export — `app/api/export/students/route.ts`
- **Auth:** `requireAuth(['ADMIN', 'SUPER_ADMIN'])`.
- **Scope:** Use `getOrgScope()` to get `institutionId`. If SUPER_ADMIN, fetch all students; otherwise filter by `institutionId`.
- **Query:** `prisma.user.findMany({ where: { institutionId, role: 'STUDENT' }, include: { programme: true } })`.
- **PDF:** Header with institution name, table with Name/Email/Programme/Year/Joined, footer with count and date.
- **File Name:** `{shortName}_Students_Report_{date}.pdf`.

### 2. Tutor Roster Export — `app/api/export/tutors/route.ts`
- **Auth:** `requireAuth(['ADMIN', 'SUPER_ADMIN'])`.
- **Scope:** Use `getOrgScope()` to get the active institution. Map `institutionId` to the Tutor's `universityId` via the Institution to University relationship, or scope by matching the institution.
- **Query:** `prisma.tutor.findMany({ where: { universityId: ... }, include: { specialties: { include: { course: true } } } })`.
- **PDF:** Header with institution name, table with Name/Email/Courses/Status, footer with count and date.
- **File Name:** `{shortName}_Tutors_Report_{date}.pdf`.

### 3. Gradebook Export — `app/api/export/gradebook/route.ts`
- **Auth:** `requireAuth(['ADMIN', 'SUPER_ADMIN', 'LECTURER', 'TUTOR'])`.
- **Query Param:** `?assignmentId=xxx`.
- **Ownership Check:** Fetch the assignment, then the course. For TUTOR, verify `course.tutorId === tutorId`. For ADMIN, verify institution scope.
- **Query:** `prisma.assignmentSubmission.findMany({ where: { assignmentId }, include: { user: true, assignment: { include: { course: true } } } })`.
- **PDF:** Header with course and assignment name, table with Student/Assessment/Score/Max/Percentage, footer with class average and date.
- **File Name:** `{courseCode}_Gradebook_{assignmentTitle}_{date}.pdf`.

### 4. UI Updates

#### `/admin/users/page.tsx`
- Replace the existing `<a href="/api/export/users">` button with a new `<a href="/api/export/students">Export Students</a>` button.
- The old global users export remains at `/api/export/users` for SUPER_ADMIN use.

#### `/admin/tutors/page.tsx`
- Add an "Export Tutors" button next to the "Add Tutor" button.
- Link to `/api/export/tutors`.

#### `/admin/assignments/[id]/submissions/page.tsx`
- Add an "Export Grades" button in the page header.
- Link to `/api/export/gradebook?assignmentId=${assignmentId}`.
- Add a loading spinner state using `useState`.

## Architecture Diagram

```
graph LR
  A[Admin Users Page] -->|GET| B[/api/export/students]
  C[Admin Tutors Page] -->|GET| D[/api/export/tutors]
  E[Submissions Page] -->|GET| F[/api/export/gradebook]
  B -->|getOrgScope| G[Institution Scope]
  D -->|getOrgScope| G
  F -->|Ownership Check| H[Course/Tutor Verification]
  B -->|prisma.user| I[PDF Generation]
  D -->|prisma.tutor| I
  F -->|prisma.assignmentSubmission| I
  I -->|jsPDF blob| J[File Download]
```

## Risks
- **Tutor to University mapping:** The Tutor model uses `universityId` (links to University model), while users use `institutionId` (links to Institution model). These may be different models. Need to verify the mapping between Institution and University to scope tutors correctly.
- **Gradebook ownership for TUTOR role:** The assignment model has `createdBy` (user ID) but not a direct `tutorId`. Ownership will be verified through `course.tutorId` or `assignment.createdBy`.

# Testing

## Validation Approach
- TypeScript compilation check (`npx tsc --noEmit`).
- Build verification (`npm run build`).
- Manual testing of each export endpoint with different roles.

## Key Scenarios
1. **Student Roster:** ADMIN exports — only their institution's students. SUPER_ADMIN exports — all students.
2. **Tutor Roster:** ADMIN exports — only their institution's tutors with correct course assignments.
3. **Gradebook:** TUTOR exports — only their assignment's submissions. Non-tutor blocked with 403.
4. **File Naming:** Each PDF downloads with the correct dynamic filename.

## Edge Cases
- Empty student roster (no students) — PDF shows "0 students" with empty table.
- Empty tutor roster — PDF shows "0 tutors".
- Assignment with no submissions — PDF shows "No submissions yet".
- TUTOR tries to export another tutor's gradebook — 403 Forbidden.