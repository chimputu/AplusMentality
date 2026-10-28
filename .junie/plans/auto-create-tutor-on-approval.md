---
sessionId: session-261012-041631-1j2n
---

# Requirements

### Overview
When an admin approves a tutor application via `approveTutorApplication`, a `Tutor` record should be auto-created so the approved tutor appears in the student-facing tutor marketplace (`/student/tutors`). Currently only `isVerifiedTutor: true` is set on the `User`, but no `Tutor` record exists.

### Scope
**In Scope:**
- Auto-create a `Tutor` record inside the `approveTutorApplication` transaction in `lib/actions/tutor-application.ts`.
- Auto-create `TutorSpecialty` records from the application's `TutorOffering` entries (course offerings).
- Handle idempotency: skip Tutor creation if one already exists for the user.
- Revalidate the student tutors API cache after approval.

**Out of Scope:**
- Schema changes (no new models or fields needed).
- Changes to the admin tutor creation flow (`/admin/tutors/new`).
- Changes to the rejection flow.

### Data Mapping
| Tutor field | Source |
|---|---|
| `userId` | `application.userId` |
| `fullName` | `application.fullName` |
| `email` | `application.email` |
| `phone` | `application.phone` |
| `bio` | `application.teachingPhilosophy` |
| `avatarUrl` | `application.profilePhotoUrl` |
| `yearsExperience` | `application.experienceYears` |
| `mode` | First entry from `application.teachingModes` (lowercased) or `'online'` |
| `isVerified` | `true` |
| `isActive` | `true` |
| `TutorSpecialty[].courseId` | `offering.courseId` (skip if null) |
| `TutorSpecialty[].personalRate` | `offering.priceZMW` |
| `TutorSpecialty[].groupRate` | `offering.priceZMW` if `maxStudentsPerSession > 1` |
| `TutorSpecialty[].groupEnabled` | `offering.maxStudentsPerSession > 1` |

# Technical Design

### Current Implementation
The `approveTutorApplication` function (`lib/actions/tutor-application.ts`, line 427) runs a `$transaction` that:
1. Updates `TutorApplication` status to `APPROVED`.
2. Sets `User.isVerifiedTutor = true` and copies the profile photo.

It does NOT create a `Tutor` record or any `TutorSpecialty` records. The `Tutor` model (schema line 1086) requires `fullName` and `email` as mandatory fields; everything else is optional. `TutorSpecialty` (line 1117) requires `tutorId` and `courseId` with a unique constraint on `[tutorId, courseId]`.

### Proposed Changes
Inside the existing `$transaction` in `approveTutorApplication`:
1. Check if a `Tutor` already exists for `application.userId` via `tx.tutor.findUnique({ where: { userId: application.userId } })`.
2. If not, create a `Tutor` record with data mapped from the application.
3. Create `TutorSpecialty` records from the application's `TutorOffering` entries (filtering out offerings with null `courseId`).
4. After the transaction, revalidate `/api/student/tutors` so the student marketplace picks up the new tutor.

The `approveTutorApplication` function needs to fetch the application with `offerings` included to access the course offerings for specialty creation.

### Key Decisions
- **Idempotency**: If a `Tutor` already exists for the user (e.g., created manually by admin), skip creation to avoid duplicates. This handles re-approval scenarios.
- **Bio mapping**: `teachingPhilosophy` from the application maps to `bio` on the `Tutor` record — it's the closest semantic match.
- **Mode mapping**: The application stores `teachingModes` as an array (e.g., `['ONLINE', 'PHYSICAL']`); the `Tutor.mode` field is a single string. Use the first mode lowercased, defaulting to `'online'`.
- **Rate mapping**: `TutorOffering.priceZMW` is an `Int`; `TutorSpecialty.personalRate` is `Decimal`. Cast via `parseFloat()`.

# Delivery Steps

### ✓ Step 1: Auto-create Tutor record in approveTutorApplication
Add Tutor and TutorSpecialty creation inside the approval transaction in `lib/actions/tutor-application.ts`.

### ✓ Step 2: Revalidate student tutors cache after approval
Add `revalidatePath('/api/student/tutors')` after the transaction so the student marketplace reflects the new tutor immediately.