---
sessionId: session-261009-171340-13eu
---

# Diagnosis

## Diagnosis Findings

### A) BannerCarousel component exists
- **File**: `components/banner-carousel.tsx` (218 lines)
- **Imported in**: `components/HomePageClient.tsx` (line 19), `components/AdminContent.tsx` (line 9)
- **NOT imported in**: `components/StudentContent.tsx` — **student dashboard has no banners**

### B) Homepage — BannerCarousel IS rendered
- `components/HomePageClient.tsx` line 187: `<BannerCarousel placement="HOMEPAGE" />`
- No `institutionId` passed — logged-in users won't see institution-specific banners

### C) Student dashboard — BannerCarousel is MISSING
- `app/(dashboard)/student/page.tsx` renders `StudentContent`
- `StudentContent` has no `BannerCarousel` import or render — **banners never show on student dashboard**

### D) API Route — exists but has query bug
- `app/api/banners/active/route.ts` (101 lines)
- **Bug**: The `OR` for placement is at the top level of `where`, meaning Prisma evaluates it as `(isActive AND dates) OR (placement match)` — bypassing date/active filters
- Same bug in `lib/actions/banner.ts` `getActiveBanners()` (lines 118-198)

### E) BannerCarousel component analysis
- Fetches on mount via `useEffect` ✓
- Calls `/api/banners/active?placement=X&institutionId=Y` ✓
- Passes `institutionId` when provided ✓
- Handles errors silently ✓
- Returns `null` when empty ✓
- Component logic is correct

### F) Prisma Schema
- Banner model exists with proper enums (BannerVariant, BannerPlacement, BannerScope)
- BannerTarget junction table for multi-institution targeting
- Schema is correct, no changes needed

## Root Causes
1. **Student dashboard missing BannerCarousel** — `StudentContent.tsx` doesn't import or render it
2. **API query structure bug** — placement `OR` at wrong nesting level breaks filtering in both the API route and server action
3. **Homepage doesn't pass institutionId** — logged-in users on homepage won't see institution-specific banners

# Technical Design

## Current Implementation

### Files involved
- `app/api/banners/active/route.ts` — API endpoint for fetching active banners
- `lib/actions/banner.ts` — Server actions including `getActiveBanners()`
- `components/banner-carousel.tsx` — Client component that fetches and renders banners
- `components/HomePageClient.tsx` — Homepage, renders BannerCarousel (no institutionId)
- `components/AdminContent.tsx` — Admin dashboard, renders BannerCarousel with institutionId
- `components/StudentContent.tsx` — Student dashboard, **no BannerCarousel**
- `app/(dashboard)/student/page.tsx` — Student page, doesn't pass institutionId

### Query Bug Detail
Both the API route and `getActiveBanners()` use:
```js
const where = {
  isActive: true,
  startsAt: { lte: now },
  endsAt: { or: [{ equals: null }, { gte: now }] },
  OR: [{ placement }, { placement: 'BOTH' }],  // ← WRONG: top-level OR
};
```
This means Prisma evaluates: `(isActive AND startsAt AND endsAt) OR (placement=X) OR (placement=BOTH)` — any banner with matching placement returns regardless of active/date status.

## Proposed Changes

### 1. Fix API route query (`app/api/banners/active/route.ts`)
Move placement `OR` into an `AND` array:
```js
const where: any = {
  AND: [
    { isActive: true },
    { startsAt: { lte: now } },
    { endsAt: { or: [{ equals: null }, { gte: now }] } },
    { OR: [{ placement }, { placement: 'BOTH' }] },
    // scope filtering added below
  ],
};
```

### 2. Fix server action query (`lib/actions/banner.ts`, `getActiveBanners`)
Same fix — wrap all conditions in `AND`:
```js
const where: any = {
  AND: [
    { isActive: true },
    { startsAt: { lte: now } },
    { endsAt: { or: [{ equals: null }, { gte: now }] } },
    { OR: [{ placement }, { placement: 'BOTH' }] },
  ],
};
```
Then scope filtering appends to `where.AND`.

### 3. Add BannerCarousel to StudentContent (`components/StudentContent.tsx`)
- Add import: `import BannerCarousel from '@/components/banner-carousel'`
- Add `institutionId` to the component's props interface
- Render `<BannerCarousel placement="DASHBOARD" institutionId={institutionId} />` at the top

### 4. Pass institutionId from student page (`app/(dashboard)/student/page.tsx`)
- Add `institutionId` to the Prisma select (line 31-42)
- Pass `institutionId` to `<StudentContent>`

### 5. Pass institutionId on homepage (`components/HomePageClient.tsx`)
- The `useUser()` hook doesn't provide institutionId
- Option: fetch it client-side via a small API call, or wrap BannerCarousel in a server component
- Simplest: the homepage BannerCarousel without institutionId already shows GLOBAL banners, which is acceptable for public users. For logged-in users, add a client-side fetch of the user's institution.

# Delivery Steps

### ✓ Step 1: Fix API route and server action query logic
Fix the Prisma `where` clause in both the API route and server action so placement filtering uses AND instead of OR.

- **`app/api/banners/active/route.ts`**: Move the placement `OR` into the `AND` array so it combines with `isActive`, `startsAt`, and `endsAt` correctly. The current structure `{ isActive: true, OR: [{placement}, {placement:'BOTH'}] }` means Prisma evaluates it as `(isActive) OR (placement match)`, bypassing date filters. Fix by wrapping placement in an AND clause.
- **`lib/actions/banner.ts`** (`getActiveBanners` function, lines 118-198): Apply the same fix — move placement `OR` into the `AND` array alongside scope filtering.
- Both files need the same structural fix: wrap placement filtering inside `where.AND` instead of using a top-level `OR`.

### ✓ Step 2: Add BannerCarousel to StudentContent component
Import and render BannerCarousel in the student dashboard so students see banners.

- **`components/StudentContent.tsx`**: Add `import BannerCarousel from '@/components/banner-carousel'` and render `<BannerCarousel placement="DASHBOARD" institutionId={institutionId} />` at the top of the content, before the welcome section.
- The `StudentContent` component needs to accept `institutionId` as a prop (check if it already has it via the parent page).
- **`app/(dashboard)/student/page.tsx`**: Pass `institutionId` to `StudentContent` — the page already fetches `dbUser` but doesn't select `institutionId`. Add it to the Prisma select and pass it as a prop.

### ✓ Step 3: Pass institutionId to homepage BannerCarousel
Make the homepage BannerCarousel institution-aware for logged-in users.

- **`components/HomePageClient.tsx`**: The `BannerCarousel` at line 187 currently has no `institutionId`. Since `HomePageClient` is a `'use client'` component with access to `useUser()`, fetch the user's institution from a new API endpoint or pass it server-side.
- Alternative: Create a small server-side wrapper that fetches the user's institutionId and passes it to the client component, since `HomePageClient` already uses `useUser()` but doesn't have the institution data.