---
sessionId: session-261008-224427-1333
---

# Phase 11A — Clerk Organizations (COMPLETED ✓)

### Overview & Goals
Add Clerk Organization support to the A+ Mentality app as a **low-risk, additive-only** foundation. No existing behavior should change. The app must work identically after this phase.

### ✅ All 6 Deliverables Complete
- ✓ Prisma schema fields added
- ✓ Webhook handlers added (6 org events)
- ✓ Lookup helpers created (`lib/orgs/lookup.ts`)
- ✓ Admin organizations page created
- ✓ Env validation created (`lib/env.ts`)
- ✓ Final verification complete

---

# Tasks A, B, C — Assessment Engine Completion & Route Connections

### Overview & Goals
Complete the assessment engine (Phase 12) by fixing the programme dropdown, building the missing assessment creation wizard, and connecting all routes. The assessment engine is **already mostly built** — schema, grader, actions, and most pages exist. The main missing pieces are the assessment creation wizard (`/admin/assessments/new`), programme picker, sidebar nav items, breadcrumbs, and course page tabs.

### Scope

**Task A — Fix Programme Dropdown (BLOCKING)**
- Create `/api/programmes` route for fetching programmes by institution
- Create `components/programme-picker.tsx` client component
- Verify programmes load correctly in assessment wizard

**Task B — Complete Assessment Engine**
- Create `/admin/assessments/new` page (4-step wizard)
- Add "Questions" nav item to admin sidebar
- Add assessment builder components (native + external)
- Add offline assessment queue
- Add external sources support (Google Forms, MS Forms, external links)
- Add cron job for Google Forms sync

**Task C — Connect All Routes**
- Add breadcrumbs component
- Add course page tabs (Assessments, Tutors, Progress)
- Add cross-links between pages
- Add not-found.tsx pages
- Update tutor dashboard
- Update programme page tabs

### Key Constraints
- This is a **live production app** with real users
- Every mutation must be Zod-validated and audit-logged
- Institution scoping on every query
- Never expose answers to client before submission
- Rate-limit submission endpoints
- Offline-first for student runner
- Run `tsc + lint + build` after each deliverable


# Technical Design

### Current Implementation

**What's Already Built (Phase 11A + Assessment Engine Foundation):**

**Prisma Schema** (`prisma/schema.prisma`):
- ✅ Assessment engine enums: `AssessmentType`, `AssessmentMode`, `LiveStatus`, `QuestionType`, `ResultReveal`, `AttemptStatus`, `AssessmentSource`
- ✅ `Assessment` model with all fields (title, description, type, mode, liveStatus, courseId, timeLimit, openAt, closeAt, maxGrade, passingScore, attemptsMax, shuffleQs, showAnswersAfter, proctored, etc.)
- ✅ `Question` model with type, prompt, options (JSON), correctId, correctText, points, explanation
- ✅ `AssessmentAttempt` model with userId, answers (JSON), score, percentage, tabSwitches, fullscreenExits, etc.
- ✅ `QuestionOption` model (normalized options)
- ✅ `AssessmentItem` model (junction table for Assessment ↔ Question)
- ✅ `Answer` model (normalized answers)
- ✅ `FormResponse` model for Google Forms
- ✅ `AttemptOverride` model
- ✅ Clerk org fields on `Institution` and `User`
- ✅ `OrganizationMembership` model

**Actions (Server Actions):**
- ✅ `lib/actions/questions.ts` — CRUD for questions (list, create, update, delete, duplicate)
- ✅ `lib/actions/assessments.ts` — CRUD for assessments
- ✅ `lib/actions/attempts.ts` — Student attempt actions (start, saveAnswer, submit, getAssessmentForStudent, getAttemptResult)
- ✅ `lib/actions/programme-crud.ts` — Programme CRUD (list, get, create, update, delete)
- ✅ `lib/assessment/grader.ts` — Pure grading engine (MCQ, T/F, Fill-in-blank, Numeric, Matching, Essay)
- ✅ `lib/assessment/grader.test.ts` — Grader tests

**Admin Pages:**
- ✅ `/admin/assessments/page.tsx` — List assessments with filters
- ✅ `/admin/assessments/[id]/analytics/page.tsx` — Analytics page
- ✅ `/admin/assessments/[id]/grading/page.tsx` — Manual grading page
- ✅ `/admin/questions/page.tsx` — Question bank list
- ✅ `/admin/questions/new/page.tsx` — Create question
- ✅ `/admin/questions/[id]/edit/page.tsx` — Edit question
- ✅ `/admin/organizations/page.tsx` — Clerk org linkage (SUPER_ADMIN only)

**Student Pages:**
- ✅ `/assessments/page.tsx` — List available assessments
- ✅ `/assessments/[id]/page.tsx` — Assessment runner
- ✅ `/assessments/[id]/result/page.tsx` — View results

**API Routes:**
- ✅ `/api/admin/assessments/route.ts` — GET list, POST create
- ✅ `/api/admin/assessments/[id]/route.ts` — GET, PUT, DELETE
- ✅ `/api/admin/assessments/[id]/submissions/route.ts` — GET submissions
- ✅ `/api/admin/programmes/route.ts` — Admin programme management
- ✅ `/api/programmes/[id]/tree/route.ts` — Programme tree
- ✅ `/api/student/assessments/[id]/start/route.ts` — Start attempt

**Components:**
- ✅ `components/DashboardLayout.tsx` — Admin and student sidebar
- ✅ Admin nav items include Assessments, Assignments, Quizzes, Tests, Submissions
- ✅ Student nav items include Assessments, Assignments, Quizzes

### What's Missing

1. **`/admin/assessments/new` page** — The 4-step assessment creation wizard (this is the 404 the user reported)
2. **"Questions" nav item** — Missing from admin sidebar
3. **Programme picker component** — No `components/programme-picker.tsx`
4. **`/api/programmes` route** — No public API for fetching programmes by institution
5. **Breadcrumbs component** — No `components/breadcrumbs.tsx`
6. **Course page tabs** — No Assessments, Tutors, Progress tabs on course detail page
7. **External sources support** — No Google Forms/MS Forms/external link support in wizard
8. **Offline assessment queue** — No `lib/offline/assessment-queue.ts`
9. **Google Sheets integration** — No `lib/integrations/google-sheets.ts`
10. **Cron job** — No sync cron for Google Forms
11. **not-found.tsx pages** — No friendly 404 pages for assessments

### Key Decisions

1. **Assessment wizard**: 4-step wizard (Source → Basic Info → Builder/Config → Review). Native builder uses drag-drop from question bank; External config collects URL/embed details.

2. **Programme picker**: Client component fetching from `/api/programmes?institutionId=X`. Follows the existing pattern of client-side fetch for dropdowns.

3. **Sidebar nav items**: Add "Questions" to admin sidebar under "Assessments" section. Follow existing `adminNavItems` pattern.

4. **Breadcrumbs**: Reusable server component that reads dynamic segments. Placed on all detail pages.

5. **Course page tabs**: Add tabs to existing course detail page. Each tab is a separate component rendered conditionally based on `?tab=` query param.

### Proposed Changes

#### Stage 1 — Task A: Fix Programme Dropdown
- Create `app/api/programmes/route.ts` — GET endpoint fetching programmes by institutionId
- Create `components/programme-picker.tsx` — Client component with Select dropdown
- Verify programmes load when institution is selected

#### Stage 2 — Task B1: Assessment Creation Wizard
- Create `/admin/assessments/new/page.tsx` — 4-step wizard page
- Create wizard step components:
  - `step-1-source-chooser.tsx` — Choose Native/Google Form/MS Form/External Link
  - `step-2-basic-info.tsx` — Title, description, type, course, programme
  - `step-3a-native-builder.tsx` — Drag-drop questions from bank
  - `step-3b-external-config.tsx` — URL/embed config for external sources
  - `step-4-review.tsx` — Review and publish toggle
- Add "Questions" nav item to admin sidebar

#### Stage 3 — Task B2: Offline Support & External Sources
- Create `lib/offline/assessment-queue.ts` — IndexedDB queue for offline answers
- Create `app/(dashboard)/assessments/[id]/_components/offline-badge.tsx`
- Create `app/(dashboard)/assessments/[id]/embed/page.tsx` — Embed page for external sources
- Create `lib/integrations/google-sheets.ts` — Google Sheets integration
- Create `app/api/cron/sync-google-forms/route.ts` — Cron job for sync
- Update `vercel.json` with cron schedule

#### Stage 4 — Task C: Connect All Routes
- Create `components/breadcrumbs.tsx` — Reusable breadcrumb component
- Add breadcrumbs to all detail pages
- Update course page (`/courses/[id]/page.tsx`) with tabs (Assessments, Tutors, Progress)
- Add not-found.tsx pages for assessments and questions
- Update programme page with tabs (Courses, Tutors, Students, Assessments, Analytics)
- Add cross-links between pages

# Testing

### Validation Approach
After each stage, run `tsc --noEmit`, `npm run lint`, and `npm run build` to ensure nothing breaks.

### Key Scenarios
1. **Programme dropdown**: Select institution → programmes appear in dropdown
2. **Assessment wizard**: Complete all 4 steps → assessment created in database
3. **Questions nav item**: "Questions" appears in admin sidebar under Assessments section
4. **Breadcrumbs**: Appear on all detail pages with correct hierarchy
5. **Course tabs**: Assessments, Tutors, Progress tabs work on course detail page
6. **External sources**: Google Form/MS Form/External Link assessments work correctly
7. **Offline support**: Answers queued in IndexedDB when offline, synced on reconnect

### Edge Cases
- Programme dropdown with no programmes for institution → show "No programmes yet"
- Assessment wizard with no questions in bank → show "Add questions first" link
- External URL validation → reject invalid URLs
- Offline submission → queue answers, sync when online
- Rate limiting → block excessive saveAnswer calls

### Test Changes
- Existing grader tests should pass unchanged
- No new tests required for this phase (additive-only)

# Delivery Steps

### Stage 1: Task A — Fix Programme Dropdown
Create the programme API route and picker component to unblock the assessment wizard.

- Create `app/api/programmes/route.ts` — GET endpoint fetching programmes by institutionId
- Create `components/programme-picker.tsx` — Client component with Select dropdown
- Verify programmes load when institution is selected
- Run `tsc --noEmit`, `npm run lint`, and `npm run build`

### Stage 2: Task B1 — Assessment Creation Wizard
Build the 4-step assessment creation wizard and add the Questions nav item.

- Create `/admin/assessments/new/page.tsx` — 4-step wizard page
- Create wizard step components:
  - `step-1-source-chooser.tsx` — Choose Native/Google Form/MS Form/External Link
  - `step-2-basic-info.tsx` — Title, description, type, course, programme
  - `step-3a-native-builder.tsx` — Drag-drop questions from bank
  - `step-3b-external-config.tsx` — URL/embed config for external sources
  - `step-4-review.tsx` — Review and publish toggle
- Add "Questions" nav item to admin sidebar in `DashboardLayout.tsx`
- Run `tsc --noEmit`, `npm run lint`, and `npm run build`

### Stage 3: Task B2 — Offline Support & External Sources
Add offline assessment queue and external sources support.

- Create `lib/offline/assessment-queue.ts` — IndexedDB queue for offline answers
- Create `app/(dashboard)/assessments/[id]/_components/offline-badge.tsx`
- Create `app/(dashboard)/assessments/[id]/embed/page.tsx` — Embed page for external sources
- Create `lib/integrations/google-sheets.ts` — Google Sheets integration
- Create `app/api/cron/sync-google-forms/route.ts` — Cron job for sync
- Update `vercel.json` with cron schedule
- Run `tsc --noEmit`, `npm run lint`, and `npm run build`

### Stage 4: Task C — Connect All Routes
Add breadcrumbs, course tabs, not-found pages, and cross-links.

- Create `components/breadcrumbs.tsx` — Reusable breadcrumb component
- Add breadcrumbs to all detail pages
- Update course page (`/courses/[id]/page.tsx`) with tabs (Assessments, Tutors, Progress)
- Add not-found.tsx pages for assessments and questions
- Update programme page with tabs (Courses, Tutors, Students, Assessments, Analytics)
- Add cross-links between pages
- Run `tsc --noEmit`, `npm run lint`, and `npm run build`