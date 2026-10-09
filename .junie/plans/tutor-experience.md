---
sessionId: session-261009-135206-ps16
---

# Requirements

## Overview & Goals

Build the complete **Tutor Experience** for A+ Mentality — from signup through application to full tutor dashboard. Everything a tutor needs to go from "curious visitor" to "active teacher."

## Current State

- Users can sign up (Clerk)
- Onboarding exists (institution/programme/year/semester selection)
- `Tutor` model exists in Prisma (profile, specialties, requests)
- `TutorRequest` model exists (student meeting requests)
- Admin CRUD for tutors exists (`lib/actions/tutor-crud.ts`)
- Student can browse tutors (`/student/tutors`)
- **No** `TutorApplication` model — tutors can't apply themselves
- **No** `LECTURER` role in the `Role` enum
- **No** `isVerifiedTutor` flag on `User`
- **No** tutor-specific UI pages
- **No** tutor sidebar navigation
- All assessment/question/grading actions are admin-only

## Goals

1. **Sign up flow with tutor option** — choose Student or Tutor at onboarding
2. **Tutor application wizard** — self-service application with verification
3. **Application status page** — track application progress
4. **Tutor dashboard** — overview of courses, students, pending actions
5. **Course management** — create, manage, view students
6. **Assessment tools** — create, grade, analyze assessments
7. **Question bank** — manage questions scoped to tutor's courses
8. **Meetings** — accept/decline student meeting requests
9. **Profile** — public profile editor and viewer
10. **Sidebar navigation** — tutor-specific nav in DashboardLayout
11. **Notifications** — wire tutor notifications
12. **Tutor access guard** — centralized auth for tutor pages

## Key Constraints

- Preserve all existing behavior (students, admins)
- Every tutor page requires tutor guard
- Every query scoped to institutionId + tutor ownership
- Every mutation Zod-validated and audit-logged
- Never expose other tutors' courses or students
- Never let tutors access admin-only pages
- Use Plan Mode first, one stage at a time
- Run `tsc + lint + build` after each stage
- Add comments explaining WHY
- Every action Zod-validated and audit-logged
- Every query scoped to institutionId
- Never break students or admins

## What's NOT in Scope

- Tutor payment processing
- Video conferencing integration (just store platform info)
- Real-time chat between tutor and student
- Advanced analytics dashboards (basic stats only)
- Bulk student management
- Tutor-to-tutor collaboration
- Mobile-specific UI
- Email sending infrastructure (notifications are in-app only)