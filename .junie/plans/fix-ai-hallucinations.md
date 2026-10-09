---
sessionId: session-261009-141646-1e26
---

# Cross-University Resource Viewing

### ✓ Done Step 1: Foundation - Schema changes (isPreview flags, ExplorationLog)
### ✓ Done Step 2: Foundation - Access control helper (lib/auth/exploration.ts)
### ✓ Done Step 3: Foundation - Exploration queries (lib/queries/exploration.ts)
### ✓ Done Step 4: Explore Pages - University grid, overview, programme, course
### ✓ Done Step 5: Components - Banner, contact dialog, cards
### ✓ Done Step 6: Integration - Dashboard CTA, sidebar link, public pages
### ✓ Done Step 7: Security - Validation and testing

---

### Current State

**Files investigated:**
- `prisma/schema.prisma` — 1350 lines. Course links to Programme (via `programmeId`), Programme links to Institution (via `institutionId`). No direct Course→Institution path. Material models (LectureSlide, TutorialSheet, Assignment, PastPaper, Test, Quiz, Video) have `courseId` but **no `isPreview` flag**. No `ExplorationLog` model exists.
- `lib/auth.ts` — 158 lines. `requireAuth()` returns `{ userId, role, user }` with user including institution info. `getAuthUser()` returns null instead of redirecting.
- `components/DashboardLayout.tsx` — 893 lines. Student nav items defined as a constant array. No "Explore" link.
- `components/StudentContent.tsx` — 418 lines. Dashboard with action cards (My Courses, Videos, Quizzes, Assignments), stat cards, and content sections. No explore CTA.
- `app/(dashboard)/student/page.tsx` — 94 lines. Fetches user data and passes to `StudentContent`.
- `app/(dashboard)/student/layout.tsx` — 32 lines. Wraps content in `DashboardLayout` with role-based auth.
- `app/page.tsx` — 47 lines. Redirects logged-in users to dashboard, shows `HomePageClient` for public.
- No public university pages exist yet.

**Data model path:** Course → Programme → Institution (traverse through Programme to find institution)

**Tutor relationship:** Course → TutorSpecialty → Tutor (not `tutorAssignments`)

### Problem
Students cannot browse other universities' content because:
1. No `isPreview` flag on material models to control preview access
2. No exploration queries that filter by institution membership
3. No exploration pages or UI
4. No access control layer for cross-institution browsing
5. No logging of exploration activity

### Solution

Five-stage implementation:
1. **Foundation** — Schema changes + access control + queries
2. **Explore Pages** — Four exploration pages
3. **Components** — Banner, contact dialog, cards
4. **Integration** — Dashboard CTA, sidebar link, public pages
5. **Security** — Validation and testing

---

## Technical Design

### Architecture Overview

```
mermaid
graph LR
    A[Student] --> B[Explore Pages]
    B --> C[Access Control Helper]
    C --> D[User Institution]
    B --> E[Exploration Queries]
    E --> F[Prisma DB]
    F --> G{isMember?}
    G -->|Yes| H[Full Content]
    G -->|No| I[Preview Only + Locked Counts]
    B --> J[Exploration Logger]
```

### Data Model Changes

**Schema additions (`prisma/schema.prisma`):**

1. **`isPreview` flag** on material models — `Boolean @default(false)` with composite index `[courseId, isPreview]`:
   - `LectureSlide`, `TutorialSheet`, `Assignment`, `PastPaper`, `Test`, `Quiz`, `Video`
   - Note: The issue mentions `ExamPaper`, `TestPaper`, and `VideoLecture` but the actual models are `PastPaper`, `Test`, and `Video`

2. **`ExplorationLog` model** — new model to track exploration views:
   ```prisma
   model ExplorationLog {
     id             String   @id @default(cuid())
     userId         String
     user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     institutionId  String   // The institution being explored
     resourceType   String   // "UNIVERSITY" | "PROGRAMME" | "COURSE"
     resourceId     String
     action         String   @default("VIEW")
     createdAt      DateTime @default(now())
     @@index([userId, createdAt])
     @@index([institutionId])
   }
   ```
   Also add `explorationLogs ExplorationLog[]` to the `User` model.

3. **Migration:** `npx prisma migrate dev --name add_preview_flags`

### Access Control Helper (`lib/auth/exploration.ts`)

New file with `getAccessContext()` server function:
- Uses `auth()` from Clerk to get userId
- Fetches user from DB with `institutionId`
- Returns `AccessContext` with:
  - `userId`, `userInstitutionId`, `isAuthenticated`
  - `canAccessFullContent(institutionId)` — returns true if user's institution matches
  - `isExploring(institutionId)` — returns true if user is from a different institution

Also includes `verifyResourceBelongsToInstitution()` to prevent IDOR by verifying resources belong to the target institution.

### Exploration Queries (`lib/queries/exploration.ts`)

New file with server functions:

1. **`listExplorableUniversities()`** — returns all active, verified institutions except the user's own. Includes programme and course counts.

2. **`getUniversityForExploration(slug)`** — returns institution with faculties and programmes (metadata only, no private content).

3. **`getProgrammeForExploration(institutionSlug, programmeCode)`** — returns programme with courses grouped by year. Course metadata only (code, name, description, material counts).

4. **`getCourseForExploration(institutionSlug, courseCode)`** — the core query:
   - First finds the course to get its institutionId via Programme
   - Checks if user is a member of that institution
   - If member: returns all content
   - If exploring: returns only items where `isPreview=true` (limited: 2 slides, 2 tutorials, 1 past paper, 1 test, 1 assignment)
   - Always includes `_count` for each material type to show locked counts
   - Returns `viewerCanAccessFullContent` and `viewerIsExploring` flags

**Key correction from issue:** The issue mentions `tutorAssignments` but the actual relation is `tutorSpecialties` → `Tutor`. Queries will use `tutorSpecialties` with `tutor` nested select.

### Exploration Pages

All pages are Server Components (no `'use client'` unless interactivity is needed):

1. **`app/(dashboard)/explore/page.tsx`** — University grid
   - Fetches `listExplorableUniversities()`
   - Grid of cards: logo, name, shortName, city, programme/course counts, "Browse" button
   - Empty state if no other universities

2. **`app/(dashboard)/explore/[slug]/page.tsx`** — University overview
   - Hero: logo, name, description, location, website
   - Stats: programme count, course count, faculty count
   - Tabs: Overview | Programmes | Faculties
   - Clickable programme list

3. **`app/(dashboard)/explore/[slug]/programmes/[code]/page.tsx`** — Programme detail
   - Breadcrumb: Explore > University > Programme
   - Programme header (name, code, duration, faculty)
   - Courses grouped by year
   - Each course: code, name, description, [Preview] button

4. **`app/(dashboard)/explore/[slug]/courses/[code]/page.tsx`** — Course preview
   - Breadcrumb
   - Course header (name, code, year, programme)
   - Tutor card(s) from `tutorSpecialties`
   - Preview content section (materials where `isPreview=true`)
   - Locked section with counts (🔒 "14 more lectures", etc.)
   - CTA: [Contact tutor] [Back to my dashboard]

### Components

1. **`components/exploration-banner.tsx`** — `'use client'`
   - Amber/yellow background, sticky at top
   - "You're exploring [University]. Read-only."
   - [Exit exploration] button → `/student`

2. **`components/contact-tutor-dialog.tsx`** — `'use client'`
   - Opens when student clicks "Contact tutor"
   - Select tutor dropdown (from course's `tutorSpecialties`)
   - Subject pre-filled: "Access request for [Course Name]"
   - Message textarea with default message
   - On submit: creates a `TutorRequest` via Prisma, shows success toast

3. **`components/university-explore-card.tsx`** — Server component
   - University card with logo, name, city, counts

4. **`components/course-locked-section.tsx`** — Server component
   - Shows locked material counts with lock icons

5. **`components/preview-material-card.tsx`** — Server component
   - Renders a preview material with type-specific display

### Integration Changes

1. **`components/DashboardLayout.tsx`** — Add to `studentNavItems`:
   ```
   { href: '/explore', label: 'Explore Universities', icon: Compass, section: 'Discovery' }
   ```
   Import `Compass` from lucide-react.

2. **`components/StudentContent.tsx`** — Add explore action card:
   ```
   {
     icon: <Compass className="w-6 h-6 text-indigo-500" />,
     bg: 'bg-indigo-50',
     title: 'Explore Universities',
     subtitle: 'Browse other institutions',
     href: '/explore',
   }
   ```

3. **Public university page** — Create `app/universities/[slug]/page.tsx`:
   - Shows public institution info
   - If logged in: "Explore courses →" CTA to `/explore/[slug]`
   - If not logged in: "Sign up to explore" CTA

### Exploration Logging (`lib/analytics/exploration.ts`)

New file with `logExplorationView()` server function:
- Creates `ExplorationLog` record
- Wrapped in try/catch — never fails the request if logging fails
- Called from each exploration page

### Security

- Every query is scoped by `institutionId`
- `isPreview` enforced server-side in queries (not client-side filtering)
- `verifyResourceBelongsToInstitution()` prevents IDOR
- Non-members never receive full content in API responses
- Rate limiting via Upstash (if available) on exploration views