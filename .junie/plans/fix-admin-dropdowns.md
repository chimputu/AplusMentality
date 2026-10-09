---
sessionId: session-261009-140720-1h8c
---

# Requirements

### Overview
Admin forms across the app have broken dropdowns — universities, programmes, and courses don't appear in their select fields. This is caused by three issues:
1. **Missing API routes** — faculty, level, and period dropdowns call endpoints that don't exist
2. **Inconsistent API response shapes** — some APIs return `{ institutions }`, others `{ programmes }`, others a raw array
3. **Old form patterns** — some forms still use server-side props or inline fetches instead of the shared `DataSelect` component

Additionally, the **search bar** in the dashboard header is hidden on mobile phones.

### Goals
- Every dropdown in every admin form loads its data reliably
- Single source of truth for all dropdown data fetching
- Consistent API response shape: `{ data: [...], count: N }`
- All forms use the shared `DataSelect` component with typed wrappers
- Search bar visible on all screen sizes

### Scope

**In Scope:**
- Create 3 missing API routes (faculties, levels, periods)
- Standardize all dropdown API response shapes
- Create `lib/data/dropdowns.ts` as single source of truth
- Update all 8 typed wrappers to handle the new response shape
- Add 2 missing wrappers (branch, student)
- Migrate 14+ admin forms to use shared wrappers
- Fix mobile search bar visibility
- Add client-side search filtering to DataSelect

**Out of Scope:**
- Creating new data in the database
- Changing the Prisma schema
- Modifying student-facing forms

# Technical Design

### Current Implementation

**Existing Components:**
- `components/ui/data-select.tsx` — Generic dropdown with loading/error/empty states, uses native `<select>`
- `components/ui/selects/` — 8 typed wrappers (institution, programme, course, faculty, level, period, tutor, question)

**Existing API Routes:**
- `app/api/institutions/picker/route.ts` — returns `{ institutions }`
- `app/api/institutions/[id]/programmes/route.ts` — returns `{ programmes }`
- `app/api/courses/route.ts` — returns array or `{ error }`
- `app/api/admin/tutors/route.ts` — returns `{ tutors }` or array
- `app/api/admin/universities/route.ts` — returns array
- `app/api/admin/programmes/route.ts` — exists

**Missing API Routes:**
- `app/api/admin/faculties/route.ts` — referenced by FacultySelect but doesn't exist
- `app/api/admin/levels/route.ts` — referenced by LevelSelect but doesn't exist
- `app/api/admin/periods/route.ts` — referenced by PeriodSelect but doesn't exist

**Form Patterns Found:**
1. **Server-side props** (tutors/new, programmes/new) — Prisma fetch in page, passed as props
2. **Inline fetch** (assessments/new, VideoUploadForm) — `fetch()` inside component or DataSelect's `fetchFn`
3. **Already using wrappers** (courses/new) — uses ProgrammeSelect, DataSelect

### Key Decisions

1. **Keep DataSelect as the base** — It already handles loading, error, empty, prerequisite states well. No need to replace it.
2. **Standardize API shape to `{ data, count }`** — All dropdown APIs will return this shape. Wrappers will parse `json.data ?? []`.
3. **Keep `fetchFn` pattern in wrappers** — Wrappers use client-side `fetch()` rather than server actions, since DataSelect is a client component.
4. **Add search filtering to DataSelect** — A `search` prop that filters items client-side, useful for large dropdowns.
5. **Fix search bar with CSS** — Change `hidden md:flex` to `flex` in DashboardLayout.tsx.

### Proposed Changes

**Phase 1 — API Routes:**
- Create 3 missing routes following the existing pattern
- Update existing routes to return `{ data, count }` shape
- All routes filter by institutionId/programmeId query params where applicable

**Phase 2 — Data Layer:**
- Create `lib/data/dropdowns.ts` with server-side fetch functions
- These serve as the canonical query definitions for each entity
- API routes will call these functions

**Phase 3 — Component Updates:**
- Update all 8 typed wrappers to parse `{ data }` from API responses
- Add `branch-select.tsx` and `student-select.tsx`
- Add `search` prop to DataSelect for client-side filtering

**Phase 4 — Form Migration:**
- Replace server-side props with wrappers in tutor and programme forms
- Replace inline fetches with wrappers in VideoUploadForm and assessments
- Migrate all remaining forms (lecture-slides, past-papers, tests, quizzes, assignments, questions)

**Phase 5 — Search Bar:**
- Fix `hidden md:flex` to `flex` in DashboardLayout.tsx line 434

### File Structure

```
Files to CREATE:
  lib/data/dropdowns.ts
  app/api/admin/faculties/route.ts
  app/api/admin/levels/route.ts
  app/api/admin/periods/route.ts
  components/ui/selects/branch-select.tsx
  components/ui/selects/student-select.tsx

Files to UPDATE:
  components/ui/data-select.tsx (add search prop)
  components/ui/selects/institution-select.tsx
  components/ui/selects/programme-select.tsx
  components/ui/selects/faculty-select.tsx
  components/ui/selects/course-select.tsx
  components/ui/selects/level-select.tsx
  components/ui/selects/period-select.tsx
  components/ui/selects/tutor-select.tsx
  components/ui/selects/question-select.tsx
  components/DashboardLayout.tsx (search bar fix)
  app/api/institutions/picker/route.ts
  app/api/institutions/[id]/programmes/route.ts
  app/api/courses/route.ts
  app/api/admin/tutors/route.ts
  components/VideoUploadForm.tsx
  app/(dashboard)/admin/tutors/new/page.tsx
  app/(dashboard)/admin/tutors/new/_components/new-tutor-form.tsx
  app/(dashboard)/admin/programmes/new/page.tsx
  app/(dashboard)/admin/programmes/new/_components/new-programme-form.tsx
  app/(dashboard)/admin/assessments/new/page.tsx
  app/(dashboard)/admin/lecture-slides/create/page.tsx
  app/(dashboard)/admin/past-papers/create/page.tsx
  app/(dashboard)/admin/tests/create/page.tsx
  app/(dashboard)/admin/quizzes/create/page.tsx
  app/(dashboard)/admin/assignments/create/page.tsx
  app/(dashboard)/admin/questions/new/page.tsx
```

# Delivery Steps

### ✓ Step 1: Fix missing API routes and standardize response shapes
Create the 3 missing API routes and standardize all dropdown API responses to `{ data, count }` shape.
- Create `app/api/admin/faculties/route.ts` — GET returns faculties filtered by institutionId
- Create `app/api/admin/levels/route.ts` — GET returns academic levels filtered by institutionId
- Create `app/api/admin/periods/route.ts` — GET returns academic periods filtered by institutionId
- Update `app/api/institutions/picker/route.ts` to return `{ data, count }` instead of `{ institutions }`
- Update `app/api/institutions/[id]/programmes/route.ts` to return `{ data, count }` instead of `{ programmes }`
- Update `app/api/courses/route.ts` GET to return `{ data, count }` when `all=true` param is present
- Update `app/api/admin/tutors/route.ts` GET to return `{ data, count }` shape
- Update `app/api/questions/route.ts` (if exists) to return `{ data, count }` shape

### ✓ Step 2: Create shared data layer and improve DataSelect
Create the single source of truth for all dropdown data fetchers and enhance the base component.
- Create `lib/data/dropdowns.ts` with all server-side fetch functions (institutions, programmes, faculties, courses, levels, periods, tutors, students, branches, questions)
- Each function uses Prisma directly with consistent `select` clauses and `orderBy`
- Add `search` prop support to `components/ui/data-select.tsx` — filters items client-side when a search query is provided
- Add `filter` prop to DataSelect for custom filtering logic
- Keep the existing `fetchFn` pattern so wrappers can still use client-side fetches

### ✓ Step 3: Fix mobile search bar and update typed wrappers
Fix the search bar visibility on mobile and update all typed wrappers to use the new API response shape.
- Fix `components/DashboardLayout.tsx` line 434: change `hidden md:flex` to `flex` for the search section to show on all screen sizes
- Update `components/ui/selects/institution-select.tsx` to parse `{ data }` from API response
- Update `components/ui/selects/programme-select.tsx` to parse `{ data }` from API response
- Update `components/ui/selects/faculty-select.tsx` to parse `{ data }` from API response
- Update `components/ui/selects/course-select.tsx` to parse `{ data }` from API response
- Update `components/ui/selects/level-select.tsx` to parse `{ data }` from API response
- Update `components/ui/selects/period-select.tsx` to parse `{ data }` from API response
- Update `components/ui/selects/tutor-select.tsx` to parse `{ data }` from API response
- Update `components/ui/selects/question-select.tsx` to parse `{ data }` from API response
- Add missing wrappers: `branch-select.tsx` and `student-select.tsx`

### * Step 4: Migrate tutor and programme forms
Replace server-side props pattern with shared dropdown wrappers in tutor and programme forms.
- Migrate `app/(dashboard)/admin/tutors/new/page.tsx` — remove server-side Prisma fetch, pass no props
- Migrate `app/(dashboard)/admin/tutors/new/_components/new-tutor-form.tsx` — replace native `<select>` dropdowns with `<InstitutionSelect />`, `<ProgrammeSelect />`, `<BranchSelect />` and use `<DataSelect>` for courses
- Migrate `app/(dashboard)/admin/programmes/new/page.tsx` — remove server-side fetch
- Migrate `app/(dashboard)/admin/programmes/new/_components/new-programme-form.tsx` — replace native `<select>` with `<InstitutionSelect />` and `<FacultySelect />`

###   Step 5: Migrate video upload form
Replace inline fetch logic with shared dropdown wrappers in the video upload form.
- Migrate `components/VideoUploadForm.tsx` — replace inline `fetch()` calls and `<select>` dropdowns with `<InstitutionSelect />`, `<ProgrammeSelect />`, and `<CourseSelect />`
- Remove `universities` prop and all related `useEffect` fetch logic
- Keep the academic scoping UI (year, period, course mode) but use the shared components for entity selection

###   Step 6: Migrate remaining admin forms
Migrate all remaining admin forms to use shared dropdown wrappers.
- Migrate `app/(dashboard)/admin/assessments/new/page.tsx` — replace inline `fetchCourses` with `<CourseSelect />`
- Migrate `app/(dashboard)/admin/lecture-slides/create/page.tsx` — use `<CourseSelect />`
- Migrate `app/(dashboard)/admin/past-papers/create/page.tsx` — use `<CourseSelect />`
- Migrate `app/(dashboard)/admin/tests/create/page.tsx` — use `<CourseSelect />`
- Migrate `app/(dashboard)/admin/quizzes/create/page.tsx` — use `<CourseSelect />`
- Migrate `app/(dashboard)/admin/assignments/create/page.tsx` — use `<CourseSelect />`
- Migrate `app/(dashboard)/admin/questions/new/page.tsx` — use `<CourseSelect />`
- For each form: remove old `useState` for dropdown data, remove old `useEffect` fetches, use the wrapper instead