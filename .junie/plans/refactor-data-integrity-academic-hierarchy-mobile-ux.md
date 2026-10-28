---
sessionId: session-261027-202022-6u55
---

### ✓ Step 1: Phase 1 - Data Purge & Schema Standardization
### ✓ Step 2: Phase 2 - Global Dropdown Remediation
### ✓ Step 3: Phase 3 - Mobile Admin User List Refactor
### ✓ Step 4: Phase 4 - Course-First Upload Flow & CORS Fix

# Requirements

### Overview & Goals
Execute a platform-wide refactor to:
1. Purge polluted data from the `University` table (regulatory bodies like ZICTA, ZICA that are not universities).
2. Enforce a unified academic hierarchy using the `Institution` model as the single source of truth.
3. Standardize cascading dropdowns across all forms (Onboarding, Course Creation, Video Upload, Past Paper, Tutor Application).
4. Rebuild the Admin User List for mobile-first responsiveness.
5. Simplify the upload flow to course-first selection.
6. Fix CORS errors for the manifest and Clerk on Vercel production.

### Scope

**In Scope:**
- Phase 1: Database cleanup script, schema verification, standardized seeding
- Phase 2: Centralized university query, form injection, label consistency, cascading logic
- Phase 3: Mobile Admin User List (card layout, name fallback, search, visual polish)
- Phase 4: Course-first upload flow for Videos and Past Papers
- CORS fix: Manifest headers in next.config.ts

**Out of Scope:**
- Creating new database models
- Modifying the Clerk integration beyond CORS headers
- Internationalization (i18n)
- Performance benchmarking

### User Stories
1. As a student, when I select a university in any form, I only see actual universities — not regulatory bodies.
2. As an admin, when I view the User List on mobile, I see a readable card layout with human names instead of raw Clerk IDs.
3. As a lecturer, when I upload a video or past paper, I can select a course directly instead of navigating through university → programme → year → period.
4. As an admin, when I search the User List, results filter by name or email in real time.

### Functional Requirements
- **FR1:** The `University` table must not contain non-university records (ZICTA, ZICA, ZBS, Zambia School of Law, etc.).
- **FR2:** All dropdowns that currently fetch universities must use a centralized function that returns only actual universities (Institution type UNIVERSITY).
- **FR3:** Form labels must consistently use "University" instead of "Institution" where referring to the university dropdown.
- **FR4:** Cascading dropdowns must show "Select University first" and be disabled when no parent is selected.
- **FR5:** The Admin User List must render as stacked cards on mobile (<768px) and as a table on desktop.
- **FR6:** User names must follow the fallback chain: `firstName + lastName` → `email` → `@username` — never raw Clerk IDs.
- **FR7:** Video and Past Paper uploads must support a single Course dropdown that auto-infers university, programme, and year.
- **FR8:** The manifest.json must be served with proper CORS headers on Vercel.

### Non-Functional Requirements
- All changes must pass `npm run build` without TypeScript errors.
- Prisma seed must run successfully (`npx prisma db seed`).
- Mobile layouts must use Tailwind responsive classes (`md:` breakpoint).
- High contrast text: `text-slate-900` for primary, `text-slate-500` for secondary.

# Technical Design

### Current Implementation

**Database Models:**
- `University` (legacy): has `academicSystem` enum (YEARLY/SEMESTERLY/TRIMESTERLY). Polluted with non-university records.
- `Institution` (new): has `type` (InstitutionType enum: UNIVERSITY, COLLEGE, POLYTECHNIC, etc.), `periodType` (SEMESTER/TERM/TRIMESTER/QUARTER/BLOCK), `levelType`, `numLevels`, `numPeriods`. This is the authoritative model.
- `Programme`: links to both `University` (legacy) and `Institution` (new) via optional foreign keys.
- `AcademicLevel` / `AcademicPeriod`: scoped to Institution.
- `Course`: has `universityId`, `programmeId`, `levelId`, `periodId`, `yearNumber`, `year`, `period`.
- `Video` / `PastPaper`: both have optional `courseId` → `Course` relation.

**API Endpoints:**
- `/api/admin/universities` — returns BOTH University and Institution records (normalized). This is the source of data pollution.
- `/api/institutions/picker` — returns active Institutions only.
- `/api/courses` — supports filtering by programmeId, universityId, year, period.

**Key Components:**
- `components/UserManagement.tsx` — admin user list with `<table>`, shows Clerk IDs (line 426), has search but no mobile layout.
- `components/CreateCourseForm.tsx` — university → programme → year → period cascading dropdowns.
- `components/VideoUploadForm.tsx` — same pattern, uses InstitutionSelect, ProgrammeSelect, CourseSelect.
- `app/(dashboard)/admin/past-papers/create/page.tsx` — same pattern.
- `app/onboarding/_components/onboarding-form.tsx` — uses InstitutionSelect, ProgrammeSelect, BranchSelect.
- `app/(dashboard)/apply-as-tutor/_components/tutor-application-wizard.tsx` — institution dropdown in step 2.

**Shared Infrastructure:**
- `components/ui/data-select.tsx` — base dropdown component with prerequisite messages, loading states, empty states.
- `components/ui/selects/` — reusable selects (InstitutionSelect, ProgrammeSelect, CourseSelect, etc.).
- `lib/data/dropdowns.ts` — centralized server-side dropdown fetchers.

### Key Decisions

1. **Institution as single source of truth:** Instead of cleaning the `University` table, we will make all dropdowns use the `Institution` model (filtered by type UNIVERSITY) as the primary data source. The `University` table cleanup script will remove non-university records but the long-term strategy is the Institution model.

2. **Centralized query in `lib/data/dropdowns.ts`:** Add `fetchStrictUniversitiesForDropdown()` that returns only Institution records with type UNIVERSITY. This extends the existing centralized dropdown utility.

3. **Course-first upload flow:** Replace the multi-level dropdown chain (University → Programme → Year → Period) in VideoUploadForm and Past Paper create with a single `CourseSelect` that auto-infers relations via Prisma.

4. **Mobile card layout:** Convert the `<table>` in UserManagement to a responsive layout using `hidden md:table` for the table and `flex flex-col md:hidden` for card stacks.

5. **CORS fix:** Add `headers()` configuration in `next.config.ts` to serve `manifest.json` with `Access-Control-Allow-Origin: *`.

### Proposed Changes

**Phase 1: Data Purge & Schema Standardization (Step 1)**
- Create `scripts/clean-university-table.ts` — Prisma script to DELETE University records that are not actual universities (ZICTA, ZICA, ZBS, Zambia School of Law, etc.).
- Verify `Institution.type` enum is correct (it already is: UNIVERSITY, COLLEGE, POLYTECHNIC, INSTITUTE, MEDICAL_SCHOOL, BUSINESS_SCHOOL, TECHNICAL_COLLEGE, VOCATIONAL_SCHOOL).
- Seed file already correctly seeds Institution with proper academic hierarchy (levels, periods, faculties, programmes). No changes needed.

**Phase 2: Global Dropdown Remediation (Step 2)**
- Add `fetchStrictUniversitiesForDropdown()` to `lib/data/dropdowns.ts` — fetches Institution records where type = UNIVERSITY.
- Update `/api/admin/universities/route.ts` GET to return ONLY Institution records (type UNIVERSITY) — remove the University model fetch.
- Update `components/ui/selects/institution-select.tsx` label from "Institution" to "University" where appropriate.
- Update `CreateCourseForm.tsx` to use the centralized query and enforce cascading disable states.
- Update `VideoUploadForm.tsx` to use centralized query.
- Update past paper create page to use centralized query.
- Update onboarding form to use centralized query.
- Update tutor application wizard to use centralized query.

**Phase 3: Mobile Admin User List Refactor (Step 3)**
- In `components/UserManagement.tsx`:
  - Add a card-based layout (`flex flex-col gap-4`) that shows on mobile (`flex flex-col md:hidden`).
  - Hide the `<table>` on mobile (`hidden md:block`).
  - Replace Clerk ID display (line 426) with the existing `getDisplayName()` fallback chain.
  - Search already exists — ensure it works in both views.
  - Apply visual polish: `text-slate-900` for primary, `text-slate-500` for secondary, remove excessive shadows.

**Phase 4: Course-First Upload Flow (Step 4)**
- In `VideoUploadForm.tsx`: Replace University → Programme → Year → Period dropdowns with a single `CourseSelect`. When a course is selected, fetch its relations (universityId, programmeId, year) and include them in the payload.
- In past paper create page: Same approach — single `CourseSelect` replaces the multi-level chain.
- The `Course` model already stores `universityId`, `programmeId`, `year`, `period` — no schema changes needed.

**CORS Fix (Step 4)**
- Add `headers()` in `next.config.ts` to serve `/manifest.json` with `Access-Control-Allow-Origin: *`.
- Verify Clerk origins in CSP (already present: `https://*.clerk.accounts.dev`).

### File Structure

**New Files:**
- `scripts/clean-university-table.ts` — one-time cleanup script

**Modified Files:**
- `lib/data/dropdowns.ts` — add `fetchStrictUniversitiesForDropdown()`
- `app/api/admin/universities/route.ts` — return only Institution records
- `components/ui/selects/institution-select.tsx` — label consistency
- `components/CreateCourseForm.tsx` — centralized query, cascading logic
- `components/VideoUploadForm.tsx` — course-first flow
- `app/(dashboard)/admin/past-papers/create/page.tsx` — course-first flow
- `app/onboarding/_components/onboarding-form.tsx` — centralized query
- `app/(dashboard)/apply-as-tutor/_components/tutor-application-wizard.tsx` — centralized query
- `components/UserManagement.tsx` — mobile card layout, name fallback, visual polish
- `next.config.ts` — CORS headers for manifest

### Architecture Diagram

``` mermaid
graph LR
  A[Institution DB] --> B[lib/data/dropdowns.ts]
  B --> C[api/admin/universities]
  B --> D[api/institutions/picker]
  C --> E[DataSelect base]
  D --> E
  E --> F[InstitutionSelect]
  E --> G[ProgrammeSelect]
  E --> H[CourseSelect]
  F --> I[CreateCourseForm]
  F --> J[VideoUploadForm]
  F --> K[PastPaper Create]
  F --> L[OnboardingForm]
  F --> M[TutorApplication]
  H --> J
  H --> K
```

### Risks
- **Breaking existing University references:** Users/Courses that reference the legacy `University` model via `universityId` will still work (onDelete: SetNull). The API change to return only Institution records may affect forms that expect University IDs — need to ensure the `inst-` prefix normalization is handled consistently.
- **Data loss from cleanup script:** The cleanup script will permanently delete University records. A backup should be taken before running.
- **Mobile layout regression:** The card layout must not break the desktop table view. Thorough testing on both breakpoints is required.

# Testing

### Validation Approach
After implementation, validate by:
1. Running `npx prisma db seed` to ensure the seed script works.
2. Running `npm run build` to verify no TypeScript or Next.js errors.
3. Manually checking key flows in the browser.

### Key Scenarios
1. **Dropdown purity:** Open any form with a university dropdown (Course Creation, Video Upload, Onboarding). Verify only actual universities appear (UNZA, CBU, MU, etc.) — no ZICTA, ZICA, or regulatory bodies.
2. **Cascading logic:** In Course Creation, verify that Programme is disabled with "Select University first" when no university is selected. After selecting a university, Programme should enable and show relevant programmes.
3. **Mobile User List:** Resize browser to mobile width (<768px). Verify the User List shows card layout instead of table. Verify no raw Clerk IDs are visible — only human-readable names.
4. **Search:** Type in the search box on the User List. Verify results filter by name or email in real time.
5. **Course-first upload:** In Video Upload, verify a single Course dropdown replaces the multi-level chain. After selecting a course, verify the upload includes the correct universityId, programmeId, and year.
6. **CORS:** Check browser console on production for CORS errors related to manifest.json. Verify no errors appear.

### Edge Cases
1. **Empty states:** When no universities exist, dropdowns should show "No institutions available" with a "Create institution" link.
2. **User with no name:** A user with no firstName, lastName, name, or username should fall back to their email address.
3. **Course with no university:** A course created without a university should still appear in the Course dropdown but not cause errors when inferring relations.
4. **Institution type filtering:** The dropdown should not show COLLEGE, POLYTECHNIC, or other non-UNIVERSITY types when used in university-specific contexts.