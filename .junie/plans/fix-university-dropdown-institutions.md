---
sessionId: session-261018-014049-sykg
---

# Requirements

### Overview
When admins create institutions (universities) in the Institutions management page, they do not appear in the dropdown selectors for posting videos, lecture slides, courses, quizzes, tests, assignments, past papers, and tutors.

### Root Cause
The codebase has two separate data models:
- **`University`** (old model) - simple model with name, code, academicSystem
- **`Institution`** (new model) - comprehensive model with type field (UNIVERSITY, COLLEGE, etc.)

Forms like `VideoUploadForm`, `LectureSlideForm`, `CreateCourseForm`, and the test/past-paper pages fetch from `/api/admin/universities` which queries only the `University` model. When admins create institutions in the Institutions page, they are saved to the `Institution` model and never appear in those dropdowns.

### Acceptance Criteria
- After creating an institution with type=UNIVERSITY, it should immediately appear in all dropdowns for: videos, lecture slides, courses, tests, and past papers
- The institution dropdown should work consistently across all admin forms
- Programmes linked to institutions should also load correctly when an institution is selected

# Technical Design

### Current Implementation
- **`/api/admin/universities`** (`app/api/admin/universities/route.ts`) - queries `prisma.university.findMany()` - returns only University model records
- **`/api/institutions/picker`** (`app/api/institutions/picker/route.ts`) - queries `prisma.institution.findMany()` - returns Institution model records
- **Forms using `/api/admin/universities`**: `VideoUploadForm.tsx`, `LectureSlideForm.tsx`, `CreateCourseForm.tsx`, `tests/create/page.tsx`, `past-papers/create/page.tsx`
- **Forms using `InstitutionSelect`**: `tutors/new/_components/new-tutor-form.tsx`

### Proposed Approach
Update the `/api/admin/universities` endpoint to return BOTH `University` model records AND `Institution` model records (where type=UNIVERSITY) in a unified format. This is the minimal change approach that fixes all forms without requiring UI changes.

### Key Changes
1. **Update `/api/admin/universities/route.ts`** - Query both `University` and `Institution` models, normalize the Institution records to match the University interface shape, and return a combined list
2. **Update programme loading** - When an institution is selected (identified by prefix `inst-`), query programmes by `institutionId` instead of `universityId`

### Files to Modify
- `app/api/admin/universities/route.ts` - Main fix: combine University and Institution queries
- `components/VideoUploadForm.tsx` - Handle institution IDs when loading programmes
- `components/LectureSlideForm.tsx` - Handle institution IDs when loading programmes
- `components/CreateCourseForm.tsx` - Handle institution IDs when loading programmes
- `app/(dashboard)/admin/tests/create/page.tsx` - Handle institution IDs when loading programmes
- `app/(dashboard)/admin/past-papers/create/page.tsx` - Handle institution IDs when loading programmes

### Data Flow
The API will return records with a consistent shape:
```
{
  id: string,        // For institutions, prefixed with 'inst-' to distinguish
  name: string,
  code: string,      // For institutions, use slug or shortName
  academicSystem: string, // For institutions, map from periodType
  programmes: Programme[]
}
```

# Delivery Steps

### ✓ Done Step 1: Update universities API to include institutions
Update `/api/admin/universities/route.ts` to query both University and Institution models, normalize Institution records to match the University interface, and return a combined list. Institution IDs will be prefixed with `inst-` to distinguish them from University IDs. The academicSystem will be mapped from the Institution's periodType field.

### ✓ Done Step 2: Update forms to handle institution IDs
Update all forms that fetch from `/api/admin/universities` to handle institution IDs when loading programmes:
- `VideoUploadForm.tsx` - ✓ Check if universityId starts with `inst-`, use institutionId parameter for programme API
- `LectureSlideForm.tsx` - ✓ Same logic for programme loading
- `CreateCourseForm.tsx` - ✓ Same logic for programme loading
- `tests/create/page.tsx` - ✓ Same logic for programme loading
- `past-papers/create/page.tsx` - ✓ No changes needed (uses InstitutionSelect/ProgrammeSelect which already work with Institution model)
- `quizzes/create/page.tsx` - ✓ No changes needed (doesn't use these APIs)
- `assignments/create/page.tsx` - ✓ No changes needed (doesn't use these APIs)