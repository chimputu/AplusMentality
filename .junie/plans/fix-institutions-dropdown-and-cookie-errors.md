---
sessionId: session-261025-171810-1pct

---

### ✓ Step 1: Create lecturer layout, dashboard page, and navigation

### ✓ Step 2: Create lecturer content management pages

### ✓ Step 3: Create lecturer grades and enrollments pages

# Requirements

### Overview & Goals

Create a **dedicated Lecturer Dashboard** at `/lecturer` with lecturer-specific navigation, content, and features. The LECTURER role currently exists in the database but shares the Tutor dashboard — it has no identity of its own. The new dashboard will focus on **teaching** rather than **tutoring**: content management, assessments, announcements, student grades, and course enrollment views.

### Scope

**In Scope:**
- Create a new `/lecturer` route group with layout and dashboard page.
- Create `LecturerContent` component (analogous to `TutorContent`) showing lecturer-specific stats and quick actions.
- Add Lecturer-specific navigation items in `DashboardLayout`.
- Wire up role-based redirect so LECTURER users go to `/lecturer` after login.
- Lecturer pages for: Courses (their courses), Videos, Lecture Slides, Past Papers, Assignments, Quizzes, Tests, Announcements, Student Grades, and Course Enrollments.
- All pages use `requireAuth(['LECTURER'])` and filter content by `createdBy === lecturer.clerkId`.

**Out of Scope:**
- Tutoring-specific features (requests, specialties, offerings, reviews) — these remain exclusive to the TUTOR role.
- A separate Lecturer database model — the existing `User` model with `role: 'LECTURER'` is sufficient.
- Changes to the Tutor dashboard — it remains unchanged.

### User Stories

- As a lecturer, I want to land on a dashboard that shows my courses, recent activity, and quick actions — not tutoring features.
- As a lecturer, I want to manage the content I created (courses, videos, slides, papers, assessments).
- As a lecturer, I want to see student grades for my assessments.
- As a lecturer, I want to see which students are enrolled in my courses.
- As a lecturer, I want to post announcements to my students.

### Functional Requirements

1. **Lecturer Dashboard Home** (`/lecturer/page.tsx`):
   - Welcome header with lecturer's name and institution.
   - Stats cards: number of courses, total enrollments, total assessments, recent submissions.
   - Quick action links to create content.
   - Recent activity feed (recent submissions, enrollments).

2. **Lecturer Navigation** (in `DashboardLayout`):
   - Overview → Dashboard
   - Content → Courses, Videos, Lecture Slides, Past Papers
   - Assessments → Quizzes, Tests, Assignments
   - Students → Grades, Enrollments
   - Communication → Announcements
   - Account → Settings

3. **Content Management Pages** (reuse tutor page patterns):
   - Each page fetches resources where `createdBy === lecturer.clerkId`.
   - Same CRUD operations as tutor pages but scoped to the lecturer's own content.

4. **Student Grades Page** (`/lecturer/grades/page.tsx`):
   - Lists all assessments created by the lecturer.
   - Shows student attempts with scores, percentages, and pass/fail status.

5. **Course Enrollments Page** (`/lecturer/enrollments/page.tsx`):
   - Lists all courses created by the lecturer.
   - Shows enrolled students with names, emails, and enrollment dates.

# Technical Design

### Current Implementation

**Existing role dashboards:**
- `/admin` — Admin dashboard with `AdminContent` component, manages all content.
- `/tutor` — Tutor dashboard with `TutorContent` component, manages tutoring + content.
- `/student` — Student dashboard, consumes content.

**Lecturer role today:**
- `LECTURER` is defined in the `Role` enum in `prisma/schema.prisma`.
- LECTURER users are redirected to `/tutor` after login (`app/page.tsx`).
- LECTURER can access all tutor pages (`requireAuth(['TUTOR', 'LECTURER'])`).
- LECTURER sees the same `tutorNavItems` in `DashboardLayout`.
- No lecturer-specific pages, components, or navigation exist.

**Key patterns to follow:**
- `app/(dashboard)/tutor/layout.tsx` — Layout wrapper with `requireAuth`, `DashboardLayout`, and `AIAssistantWrapper`.
- `app/(dashboard)/tutor/page.tsx` — Server component that fetches data and renders `TutorContent`.
- `components/TutorContent.tsx` — Client component with stats, quick actions, and recent activity.
- Tutor content pages (e.g., `tutor/courses/page.tsx`) — Server components with `requireAuth` + `getScopeContext` + `buildCourseResourceScopeWhere`.

**Data relationships for Lecturer scoping:**
- `Course.createdBy` → `User.clerkId` — lecturer's courses
- `Video.uploadedBy` → `User.clerkId` — lecturer's videos
- `LectureSlide.createdBy` → `User.clerkId` — lecturer's slides
- `PastPaper.createdBy` → `User.clerkId` — lecturer's papers
- `Quiz.createdBy` → `User.clerkId` — lecturer's quizzes
- `Test.createdBy` → `User.clerkId` — lecturer's tests
- `Assignment.createdBy` → `User.clerkId` — lecturer's assignments
- `Assessment.createdBy` → `User.clerkId` — lecturer's assessments
- `Announcement.createdBy` → `User.clerkId` — lecturer's announcements
- `Enrollment.courseId` → `Course` → `createdBy` — enrollments in lecturer's courses
- `AssessmentAttempt.assessmentId` → `Assessment` → `createdBy` — attempts on lecturer's assessments

### Key Decisions

1. **New route group `app/(dashboard)/lecturer/`** — A separate route group (not a subpath of `/tutor`) gives lecturers their own URL space and layout. This matches the existing pattern where `/admin`, `/tutor`, and `/student` are parallel route groups.

2. **`LecturerContent` component** — Mirrors `TutorContent` but shows teaching-focused stats (courses, enrollments, assessments, submissions) instead of tutoring stats (requests, specialties, offerings).

3. **Content scoping by `createdBy`** — Unlike the Tutor dashboard (which uses `getScopeContext()` + `buildCourseResourceScopeWhere` to scope by university/programme/year), the Lecturer dashboard scopes content by the lecturer's own `clerkId` via the `createdBy` field. This is simpler and more accurate — a lecturer sees only what they created.

4. **Reuse existing page patterns** — Content management pages (videos, slides, etc.) will follow the exact same structure as their tutor counterparts, only changing the `requireAuth` role and the `where` clause from scope-based to `createdBy`-based.

5. **New pages: Grades and Enrollments** — These are unique to the lecturer role. They query `AssessmentAttempt` and `Enrollment` models, joining through the lecturer's assessments/courses.

### Proposed Changes

#### 1. Create `/lecturer` route group

**New file: `app/(dashboard)/lecturer/layout.tsx`**
- `requireAuth(['LECTURER'])` for auth.
- Wrap children in `DashboardLayout` with `role={role}`.
- Include `AIAssistantWrapper`.

**New file: `app/(dashboard)/lecturer/page.tsx`**
- Server component.
- Fetch lecturer's user data from `prisma.user`.
- Compute stats: courses count, total enrollments, assessments count, recent submissions.
- Render `LecturerContent` component.

#### 2. Create `LecturerContent` component

**New file: `components/LecturerContent.tsx`**
- Client component (like `TutorContent`).
- Welcome header with lecturer's name and institution.
- Stats grid: Courses, Enrollments, Assessments, Submissions.
- Quick action cards linking to content management pages.
- Recent activity section.

#### 3. Add Lecturer navigation items

**Modify: `components/DashboardLayout.tsx`**
- Add `lecturerNavItems` array with sections: Overview, Content, Assessments, Students, Communication, Account.
- Update nav item selection logic: `else if (role === 'LECTURER') { navItems = lecturerNavItems; }`.

#### 4. Update role-based redirects

**Modify: `app/page.tsx`**
- Add `role === 'LECTURER'` → redirect to `/lecturer` (separate from TUTOR).

**Modify: `app/(dashboard)/student/page.tsx`**
- Add `dbUser?.role === 'LECTURER'` → redirect to `/lecturer`.

#### 5. Create Lecturer content pages

Each page follows the pattern:
```ts
export default async function LecturerXxxPage() {
  const { userId } = await requireAuth(['LECTURER']);
  // Fetch resources where createdBy === userId
  // Render with existing components or new lecturer-specific UI
}
```

**New files:**
- `app/(dashboard)/lecturer/courses/page.tsx` — Lecturer's courses (createdBy filter)
- `app/(dashboard)/lecturer/videos/page.tsx` — Lecturer's videos
- `app/(dashboard)/lecturer/lecture-slides/page.tsx` — Lecturer's slides
- `app/(dashboard)/lecturer/past-papers/page.tsx` — Lecturer's papers
- `app/(dashboard)/lecturer/assignments/page.tsx` — Lecturer's assignments
- `app/(dashboard)/lecturer/quizzes/page.tsx` — Lecturer's quizzes
- `app/(dashboard)/lecturer/tests/page.tsx` — Lecturer's tests
- `app/(dashboard)/lecturer/announcements/page.tsx` — Lecturer's announcements
- `app/(dashboard)/lecturer/grades/page.tsx` — Student grades for lecturer's assessments
- `app/(dashboard)/lecturer/enrollments/page.tsx` — Enrollments in lecturer's courses

#### 6. Update API routes for LECTURER role

The content API routes already support `LECTURER` (added in the previous LECTURER role update). No changes needed.

### Architecture Diagram

``` mermaid
graph LR
  A[Lecturer logs in] --> B{app/page.tsx}
  B -->|role=LECTURER| C[Redirect to /lecturer]
  C --> D[Lecturer Layout
    requireAuth LECTURER]
  D --> E[LecturerContent
    Stats + Quick Actions]
  D --> F[Content Pages
    Courses Videos Slides Papers]
  D --> G[Assessment Pages
    Quizzes Tests Assignments]
  D --> H[Student Pages
    Grades Enrollments]
  D --> I[Announcements]
  F --> J[Filter by createdBy]
  G --> J
  H --> K[Join through lecturer's
    courses/assessments]
  I --> J
```

### File Structure

| File | Action | Description |
|------|--------|-------------|
| `app/(dashboard)/lecturer/layout.tsx` | **Create** | Layout wrapper with auth and DashboardLayout |
| `app/(dashboard)/lecturer/page.tsx` | **Create** | Dashboard home — fetches stats, renders LecturerContent |
| `components/LecturerContent.tsx` | **Create** | Client component with stats, quick actions, activity |
| `app/(dashboard)/lecturer/courses/page.tsx` | **Create** | Lecturer's courses |
| `app/(dashboard)/lecturer/videos/page.tsx` | **Create** | Lecturer's videos |
| `app/(dashboard)/lecturer/lecture-slides/page.tsx` | **Create** | Lecturer's lecture slides |
| `app/(dashboard)/lecturer/past-papers/page.tsx` | **Create** | Lecturer's past papers |
| `app/(dashboard)/lecturer/assignments/page.tsx` | **Create** | Lecturer's assignments |
| `app/(dashboard)/lecturer/quizzes/page.tsx` | **Create** | Lecturer's quizzes |
| `app/(dashboard)/lecturer/tests/page.tsx` | **Create** | Lecturer's tests |
| `app/(dashboard)/lecturer/announcements/page.tsx` | **Create** | Lecturer's announcements |
| `app/(dashboard)/lecturer/grades/page.tsx` | **Create** | Student grades for lecturer's assessments |
| `app/(dashboard)/lecturer/enrollments/page.tsx` | **Create** | Enrollments in lecturer's courses |
| `components/DashboardLayout.tsx` | **Modify** | Add lecturerNavItems, update role routing |
| `app/page.tsx` | **Modify** | Redirect LECTURER to `/lecturer` |
| `app/(dashboard)/student/page.tsx` | **Modify** | Redirect LECTURER away from student page |

### Data Models / Contracts

**Lecturer Stats Query:**
```ts
const stats = await Promise.all([
  // Courses created by lecturer
  prisma.course.count({ where: { createdBy: clerkId } }),
  // Total enrollments in lecturer's courses
  prisma.enrollment.count({
    where: { course: { createdBy: clerkId } },
  }),
  // Assessments created by lecturer
  prisma.assessment.count({ where: { createdBy: clerkId } }),
  // Recent submissions
  prisma.assessmentAttempt.count({
    where: { assessment: { createdBy: clerkId } },
  }),
]);
```

**Grades Query:**
```ts
const attempts = await prisma.assessmentAttempt.findMany({
  where: { assessment: { createdBy: clerkId } },
  include: {
    user: { select: { name: true, email: true } },
    assessment: { select: { title: true, maxGrade: true } },
  },
  orderBy: { submittedAt: 'desc' },
  take: 50,
});
```

**Enrollments Query:**
```ts
const enrollments = await prisma.enrollment.findMany({
  where: { course: { createdBy: clerkId } },
  include: {
    user: { select: { name: true, email: true } },
    course: { select: { title: true, code: true } },
  },
  orderBy: { enrolledAt: 'desc' },
});
```

# Testing

### Key Scenarios

1. **Lecturer login redirect:** A user with `role: 'LECTURER'` logs in and is redirected to `/lecturer` (not `/tutor`).
2. **Dashboard loads:** The lecturer dashboard shows stats for courses, enrollments, assessments, and submissions.
3. **Navigation works:** Clicking nav items routes to the correct lecturer pages.
4. **Content pages show only lecturer's content:** Videos, courses, etc. are filtered by `createdBy`.
5. **Grades page shows attempts:** Student attempts on the lecturer's assessments are displayed with scores.
6. **Enrollments page shows students:** Students enrolled in the lecturer's courses are listed.
7. **Tutor cannot access lecturer pages:** A TUTOR role user gets 403/redirect when accessing `/lecturer`.
8. **Lecturer cannot access tutor pages:** A LECTURER role user gets 403/redirect when accessing `/tutor`.

### Edge Cases

- **Lecturer with no courses:** Dashboard shows zero stats and empty states.
- **Lecturer with no submissions:** Grades page shows "No submissions yet".
- **Lecturer with no enrollments:** Enrollments page shows "No enrollments yet".
- **Lecturer accessing student page:** Redirected to `/lecturer`.

### Validation Approach

- Verify `requireAuth(['LECTURER'])` blocks non-lecturer roles.
- Verify `createdBy` filtering returns only the lecturer's own content.
- Verify the grades and enrollments queries correctly join through the lecturer's assessments/courses.
- Verify navigation items match the lecturer's role and don't include tutoring features.