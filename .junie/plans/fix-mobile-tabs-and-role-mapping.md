---
sessionId: session-261028-100724-cy2w
---

# Requirements

### Overview & Goals
Two issues need fixing:
1. **Mobile Bottom Navigation Tabs** — the tabs render but clicks don't reliably navigate on mobile. Root causes: overlapping floating buttons (SimpleChat at `z-[9999]`), strict active-state matching, and small touch targets.
2. **Role/Org Mapping Verification** — ensure the Prisma schema, `getOrgScope`, and `assignTutorToCourse` server action correctly map Clerk org roles to database queries and UI.

### Scope

**In Scope:**
- Fix `MobileTabBar` clickability, z-index, active-state matching, and touch targets
- Add `isSuperAdmin` boolean to `User` model in Prisma
- Add `tutorId` field to `Course` model (primary tutor assignment)
- Verify `getOrgScope` returns the required shape
- Verify `assignTutorToCourse` security (already implemented)
- Update `DashboardLayout` bottom padding for mobile

**Out of Scope:**
- Rewriting the sidebar or navigation architecture
- Adding new roles beyond the existing four
- Full test suite — only unit test updates where relevant

# Technical Design

### Current Implementation

**MobileTabBar** (`components/mobile-tab-bar.tsx`):
- Uses `z-50`, Next.js `<Link>`, and `"use client"` — structurally sound
- Active state: exact match for `/student` (`pathname === '/student'`), `startsWith` for others — inconsistent
- Touch target: inner `<Link>` has `w-full h-full` but the parent flex item has no explicit padding, making the effective touch area exactly the flex slot
- **Blocking issue:** `SimpleChat` floating button at `fixed bottom-6 right-4 z-[9999]` sits above the tab bar on mobile

**DashboardLayout** (`components/DashboardLayout.tsx`):
- Main content: `pt-16 pb-20 md:pb-0` — already has bottom padding on mobile
- Mobile overlay at `z-30`, sidebar at `z-40`, header at `z-50`

**Prisma Schema** (`prisma/schema.prisma`):
- `User.role` is an enum (`SUPER_ADMIN`, `ADMIN`, `TUTOR`, `STUDENT`, `LECTURER`) — no explicit `isSuperAdmin` boolean
- `Course` has no `tutorId` — tutor-course mapping uses `TutorSpecialty` join table
- `OrganizationMembership` model exists with `userId`, `clerkOrgId`, `role`, `status`

**getOrgScope** (`lib/auth/org-scope.ts`):
- Already returns `{ userId, clerkUserId, clerkOrgId, institutionId, orgRole, appRole, isSuperAdmin, ... }`
- `isSuperAdmin` is derived from `user.role === 'SUPER_ADMIN'`
- `buildCourseScopeWhere` bypasses institution scoping for super admins

**assignTutorToCourse** (`lib/actions/course-tutor.ts`):
- Already implemented with proper security: checks `requireAdminWithOrg`, verifies course belongs to admin's institution, verifies tutor belongs to same institution, SUPER_ADMIN bypasses scoping

### Proposed Changes

#### 1. Fix MobileTabBar clickability

**File:** `components/mobile-tab-bar.tsx`

- **Z-index fix:** Raise tab bar to `z-[60]` (above SimpleChat's `z-[9999]` is not possible without breaking chat, so instead move SimpleChat button below the tab bar on mobile by reducing its z-index to `z-[55]` on mobile only)
- **Active state fix:** Use `pathname.startsWith(href)` for all tabs consistently, with a special case for `/student` to also match `/student/` and exact `/student`
- **Touch target fix:** Add `py-2 px-1` to each tab's Link wrapper to ensure 44x44px minimum
- **Safe area:** Keep the `env(safe-area-inset-bottom)` padding

#### 2. Fix SimpleChat floating button z-index on mobile

**File:** `components/SimpleChat.tsx`

- Change the floating button from `z-[9999]` to `z-[55] md:z-[9999]` so it sits below the tab bar (`z-[60]`) on mobile but above everything on desktop

#### 3. Add `isSuperAdmin` boolean to User model

**File:** `prisma/schema.prisma`

- Add `isSuperAdmin Boolean @default(false)` to the `User` model
- Keep the existing `role` enum — `isSuperAdmin` is a convenience flag

#### 4. Add `tutorId` to Course model

**File:** `prisma/schema.prisma`

- Add `tutorId String?` and `tutor Tutor? @relation(fields: [tutorId], references: [id], onDelete: SetNull)` to `Course`
- Add a new relation on `Tutor` model: `primaryCourses Course[]`
- This represents the **primary** tutor assigned to a course (distinct from `TutorSpecialty` which is many-to-many)

#### 5. Update `assignTutorToCourse` to also set `Course.tutorId`

**File:** `lib/actions/course-tutor.ts`

- After creating/updating `TutorSpecialty`, also update the `Course.tutorId` field to point to the assigned tutor
- This provides a direct lookup for "which tutor teaches this course"

### File Structure

```
Modified:
  components/mobile-tab-bar.tsx       — z-index, active state, touch targets
  components/SimpleChat.tsx           — mobile z-index reduction
  prisma/schema.prisma                — add isSuperAdmin to User, tutorId to Course
  lib/actions/course-tutor.ts         — update Course.tutorId in assignTutorToCourse
  prisma/migrations/                  — new migration for schema changes
```

### Architecture Diagram

``` mermaid
graph LR
  A[Clerk auth] --> B[getOrgScope]
  B --> C{isSuperAdmin?}
  C -->|Yes| D[Bypass org scoping]
  C -->|No| E[Lock to orgId]
  E --> F[Query: Institution/Course]
  G[assignTutorToCourse] --> H{org:admin?}
  H -->|Yes| I[Verify course.orgId = admin.orgId]
  I --> J[Verify tutor in same org]
  J --> K[Update TutorSpecialty + Course.tutorId]
  L[MobileTabBar z-60] -. overlaps .-> M[SimpleChat z-55 mobile]
```

# Delivery Steps

### ✓ Step 1: Fix MobileTabBar and SimpleChat z-index conflict
Raise the mobile tab bar above the floating chat button and fix active-state matching and touch targets.

- Update `components/mobile-tab-bar.tsx`: change z-index from `z-50` to `z-[60]`, fix `isActive` to use `pathname.startsWith(href)` for all tabs consistently, add `py-2 px-1` padding to each Link for 44x44px touch targets
- Update `components/SimpleChat.tsx`: change floating button z-index from `z-[9999]` to `z-[55] md:z-[9999]` so it sits below the tab bar on mobile but above everything on desktop
- Verify the `DashboardLayout` bottom padding (`pb-20`) is sufficient for the tab bar height

### ✓ Step 2: Update Prisma schema and assignTutorToCourse action
Add `isSuperAdmin` boolean to User, `tutorId` to Course, and update the server action to set both TutorSpecialty and Course.tutorId.

- Add `isSuperAdmin Boolean @default(false)` to `User` model in `prisma/schema.prisma`
- Add `tutorId String?` and `tutor Tutor?` relation to `Course` model
- Add `primaryCourses Course[]` relation to `Tutor` model
- Update `assignTutorToCourse` in `lib/actions/course-tutor.ts` to also set `Course.tutorId` when assigning
- Generate and apply the Prisma migration
- Verify `getOrgScope` returns the correct shape (already does — no changes needed)