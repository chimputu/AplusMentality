---
sessionId: session-261009-091553-3i91
---

# Tutor Application System Plan

## Overview

Build a complete tutor application system where students can apply to become institutional tutors. The system includes a 5-step application wizard, admin review dashboard, document uploads to Cloudinary, and notification workflows. On approval, the applicant becomes a `LECTURER` with `org:admin` Clerk role.

## Requirements

### User Stories
- As a student, I want to apply as a tutor so I can teach on the platform
- As an admin, I want to review tutor applications so I can verify qualifications
- As an admin, I want to approve/reject/request info for applications
- As an applicant, I want to see my application status

### Scope

**In Scope:**
- Prisma schema changes (TutorApplication model, User fields, LECTURER role)
- Zod validation schemas
- Server actions for CRUD and review operations
- 5-step applicant wizard with document uploads
- Admin review dashboard with stats, filters, and action dialogs
- Notification integration (in-app via existing system)
- Sidebar navigation updates

**Out of Scope:**
- Email system (no email infrastructure exists; defer to future)
- Google Sheets integration
- Cron jobs

## Technical Design

### Current Implementation

**Schema (`prisma/schema.prisma`):**
- `Role` enum: ADMIN, SUPER_ADMIN, STUDENT (no LECTURER)
- `User` model: no `isVerifiedTutor` or `tutorApplicationId` fields
- No `TutorApplication` model
- Existing `Tutor` model is for private tutoring (specialties, rates) — separate concern
- `OrganizationMembership` model exists for Clerk org tracking

**Server Actions Pattern (`lib/actions/tutor-crud.ts`):**
- `requireAdmin()` helper checks Clerk auth + Prisma user role
- Zod schemas defined inline or in `lib/validations/`
- `revalidatePath` after mutations
- Errors thrown as plain `Error` strings

**Cloudinary Uploads (`lib/cloudinary.ts`):**
- `uploadTutorPhoto(buffer, publicId)` uploads to `tutors/profiles` folder
- Returns `{ secure_url, public_id }`
- File validation: MIME type + size check (5MB max)

**Dashboard Layout (`components/DashboardLayout.tsx`):**
- Client component with `adminNavItems` and `studentNavItems` arrays
- Nav items have `href`, `label`, `icon`, `section`, optional `roles`
- Groups items by section

**Notifications (`/api/notifications/route.ts`):**
- Aggregates from Announcement, Test, Quiz, Assignment models
- No dedicated notification model — uses `NotificationSeen` for read tracking

### Key Decisions

1. **Add `LECTURER` to `Role` enum** — The task requires approved tutors to become LECTURERs. This is the cleanest approach since the existing role system controls access.

2. **New `TutorApplication` model** — Separate from the existing `Tutor` model (which is for private tutoring). Stores all application data including JSON fields for qualifications and documents.

3. **JSON fields for complex data** — Qualifications (degrees, certifications) and documents stored as JSON in Prisma, validated by Zod on input. This avoids creating 10+ junction tables.

4. **Document uploads via client-side API route** — Files uploaded from the browser to `/api/upload/document` which uploads to Cloudinary folder `tutor-applications/{userId}`. URLs stored in the application record.

5. **Notifications via existing system** — Extend the notification API to include tutor application events. No email system since none exists.

6. **Admin access check** — `requireAdminOfInstitution()` checks for `org:admin` Clerk role OR legacy ADMIN/SUPER_ADMIN of the application's institution.

### Schema Changes

```prisma
// Add to Role enum
enum Role {
  ADMIN
  SUPER_ADMIN
  STUDENT
  LECTURER
}

// Add to User model
  isVerifiedTutor    Boolean            @default(false)
  tutorApplication   TutorApplication?
  reviewedApplications TutorApplication[] @relation("Reviewer")

// New model
model TutorApplication {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  institutionId    String
  
  // Personal
  fullName         String
  email            String
  phone            String
  dateOfBirth      DateTime?
  emergencyContactName   String?
  emergencyContactPhone  String?
  
  // Professional
  facultyId        String?
  department       String?
  position         String
  yearsExperience  Int
  subjects         Json     // string[]
  languages        Json     // string[]
  
  // Qualifications
  highestDegree    Json     // { level, fieldOfStudy, university, yearObtained }
  additionalDegrees Json?   // array of degree objects
  certifications   Json?   // array of { name, issuer, year }
  
  // Documents
  staffIdUrl       String
  staffIdPublicId  String
  certificateUrl   String
  certificatePublicId String
  cvUrl            String
  cvPublicId       String
  linkedInUrl      String?
  additionalDocs   Json?    // array of { name, url, publicId }
  
  // Statement
  statement        String   @db.Text
  
  // Status
  status           String   @default("PENDING") // PENDING | UNDER_REVIEW | APPROVED | REJECTED | WITHDRAWN
  reference        String   @unique // e.g. "TA-2026-0001"
  
  // Review
  reviewedById     String?
  reviewedBy       User?    @relation("Reviewer", fields: [reviewedById], references: [id])
  reviewedAt       DateTime?
  reviewNotes      String?  @db.Text
  rejectionReason  String?  @db.Text
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  @@index([userId])
  @@index([institutionId, status])
  @@index([status])
  @@index([createdAt])
}

// Add relation to Institution
model Institution {
  // ... existing fields ...
  tutorApplications  TutorApplication[]
}
```

### File Structure

```
prisma/
  schema.prisma                          (modify: add enums, models, fields)

lib/
  validations/
    tutor-application.ts                 (new: Zod schemas)
  actions/
    tutor-application.ts                 (new: server actions)
  cloudinary.ts                          (modify: add uploadDocument function)

app/
  api/
    upload/document/route.ts             (new: document upload endpoint)
  onboarding/
    account-type/page.tsx                (new: Student | Tutor chooser)
  (dashboard)/
    apply-as-tutor/
      page.tsx                           (new: 5-step wizard)
      status/page.tsx                    (new: application status)
      _components/
        tutor-application-wizard.tsx     (new: wizard container)
        step-1-personal.tsx              (new)
        step-2-professional.tsx          (new)
        step-3-qualifications.tsx        (new)
        step-4-documents.tsx             (new)
        step-5-statement.tsx             (new)
        application-review.tsx           (new: summary)
        document-uploader.tsx            (new: Cloudinary upload)
        multi-degree-input.tsx           (new: degree repeater)
  admin/
    tutor-applications/
      page.tsx                           (new: list + stats + filters)
      [id]/page.tsx                      (new: detail + review actions)
      _components/
        application-stats.tsx            (new: status count cards)
        application-filters.tsx          (new: tabs + search)
        application-table.tsx            (new: applications table)
        approve-dialog.tsx               (new)
        reject-dialog.tsx                (new)
        request-info-dialog.tsx          (new)
        status-badge.tsx                 (new)

components/
  DashboardLayout.tsx                    (modify: add nav links)
```

### Architecture Diagram

``` mermaid
graph LR
  A[Student] -->|Applies| B[Apply-as-tutor Wizard]
  B -->|Upload Docs| C[Cloudinary API]
  B -->|Submit| D[Server Actions]
  D -->|Create| E[Prisma DB]
  E -->|Notify| F[Admin Dashboard]
  F -->|Approve/Reject| D
  D -->|Update Role| E
  D -->|Add to Org| G[Clerk API]
```

### Risks

1. **Clerk org:admin assignment** — If Clerk API fails during approval, the action should not fail. Wrap in try/catch and log. The user still becomes LECTURER in the DB.

2. **Reference number generation** — Use format `TA-{year}-{sequence}`. Query max sequence for the year to avoid collisions.

3. **Document cleanup** — If an application is deleted, Cloudinary documents are not automatically deleted. Accept this for now.

4. **Existing LECTURER users** — No existing users have LECTURER role. The enum addition is safe.

5. **Large JSON fields** — Qualifications and documents stored as JSON. Validate structure on input with Zod. Consider normalization later if queries on these fields are needed.

---

# Assessment Engine (Previous Work — Complete)

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
- ❌ `lib/validations/assessment.ts` — Was removed as dead code (validations done inline). Schema references in this plan are outdated.

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
- ❌ `lib/offline/assessment-queue.ts` — Was created but later removed as dead code (never wired to UI). Can be re-added when offline-first is needed.
- ❌ Offline badge component — deferred

### Gap 9: Manual Grading Actions
- ❌ `lib/actions/grading.ts` — Was created but later removed as dead code (grading page doesn't use these actions). Can be re-added when grading page is wired up.

### Gap 10: not-found.tsx Pages
- ✅ Custom 404 pages created for admin/assessments, admin/questions, student/assessments, join, and root
