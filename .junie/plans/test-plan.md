---
sessionId: session-261027-130627-6wwg
---

# Interconnected Dropdowns & Schema Fix — Plan

## Requirements

### Overview & Goals
Fix the database seed so UNZA uses TERMS (3 periods) instead of SEMESTERS. Replace all hardcoded dropdowns across the app with dynamic, cascading dropdowns that use the shared `DataSelect` infrastructure. Ensure every form and filter shows graceful empty states instead of blank screens.

### Current State
- **Schema:** `Institution` model already has `periodType` (SEMESTER/TERM/TRIMESTER/QUARTER/BLOCK) and `numPeriods`. `AcademicPeriod` and `AcademicLevel` models exist. The old `University` model has `academicSystem` enum (YEARLY/SEMESTERLY/TRIMESTERLY). Both coexist.
- **Seed (`prisma/seed.ts`):** UNZA is seeded as `periodType: SEMESTER, numPeriods: 2` — incorrect, should be `TERM, 3`. The seed already auto-generates `AcademicLevel` and `AcademicPeriod` records correctly.
- **Onboarding form (`app/onboarding/_components/onboarding-form.tsx`):** Uses raw `<select>` elements. Period dropdown is hardcoded to "Period 1/2/3". Does not use the shared `DataSelect` components.
- **Admin forms (`LectureSlideForm.tsx`, `past-papers/create/page.tsx`):** Use `InstitutionSelect` and `ProgrammeSelect` (good), but Year is hardcoded to `[1-7]` and Period reads from the old `University.academicSystem` enum via a `useEffect` instead of using `PeriodSelect`.
- **Shared select components:** `DataSelect` (`components/ui/data-select.tsx`) is a production-ready generic dropdown with loading/error/empty states, prerequisite handling, and retry buttons. `InstitutionSelect`, `ProgrammeSelect`, `PeriodSelect`, `LevelSelect`, `CourseSelect`, `FacultySelect`, and `BranchSelect` all exist and use `DataSelect`.

### Scope

**In Scope:**
1. Fix UNZA seed to use `periodType: TERM, numPeriods: 3`.
2. Rewrite onboarding form to use shared `DataSelect`-based components (`InstitutionSelect`, `ProgrammeSelect`, `LevelSelect`, `PeriodSelect`).
3. Replace hardcoded Year and Period dropdowns in admin forms (`LectureSlideForm.tsx`, `past-papers/create/page.tsx`) with `LevelSelect` and `PeriodSelect`.
4. Ensure all dropdowns show empty states when no data is available.

**Out of Scope:**
- New Prisma schema changes (existing models are sufficient).
- Creating new API endpoints (existing ones are used by the shared selects).
- Modifying the `University` model or migrating data from it.

### User Stories
1. As a new student from UNZA, I want my onboarding form to show "Term 1/2/3" instead of "Semester 1/2" so it matches my institution's calendar.
2. As a student, I want the onboarding form dropdowns to cascade — selecting an institution should populate programmes, levels, and periods automatically.
3. As an admin uploading materials, I want the Year and Period dropdowns to reflect my institution's actual settings, not hardcoded values.
4. As any user, I should never see a blank dropdown — if no data exists, I see a clear message like "No programmes available."

## Technical Design

### Current Implementation

**Shared Select Architecture:**
- `components/ui/data-select.tsx` — Generic dropdown component with:
  - `fetchFn` for data loading
  - `prerequisiteMet` / `prerequisiteMessage` for cascading (disabled until parent is selected)
  - Loading spinner, error state with retry button, empty state with "Create" CTA
  - Search filtering and grouped items support
- `components/ui/selects/institution-select.tsx` — Fetches from `/api/institutions/picker`
- `components/ui/selects/programme-select.tsx` — Fetches from `/api/institutions/:id/programmes`, requires `institutionId`
- `components/ui/selects/period-select.tsx` — Fetches from `/api/admin/periods?institutionId=...`, requires `institutionId`
- `components/ui/selects/level-select.tsx` — Fetches from `/api/admin/levels?institutionId=...`, requires `institutionId`
- `components/ui/selects/course-select.tsx` — Fetches from `/api/courses?programmeId=...&year=...&period=...`

**Onboarding Form:**
- Server page (`app/onboarding/page.tsx`) fetches institutions and universities with programmes and levels.
- Client form (`onboarding-form.tsx`) uses raw `<select>` elements with inline state management.
- Period dropdown is hardcoded: `<option value="1">Period 1</option>`, etc.

**Admin Forms:**
- `LectureSlideForm.tsx` and `past-papers/create/page.tsx` follow the same pattern:
  - Use `InstitutionSelect` and `ProgrammeSelect` (correct)
  - Year: hardcoded `<select>` with options 1-7
  - Period: `useEffect` fetches `/api/institutions/picker`, reads `academicSystem` enum, generates options via `getPeriodOptions()` switch statement

### Key Decisions

1. **Use existing `DataSelect`-based components everywhere.** The infrastructure is already production-ready. No need to build new dropdown components.

2. **Onboarding form should switch from server-side data preloading to client-side fetching via `DataSelect`.** The current approach preloads all institutions with programmes and levels on the server. Switching to `DataSelect` means data is fetched on demand as the user selects each parent field. This is simpler, more consistent with admin forms, and reduces initial page load.

3. **Admin forms should replace hardcoded Year/Period with `LevelSelect` and `PeriodSelect`.** These components already fetch from the correct API endpoints and handle prerequisites, loading, errors, and empty states.

4. **UNZA seed fix is a one-line change:** `periodType: PeriodType.TERM, numPeriods: 3`.

5. **Period values in admin forms:** The current `getPeriodOptions()` returns string values like `"1"`, `"2"` which map to period order/ID. The `PeriodSelect` component returns `period.id` (UUID). The admin forms need to be updated to handle UUID period IDs instead of numeric strings. This requires checking how the `Course` model stores period references.

### Proposed Changes

#### 1. Fix UNZA Seed (`prisma/seed.ts`)
- Change UNZA entry from `periodType: PeriodType.SEMESTER, numPeriods: 2` to `periodType: PeriodType.TERM, numPeriods: 3`.
- The seed's `getPeriodPrefix()` function already correctly maps `PeriodType.TERM` to "Term", so periods will be labeled "Term 1", "Term 2", "Term 3".

#### 2. Rewrite Onboarding Form (`app/onboarding/_components/onboarding-form.tsx`)
- Replace raw `<select>` elements with shared components:
  - Institution: `InstitutionSelect` (fetches all active institutions)
  - Programme: `ProgrammeSelect` (cascades from institution)
  - Level/Year: `LevelSelect` (cascades from institution)
  - Period: `PeriodSelect` (cascades from institution)
  - Branch: `BranchSelect` (cascades from programme, if available)
- Remove server-side preloading of programmes and levels from `onboarding/page.tsx` (simplify the page).
- Keep the "locked institution" flow (join link) — it still preloads data for the locked institution.
- The form submission logic remains the same, but `year` and `period` fields now use IDs instead of numeric values.

#### 3. Fix Admin Forms
**`components/LectureSlideForm.tsx`:**
- Replace hardcoded Year `<select>` with `LevelSelect` (import from `@/components/ui/selects/level-select`).
- Replace the `useEffect` + `getPeriodOptions()` pattern with `PeriodSelect` (import from `@/components/ui/selects/period-select`).
- Remove `academicSystem` state and `getPeriodOptions()` function.
- Update course creation payload to use period ID instead of numeric string.

**`app/(dashboard)/admin/past-papers/create/page.tsx`:**
- Same changes as above: `LevelSelect` + `PeriodSelect` instead of hardcoded dropdowns.
- Remove `academicSystem` state and `getPeriodOptions()` function.

#### 4. Empty States
- The `DataSelect` component already renders empty states with messages like "No programmes for this institution." and a "Create" CTA button.
- No additional changes needed for empty states — they're inherited from `DataSelect`.

### File Structure

```
Modified:
  prisma/seed.ts                                          (UNZA: TERM instead of SEMESTER)
  app/onboarding/page.tsx                                 (simplify: remove programme/level preloading)
  app/onboarding/_components/onboarding-form.tsx          (use DataSelect components)
  components/LectureSlideForm.tsx                         (LevelSelect + PeriodSelect)
  app/(dashboard)/admin/past-papers/create/page.tsx       (LevelSelect + PeriodSelect)

No new files needed — all components already exist.
```

### Architecture Diagram

```mermaid
graph LR
  A[User] --> B[Onboarding Form]
  A --> C[Admin Upload Form]
  B --> D[InstitutionSelect]
  C --> D
  D --> E[ProgrammeSelect]
  E --> F[BranchSelect]
  D --> G[LevelSelect]
  D --> H[PeriodSelect]
  E --> I[CourseSelect]
  G --> I
  H --> I
  D --> J[/api/institutions/picker]
  E --> K[/api/institutions/:id/programmes]
  G --> L[/api/admin/levels?institutionId]
  H --> M[/api/admin/periods?institutionId]
  I --> N[/api/courses?filters]
  J --> O[Prisma: Institution]
  K --> P[Prisma: Programme]
  L --> Q[Prisma: AcademicLevel]
  M --> R[Prisma: AcademicPeriod]
  N --> S[Prisma: Course]
```

### Risks
- **Period ID type change:** Admin forms currently pass period as a numeric string ("1", "2"). `PeriodSelect` returns a UUID. The course creation API and `Course` model need to accept UUID period IDs. If the `Course.period` field stores a string (not an integer), this should work. Need to verify.
- **Onboarding form `year` field:** Currently stores an integer (year number). `LevelSelect` returns `level.id` (UUID). The `User.year` field is an integer. The onboarding form may need to extract the level's `order` property instead of its ID, or the `LevelSelect` needs a variant that returns the order number.
- **Backward compatibility:** Existing users with numeric period values in their profiles will continue to work. New users will have UUID-based period references.

## Execution Steps

### ✓ Step 1: Fix UNZA seed and rewrite Onboarding form with cascading DataSelects
### ✓ Step 2: Fix admin forms to use dynamic LevelSelect and PeriodSelect
### ✓ Step 3: Verify the flow

## Testing

### Validation Approach
- Verify UNZA seed produces "Term 1/2/3" periods after running `prisma db seed`.
- Test onboarding flow: select institution → verify programmes, levels, and periods populate correctly.
- Test admin forms: select institution → verify level and period dropdowns show correct options.
- Test empty states: create an institution with no programmes → verify "No programmes" message appears.
- Test cascading: change institution → verify child dropdowns reset.

### Key Scenarios
1. UNZA student onboarding: Institution → UNZA, Periods show "Term 1/2/3".
2. CBU student onboarding: Institution → CBU, Periods show "Semester 1/2".
3. Admin uploads slide for UNZA course: Period dropdown shows Terms, not Semesters.
4. Institution with no programmes: Empty state message appears, form is usable.
5. DB failure during dropdown fetch: Error state with retry button appears.

### Edge Cases
- User selects institution, then changes it → child dropdowns reset to empty.
- Institution has `hasFaculties: true` → programmes show faculty names.
- Institution has `hasBranches: true` → branch dropdown appears after programme selection.
- Onboarding with join link (locked institution) → institution is pre-selected and disabled.