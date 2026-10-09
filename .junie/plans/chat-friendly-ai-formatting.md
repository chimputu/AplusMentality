---
sessionId: session-261009-111027-sqi2
---

# Requirements

### Overview & Goals
Two issues need to be addressed:

**Issue 1: Chat-friendly AI formatting** — COMPLETED ✓
The AI assistant's responses now use clean, natural formatting (bold headings, proper lists, emojis) instead of markdown headers (`##`, `###`) that looked robotic in the chat UI.

**Issue 2: Reusable DataSelect component** — Every dropdown that fetches data must consistently show loading, empty, error, and prerequisite states. Currently some dropdowns show nothing when empty — this looks broken and confuses users.

**Issue 3: Prisma migration drift** — `prisma migrate dev` is failing due to migration drift. The database is confirmed as a development database, so a safe reset approach is acceptable.

### Scope

**In Scope:**
- Create `components/ui/data-select.tsx` — a generic, reusable dropdown component
- Create typed wrapper components in `components/ui/selects/`
- Replace all existing data-fetching dropdowns with the new wrappers
- Fix Prisma migration drift using a dev database reset
- Ensure all API endpoints return proper response shapes

**Out of Scope:**
- Changing the underlying data model
- Creating fake data
- Adding new dependencies (using enhanced native `<select>`)
- Modifying the AI prompt system (already completed)

### Functional Requirements

**DataSelect Component:**
1. Handle loading state with spinner and "Loading..." text
2. Handle empty state with a message and optional CTA button
3. Handle error state with error message and retry button
4. Handle prerequisite state (parent not selected) with a disabled dropdown
5. Handle populated state with proper options
6. Support optional grouping
7. Support auto-selecting the first item
8. Refetch when dependencies change

**Dropdown Replacement:**
1. Replace all data-fetching `<select>` components with DataSelect wrappers
2. Remove inline fetch logic and state from parent components
3. Ensure dependent dropdowns clear when parent changes
4. Add empty-state CTAs where applicable

**Prisma Migration:**
1. Reset the dev database to sync with migration history
2. Verify all tables and enums are present
3. Ensure the app works after the reset

# Technical Design

### Current Implementation

**Dropdown patterns found:**
- `components/programme-picker.tsx` — fetches programmes via `fetch()`, uses native `<select>`, has basic loading/empty states inside `<option disabled>`
- `app/(dashboard)/admin/courses/new/page.tsx` — inline fetch for levels/periods, native `<select>`, no error handling
- `app/(dashboard)/admin/assessments/new/page.tsx` — inline fetch for courses, native `<select>`, no loading/empty/error states
- `app/onboarding/_components/onboarding-form.tsx` — data is pre-loaded server-side, native `<select>`, clears dependent fields on parent change
- `app/(dashboard)/admin/past-papers/create/page.tsx` — inline fetch for universities/programmes/courses, native `<select>`, no error handling
- `app/admin/banners/_components/university-checkbox-list.tsx` — fetches institutions, has loading state but no error/empty states

**API endpoints for dropdowns:**
- `GET /api/institutions/picker` — returns `{ institutions: [...] }`
- `GET /api/institutions/:id/programmes` — returns `{ programmes: [...] }`
- `GET /api/programmes/:id/tree` — returns `{ levels: [...] }`
- `GET /api/courses?all=true` — returns `[{ id, code, title }]`
- `GET /api/admin/universities` — returns `[...]`
- `GET /api/admin/programmes?universityId=` — returns `[...]`

**Prisma state:**
- Only one migration exists: `20250101000000_init`
- The issue mentions a failing migration `20261008000000_add_clerk_organization_fields` that doesn't exist in the repo
- The database is confirmed as a development database

### Proposed Changes

**1. Create `components/ui/data-select.tsx`**
- Generic component that wraps a native `<select>` element
- Manages its own loading, error, and data state
- Shows appropriate UI for each state (loading spinner, error with retry, empty with CTA, prerequisite message)
- Uses Tailwind CSS for styling
- Supports TypeScript generics for type-safe data

**2. Create wrapper components in `components/ui/selects/`**
- `institution-select.tsx` — fetches from `/api/institutions/picker`
- `programme-select.tsx` — fetches from `/api/institutions/:id/programmes`, prerequisite: institutionId
- `faculty-select.tsx` — fetches faculties for an institution
- `level-select.tsx` — fetches levels for an institution
- `period-select.tsx` — fetches periods for an institution
- `course-select.tsx` — fetches courses for a programme
- `tutor-select.tsx` — fetches tutors for an institution
- `question-select.tsx` — fetches questions for a course

**3. Replace existing dropdowns**
- `components/programme-picker.tsx` → use ProgrammeSelect
- `app/(dashboard)/admin/courses/new/page.tsx` → use ProgrammeSelect, LevelSelect, PeriodSelect
- `app/(dashboard)/admin/assessments/new/page.tsx` → use CourseSelect
- `app/(dashboard)/admin/past-papers/create/page.tsx` → use InstitutionSelect, ProgrammeSelect, CourseSelect
- `app/onboarding/_components/onboarding-form.tsx` — keep server-side data loading, but add proper empty/error states
- `app/admin/banners/_components/university-checkbox-list.tsx` — add error/empty states

**4. Fix Prisma migration drift**
- Run `prisma migrate reset --force` (safe for dev database)
- Verify migration status
- Ensure the app works after reset

### File Structure

```
New files:
  components/ui/data-select.tsx
  components/ui/selects/institution-select.tsx
  components/ui/selects/programme-select.tsx
  components/ui/selects/faculty-select.tsx
  components/ui/selects/level-select.tsx
  components/ui/selects/period-select.tsx
  components/ui/selects/course-select.tsx
  components/ui/selects/tutor-select.tsx
  components/ui/selects/question-select.tsx

Modified files:
  components/programme-picker.tsx
  app/(dashboard)/admin/courses/new/page.tsx
  app/(dashboard)/admin/assessments/new/page.tsx
  app/(dashboard)/admin/past-papers/create/page.tsx
  app/onboarding/_components/onboarding-form.tsx
  app/admin/banners/_components/university-checkbox-list.tsx
```

### Key Decisions
- **Enhanced native `<select>`** — keep the native element but wrap it in a component that handles all states. Simplest approach, no new dependencies.
- **Wrapper pattern** — create typed wrappers for common cases (institution, programme, etc.) to avoid repeating fetch logic.
- **Dev database reset** — since the database is confirmed as dev, a `prisma migrate reset` is safe and the quickest way to fix drift.
- **No new dependencies** — the component will use only React, Tailwind CSS, and lucide-react icons (already installed).

# Delivery Steps

### ✓ Step 1: Update prompt format rules in public.ts
Replace the STYLE section and personal-redirect section in `lib/ai/prompts/public.ts` with chat-friendly FORMAT RULES.
- Replace lines 32-50 (STYLE section) with the new FORMAT RULES: bold for headings, numbered/bullet lists, no hashtags, no separators, emoji anchors, paragraph limits, length caps, and structure templates.
- Replace lines 52-70 (WHEN THE USER ASKS SOMETHING PERSONAL) to use the new format.
- Keep all other sections unchanged.

### ✓ Step 2: Update prompt format rules in logged-in.ts
Replace the STYLE section in `lib/ai/prompts/logged-in.ts` with the same chat-friendly FORMAT RULES.
- Replace lines 31-45 (STYLE section) to reference identical formatting rules as public mode.
- Keep all other sections unchanged.

### ✓ Step 3: Integrate react-markdown rendering in ai-assistant.tsx
Update `components/ai/ai-assistant.tsx` to render assistant messages with markdown instead of plain text.
- Add imports: `ReactMarkdown` from `react-markdown` and `remarkGfm` from `remark-gfm`.
- Replace `{m.content}` with `<ReactMarkdown>` for assistant messages only.
- Configure component overrides: h1-h4 render as `<strong>`, lists styled with Tailwind, paragraphs with margin.

### ✓ Step 4: Create the DataSelect base component
Create `components/ui/data-select.tsx` — a generic, reusable dropdown that handles all states.
- Implement the `DataSelectProps<T>` interface with fetchFn, getValue, getLabel, and state props.
- Manage internal state: items, loading, error.
- Show loading spinner while fetching.
- Show error message with retry button on failure.
- Show empty message with optional CTA when no items.
- Show prerequisite message when prerequisiteMet is false.
- Refetch when dependencies change.

### ✓ Step 5: Create typed wrapper components
Create wrapper components in `components/ui/selects/` for common dropdown cases.
- `institution-select.tsx` — fetches from `/api/institutions/picker`, empty CTA to create institution.
- `programme-select.tsx` — fetches from `/api/institutions/:id/programmes`, prerequisite: institutionId, empty CTA to create programme.
- `level-select.tsx` — fetches levels for an institution, prerequisite: institutionId.
- `period-select.tsx` — fetches periods for an institution, prerequisite: institutionId.
- `course-select.tsx` — fetches courses for a programme, prerequisite: programmeId, empty CTA to create course.
- `tutor-select.tsx` — fetches tutors for an institution, prerequisite: institutionId.
- `question-select.tsx` — fetches questions for a course, prerequisite: courseId.
- `faculty-select.tsx` — fetches faculties for an institution, prerequisite: institutionId.

### ✓ Step 6: Replace dropdowns in course creation and assessment forms
Replace data-fetching dropdowns in the most critical admin forms.
- `app/(dashboard)/admin/courses/new/page.tsx` — replace ProgrammePicker, levels, and periods dropdowns with ProgrammeSelect, LevelSelect, PeriodSelect.
- `app/(dashboard)/admin/assessments/new/page.tsx` — replace courses dropdown with CourseSelect.
- `app/(dashboard)/admin/past-papers/create/page.tsx` — replace universities, programmes, and courses dropdowns with the appropriate wrappers.
- Remove inline fetch logic and state from these components.

### ✓ Step 7: Replace dropdowns in onboarding and banner forms
Replace data-fetching dropdowns in the onboarding flow and banner management.
- `app/onboarding/_components/onboarding-form.tsx` — add proper empty/error states to the institution, programme, branch, year, and period dropdowns.
- `app/admin/banners/_components/university-checkbox-list.tsx` — add error and empty states to the institution fetch.
- `components/programme-picker.tsx` — replace with ProgrammeSelect wrapper.

### ✓ Step 8: Fix Prisma migration drift
Reset the dev database to sync with migration history.
- Run `prisma migrate reset --force` to reset the dev database.
- Verify migration status with `prisma migrate status`.
- Ensure all tables and enums are present.
- Test that the app works after the reset.