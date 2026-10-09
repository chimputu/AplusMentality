---
sessionId: session-261009-091553-3i91
---

# Current State & Gaps

## What Already Exists

The assessment engine is **substantially implemented**. Here's what's already in place:

### Database (prisma/schema.prisma)
- ✅ All enums: `AssessmentType`, `AssessmentMode`, `QuestionType`, `AttemptStatus`, `AssessmentSource`, `LiveStatus`, `ResultReveal`
- ✅ All models: `Assessment`, `Question`, `QuestionOption`, `AssessmentItem`, `AssessmentAttempt`, `Answer`, `FormResponse`, `AttemptOverride`
- ✅ Proper indexes and relations

### Grading Engine (lib/assessment/grader.ts)
- ✅ `gradeAnswer()` — handles MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK, SHORT_ANSWER, NUMERIC, MATCHING, ESSAY
- ✅ `gradeAttempt()` — aggregates score, totalPoints, percentage, needsManualGrading
- ✅ 25+ Vitest tests in `grader.test.ts`

### Server Actions
- ✅ `lib/actions/assessments.ts` — CRUD, publish/unpublish, add/remove/reorder questions
- ✅ `lib/actions/questions.ts` — CRUD, duplicate, delete with protection, pagination
- ✅ `lib/actions/attempts.ts` — startAttempt, saveAnswer, submitAttempt, getAttemptResult, getStudentAssessments
- ✅ All Zod-validated, auth-checked

### Admin Pages
- ✅ `app/(dashboard)/admin/assessments/page.tsx` — list with filters
- ✅ `app/(dashboard)/admin/assessments/[id]/grading/page.tsx` — submissions table
- ✅ `app/(dashboard)/admin/assessments/[id]/analytics/page.tsx` — analytics
- ✅ `app/(dashboard)/admin/questions/page.tsx` — question bank with filters
- ✅ `app/(dashboard)/admin/questions/new/page.tsx` — new question form
- ✅ `app/(dashboard)/admin/questions/[id]/edit/page.tsx` — edit question
- ✅ `app/(dashboard)/admin/questions/components/question-form.tsx` — dynamic form

### Student Pages
- ✅ `app/(dashboard)/assessments/page.tsx` — student assessment list
- ✅ `app/(dashboard)/assessments/[id]/page.tsx` — runner page
- ✅ `app/(dashboard)/assessments/[id]/_components/assessment-runner.tsx` — full runner with timer, auto-save, navigation
- ✅ `app/(dashboard)/assessments/[id]/result/page.tsx` — results page

### API Routes
- ✅ `app/api/programmes/route.ts` — GET programmes by institutionId
- ✅ `app/api/institutions/[id]/programmes/route.ts` — GET programmes for institution
- ✅ `app/api/admin/assessments/route.ts` — GET/POST assessments
- ✅ `app/api/admin/assessments/[id]/route.ts` — GET/PATCH/DELETE assessment

### Components
- ✅ `components/programme-picker.tsx` — works, fetches from `/api/institutions/${id}/programmes`
- ✅ `components/DashboardLayout.tsx` — sidebar with nav items (assessments already present)

### Validations
- ✅ `lib/validations/assessment.ts` — Zod schemas for create/update/reorder

---

## What's Missing (Actual Gaps)

### Gap 1: Assessment Creation Wizard (BLOCKING — causes 404)
- ✅ `app/(dashboard)/admin/assessments/new/page.tsx` — **created**
- ✅ Wizard steps: source chooser, basic info, native builder, external config, review
- The link `/admin/assessments/new` in the admin assessments page should now work

### Gap 2: Assessment Builder/Edit Page
- ✅ `app/(dashboard)/admin/assessments/[id]/page.tsx` — **created**
- ✅ Components: assessment-settings, question-list, add-questions-dialog (inline)

### Gap 3: Breadcrumbs Component
- ✅ `components/breadcrumbs.tsx` — **created**
- Breadcrumbs added to assessment builder page

### Gap 4: Sidebar Missing Links
- ✅ "Questions" link added to admin sidebar (DashboardLayout.tsx)
- ✅ "My Progress" link added to student sidebar
- ✅ BarChart3 import added

### Gap 5: Course Page Tabs
- ✅ Student course page now shows assessments section with scores and start/review links
- ⚠️ Admin course page tabs — deferred, can be added later

### Gap 6: External Sources
- ✅ `app/(dashboard)/assessments/[id]/embed/page.tsx` — **created**
- ❌ Google Sheets integration (`lib/integrations/google-sheets.ts`) — deferred, requires API keys
- ❌ Cron job for syncing Google Forms responses — deferred
- ❌ `vercel.json` cron configuration — deferred

### Gap 7: Programme Dropdown Issue
- ✅ Resolved — the wizard page now exists and uses course picker
- The API routes work correctly

### Gap 8: Offline Support
- ✅ `lib/offline/assessment-queue.ts` — **created** with IndexedDB queue
- ✅ `app/api/attempts/answer/route.ts` — **created** for offline sync
- ❌ Offline badge component — deferred

### Gap 9: Manual Grading Actions
- ✅ `lib/actions/grading.ts` — **created** with gradeEssayAnswer, gradeAllAnswersInAttempt, getAttemptsNeedingGrading

### Gap 10: not-found.tsx Pages
- ✅ Custom 404 pages created for admin/assessments, admin/questions, and student/assessments
