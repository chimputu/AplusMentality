---
sessionId: session-261025-171810-1pct
---

# Requirements

### Overview & Goals

Transform the student Videos page from a flat, client-side accordion of all videos into a **Course Directory** pattern (like Netflix categories):
1. The landing page (`/student/videos`) shows a grid of **Course cards** (each card = one course that has videos).
2. Clicking a course navigates to `/student/videos/[courseId]`, which shows **all videos for that course**.

This improves discoverability: students see their courses first, then drill into the videos they actually care about.

### Scope

**In Scope:**
- Rewrite `/student/videos/page.tsx` as a server component that fetches and displays scoped course cards.
- Create `/student/videos/[courseId]/page.tsx` as a server component that fetches and displays videos for a specific course.
- Server-side auth (`requireAuth`) and data scoping (`getScopeContext` + `buildCourseScopeWhere`) on both pages.
- IDOR protection on the `[courseId]` page: 404 if the course doesn't belong to the student's university.
- Reuse the existing `StudentVideoList` component for rendering videos.

**Out of Scope:**
- Changes to the video upload API (`/api/videos/route.ts`).
- Changes to the `StudentVideoList` component itself.
- Pagination (assume courses/videos fit on one page for now).
- Search or filtering within the video list.

### User Stories

- As a student, I want to see a grid of my courses on the Videos page so I can quickly find the subjects I care about.
- As a student, I want to click a course and see only its videos so I'm not overwhelmed by unrelated content.
- As a student, I should never see videos from courses that don't belong to my university (data isolation).

### Functional Requirements

1. **Course Directory Page** (`/student/videos/page.tsx`):
   - Fetches distinct courses that have at least one video, scoped to the student's `universityId`, `year`, and `period`.
   - Displays each course as a card showing: Course Code, Course Title, Video Count.
   - Clicking a card navigates to `/student/videos/[courseId]`.
   - Shows an empty state if no courses have videos.

2. **Course Video Page** (`/student/videos/[courseId]/page.tsx`):
   - Fetches all videos where `courseId === params.courseId` AND the course belongs to the student's university.
   - Displays videos using the existing `StudentVideoList` component.
   - Includes a "Back to Videos" link.
   - Returns 404 if the course doesn't exist, isn't published, or doesn't belong to the student's university.

3. **Data Isolation:**
   - Both pages use `requireAuth(['STUDENT'])` for auth.
   - Both pages use `getScopeContext()` to resolve the student's academic scope.
   - The `[courseId]` page uses `isResourceInScope()` to verify the course belongs to the student's university before rendering.

# Technical Design

### Current Implementation

**`app/(dashboard)/student/videos/page.tsx`** (190 lines):
- Client component (`'use client'`).
- Fetches videos via `fetch('/api/videos')` in a `useEffect`.
- Groups videos by course client-side using `reduce()`.
- Renders an accordion UI (expandable course headers).
- **No server-side auth** — relies on the API route's `getAuthUser()` check.
- **No data scoping** — fetches all videos for any university filter passed via search params.

**`app/api/videos/route.ts`** (GET handler):
- Supports `courseId`, `institutionId`, and `university` query params.
- Uses `getAuthUser()` for auth (less strict than `requireAuth`).
- Returns videos with included `course` and `uploader` data.

**`components/StudentVideoList.tsx`** (150 lines):
- Client component that renders a grid of video cards.
- Accepts `videos: Video[]` prop.
- Handles YouTube embeds and direct video playback.
- **Will be reused unchanged** on the new `[courseId]` page.

**Auth/Scoping Pattern** (from `student/courses/page.tsx` and `student/courses/[courseId]/page.tsx`):
- `requireAuth(['STUDENT'])` — ensures the user is authenticated and a student.
- `getScopeContext()` — resolves the user's `universityId`, `year`, `period`.
- `buildCourseScopeWhere(scope)` — builds a Prisma `where` clause filtering by university/year/period.
- `isResourceInScope(scope, resourceUniversityId)` — IDOR check: returns `true` if the resource belongs to the user's university.

### Key Decisions

1. **Convert to Server Components:** Both pages will be async server components (no `'use client'`), following the pattern established by `student/courses/page.tsx` and `student/courses/[courseId]/page.tsx`. This eliminates the client-side fetch, improves SEO, and enables server-side auth.

2. **Direct Prisma queries instead of API route:** Instead of calling `/api/videos` from the client, the server pages will query Prisma directly. This is consistent with how `student/courses/page.tsx` works and avoids an extra network round-trip.

3. **Reuse `StudentVideoList`:** The existing video grid component will be reused on the `[courseId]` page. No changes needed to it.

4. **Distinct courses query:** The landing page will use a Prisma query that fetches courses (not videos) and includes a `_count` of videos, rather than fetching all videos and grouping client-side. This is more efficient.

### Proposed Changes

#### 1. Rewrite `/student/videos/page.tsx` — Course Directory

**New implementation:**
- Convert to an async server component.
- Call `requireAuth(['STUDENT'])` and `getScopeContext()`.
- Query Prisma for distinct courses that have videos, scoped to the user's university/year/period:
  ```ts
  const courses = await prisma.course.findMany({
    where: {
      ...buildCourseScopeWhere(scope),
      isPublished: true,
      videos: { some: {} }, // only courses with at least one video
    },
    select: {
      id: true,
      code: true,
      title: true,
      _count: { select: { videos: true } },
    },
    orderBy: { title: 'asc' },
  });
  ```
- Render a grid of course cards (Link components to `/student/videos/[courseId]`).
- Each card shows: course code (badge), course title, video count.
- Empty state if no courses have videos.

#### 2. Create `/student/videos/[courseId]/page.tsx` — Course Video List

**New file:**
- Async server component.
- Call `requireAuth(['STUDENT'])` and `getScopeContext()`.
- Fetch the course by ID with error handling.
- **IDOR check:** `if (!isResourceInScope(scope, course.universityId ?? null)) notFound();`
- Fetch videos for the course:
  ```ts
  const videos = await prisma.video.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      uploader: { select: { name: true } },
    },
  });
  ```
- Render a "Back to Videos" link + `StudentVideoList` with the videos.
- Convert `DateTime` fields to ISO strings (matching the existing pattern).

### Architecture Diagram

``` mermaid
graph LR
  A[Student navigates to /student/videos] --> B[Course Directory Page]
  B --> C{requireAuth + getScopeContext}
  C --> D[Prisma: findMany courses
    where videos.some + scope]
  D --> E[Grid of Course Cards]
  E --> F[Student clicks a course]
  F --> G[Course Video Page
    /student/videos/[courseId]]
  G --> H{requireAuth + getScopeContext
    + isResourceInScope IDOR check}
  H --> I[Prisma: findMany videos
    where courseId]
  I --> J[StudentVideoList component]
```

### File Structure

| File | Action | Description |
|------|--------|-------------|
| `app/(dashboard)/student/videos/page.tsx` | **Modify** | Rewrite as server component — course directory grid |
| `app/(dashboard)/student/videos/[courseId]/page.tsx` | **Create** | New server component — video list for a course |

### Data Models / Contracts

**Course Directory Query:**
```ts
const courses = await prisma.course.findMany({
  where: {
    ...buildCourseScopeWhere(scope),
    isPublished: true,
    videos: { some: {} },
  },
  select: {
    id: true,
    code: true,
    title: true,
    _count: { select: { videos: true } },
  },
  orderBy: { title: 'asc' },
});
```

**Course Video Query:**
```ts
const videos = await prisma.video.findMany({
  where: { courseId },
  orderBy: { order: 'asc' },
  include: {
    uploader: { select: { name: true } },
  },
});
```

# Testing

### Key Scenarios

1. **Course Directory loads:** Navigate to `/student/videos`. The page shows a grid of course cards, each with code, title, and video count.
2. **Course card navigation:** Click a course card. Navigate to `/student/videos/[courseId]`.
3. **Video list loads:** The course video page shows all videos for that course in a grid.
4. **Back button works:** Click "Back to Videos". Navigate back to `/student/videos`.
5. **Empty state:** If no courses have videos, the directory shows an empty state message.
6. **No videos for course:** If a course has no videos (edge case), the video page shows an empty state.

### Edge Cases

- **IDOR protection:** A student tries to access `/student/videos/<foreign-course-id>` for a course from another university. The page returns 404.
- **Non-existent course:** Accessing `/student/videos/<invalid-id>` returns 404.
- **Unpublished course:** Accessing a course with `isPublished: false` returns 404.
- **Student without university profile:** The student layout already redirects to `/onboarding` if the profile is incomplete.

### Validation Approach

- Verify the Prisma queries are correctly scoped by checking the generated SQL includes `universityId`, `year`, and `period` filters.
- Verify the IDOR check by manually testing with a course ID from a different university.
- Verify the `StudentVideoList` component receives the correct data shape (matching its interface).

# Delivery Steps

### ✓ Step 1: Rewrite the Course Directory landing page
Convert `/student/videos/page.tsx` from a client component to a server component that displays a grid of course cards.

- Remove `'use client'` directive and all client-side state/fetching.
- Add `requireAuth(['STUDENT'])` and `getScopeContext()` calls.
- Query Prisma for courses that have videos, scoped to the student's university/year/period using `buildCourseScopeWhere()`.
- Render a responsive grid of course cards (Link components to `/student/videos/[courseId]`).
- Each card shows: course code badge, course title, and video count.
- Add an empty state when no courses have videos.
- Follow the styling patterns from `student/courses/page.tsx` (card design, spacing, dark mode support).

### ✓ Step 2: Create the Course Video detail page
Create `/student/videos/[courseId]/page.tsx` as a new server component that displays all videos for a specific course.

- Create the new file at `app/(dashboard)/student/videos/[courseId]/page.tsx`.
- Add `requireAuth(['STUDENT'])` and `getScopeContext()` calls.
- Fetch the course by ID, then verify ownership via `isResourceInScope(scope, course.universityId)`.
- Call `notFound()` if the course doesn't exist, isn't published, or fails the IDOR check.
- Fetch videos for the course (ordered by `order` field), including uploader info.
- Convert `DateTime` fields to ISO strings (matching the existing pattern in `student/courses/[courseId]/page.tsx`).
- Render a "Back to Videos" link (ArrowLeft icon + Link to `/student/videos`).
- Pass the videos array to the existing `StudentVideoList` component.
- Add an empty state when the course has no videos.