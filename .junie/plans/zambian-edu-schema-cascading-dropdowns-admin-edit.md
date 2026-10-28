---
sessionId: session-261027-195841-1tzl
---

# Testing

### Validation Approach
Verify each component and integration point manually and through the existing test infrastructure (Vitest).

### Key Scenarios
1. **AcademicSelector cascading** — Select Institution → verify Faculty/Programme dropdowns enable → select Faculty → verify Programme filters → select Programme → verify Level/Period enable
2. **Admin Edit User** — Click Edit on a user → verify all dropdowns pre-fill → change Institution → verify children reset → save → verify user updated in DB
3. **Role change with Clerk sync** — Change role from STUDENT to TUTOR → verify DB updated → verify Clerk org membership updated
4. **Empty states** — Select institution with no programmes → verify "No programmes available" message → select institution with no faculties → verify Faculty dropdown is hidden
5. **UNZA TERM periods** — Select UNZA → verify Period dropdown shows "Term 1", "Term 2", "Term 3"
6. **CBU SEMESTER periods** — Select CBU → verify Period dropdown shows "Semester 1", "Semester 2"

### Edge Cases
1. User with no institution → edit form shows empty dropdowns, not errors
2. Admin reassigns user to an institution with different period type → old period value is cleared
3. Institution has no faculties → Faculty dropdown is hidden, Programme still works
4. Network error during save → error toast displayed, form remains open
5. Concurrent edit → last write wins (no optimistic locking needed for this scale)

### Test Changes
- No new test files required. The existing `vitest` setup covers utility functions.
- Manual testing of the cascading flow is the primary validation method.
- Verify the PUT API route handles all academic fields by checking the Prisma update call.

# Delivery Steps

### ✓ Step 1: Create AcademicSelector component
Build the reusable cascading dropdown component that composes existing selects.

- Create `components/ui/academic-selector.tsx`
- Manage shared state for Institution → Faculty → Programme → Level → Period cascading
- Wire up existing select components (InstitutionSelect, FacultySelect, ProgrammeSelect, LevelSelect, PeriodSelect)
- Handle reset logic: when a parent changes, clear all children
- Map LevelSelect/PeriodSelect values (id) to User model fields (year as Int, period as String)
- Conditionally show Faculty dropdown based on `institution.hasFaculties`
- Conditionally show Branch dropdown based on `institution.hasBranches`
- Expose an `onChange` callback with the complete academic profile data
- Support pre-filling via `initial*` props for edit mode

### ✓ Step 2: Enhance Admin Edit Modal with AcademicSelector
Replace the basic edit modal in UserManagement with the full AcademicSelector.

- Modify `components/UserManagement.tsx`:
  - Import and integrate `<AcademicSelector />` into the edit modal
  - Replace: inline Institution select, Year number input, Period text input
  - Add: Faculty and Programme dropdowns (via AcademicSelector)
  - Keep: Role dropdown
  - Update `editForm` state to include `facultyId` and `programmeId`
  - Update `handleEditUser` to pre-fill all fields from user data
  - Update `handleSaveEdit` to send all academic fields to the API
  - Update the User interface to include `facultyId` and faculty relation data
- Modify `app/(dashboard)/admin/users/page.tsx`:
  - Include `programme` and `faculty` in Prisma query for user data
  - Pass programme/faculty data to UserManagement component

### ✓ Step 3: Update User API and fix empty states
Extend the PUT API route to handle academic fields and ensure all empty states work.

- Modify `app/api/users/[id]/route.ts`:
  - Extend PUT handler to accept: `institutionId`, `programmeId`, `branchId`, `year`, `period`
  - Update Prisma `user.update` call with these fields
  - Keep existing role and name updates
  - Keep existing Clerk role sync logic
- Verify empty states across all select components:
  - InstitutionSelect: "No institutions available" with "Create institution" link
  - FacultySelect: "No faculties for this institution" 
  - ProgrammeSelect: "No programmes for this institution" with "Create programme" link
  - LevelSelect: "No years defined for this institution"
  - PeriodSelect: "No periods defined for this institution"
  - All show "Select [parent] first" when prerequisite not met
- Verify the onboarding form (`app/onboarding/_components/onboarding-form.tsx`) still works correctly