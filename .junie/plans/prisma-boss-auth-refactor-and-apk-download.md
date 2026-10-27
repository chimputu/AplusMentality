---
sessionId: session-261027-031936-zjev
---

# Requirements

### Overview & Goals

This plan addresses two features:

1. **"Prisma is the Boss" Auth Refactor + Magic Join Link** — Finalize the architecture where Prisma owns all roles/permissions and Clerk handles only identity. Implement a `joinUniversity` Server Action with double-write (Clerk + Prisma) for automated student onboarding via magic links.

2. **APK Download Page + Banner** — Create a download landing page for the Android APK (TWA built with Bubblewrap), with a smart banner for Android users and navigation links throughout the app.

### User Stories

**Auth & Onboarding:**
- As a student, I want to click my university's magic link and be automatically enrolled so I don't need to manually select my institution.
- As an admin, I want to share a join link on WhatsApp so students can join my institution easily.
- As a logged-in user, I want my role to be determined by Prisma (not Clerk) so role changes take effect immediately.

**Download Page:**
- As a student on Android, I want to download the APK from the website so I can use the app offline.
- As a desktop user, I want to scan a QR code to open the download page on my phone.
- As a mobile user, I want a banner prompting me to install the app.

### Functional Requirements

1. **joinUniversity Server Action** — Finds the institution by slug, adds the user to Clerk's org, updates Prisma with academic data, and marks the user as onboarded.
2. **Download Page** — Mobile-first landing page with APK download button, installation instructions, and QR code.
3. **Download Banner** — Dismissible bottom banner for Android users, stored in `localStorage`.
4. **Navigation Links** — "Download App" in the footer and student dashboard sidebar.

### What's Already in Place

- `proxy.ts` already fetches roles from Prisma via `/api/user/role` (Prisma-first auth).
- `lib/auth.ts` has `requireAuth()` and `getAuthUser()` that read roles from Prisma.
- `/join/[slug]` route exists and redirects to `/onboarding` with params.
- Admin settings page already displays a copyable join link.
- `lib/clerk-org.ts` has `addUserToClerkOrg()` for Clerk org membership.
- Layouts (`admin`, `tutor`, `student`) already use `requireAuth()` with role checks.

### What's Out of Scope

- Creating a `super-admin` layout (no such route exists in the codebase; SUPER_ADMIN shares the admin layout).
- Modifying the Prisma schema — all required fields already exist (`joinSlug`, `clerkOrgId`, `role`, etc.).
- Building an iOS download flow (Android-only for now).

# Technical Design

### Risks

1. **Clerk API rate limits:** If many students join simultaneously, Clerk API calls might hit rate limits. Mitigation: graceful degradation — Prisma write always succeeds even if Clerk fails.
2. **APK not in `public/`:** The download button will 404 until the APK is placed. Mitigation: the page shows a "coming soon" state if the file is missing.
3. **QR code library:** `qrcode` needs to be installed. It's a small dependency (~30KB).

# Delivery Steps

### ✓ Step 1: Phase 1: Create joinUniversity Server Action with Clerk double-write
Add a new Server Action `joinUniversity` in `lib/actions/user-admin.ts` that handles the magic link join flow with simultaneous Clerk + Prisma writes.

- Create `joinUniversity(slug, programmeId, year, period, branchId?)` server action in `lib/actions/user-admin.ts`.
- The action finds the Organization (Institution or University) by slug, retrieves `clerkOrgId`.
- **Clerk Write:** Calls `addUserToClerkOrg()` from `lib/clerk-org.ts` to add the user to the Clerk organization as `org:member`.
- **Prisma Write:** Updates the User record with `institutionId` or `universityId`, `programmeId`, `year`, `period`, `branchId`, `role: 'STUDENT'`, and `onboarded: true`.
- Returns success/error; the calling page redirects to `/student`.
- Update `app/join/[slug]/page.tsx` to call this action instead of just redirecting to `/onboarding` — when a user is already authenticated and clicks the join link, auto-join them if they provide minimal info (programme, year, semester).
- Update `app/onboarding/_components/onboarding-form.tsx` to also call `joinUniversity` when `lockedInstitution` is set (magic link flow), ensuring the Clerk org membership is created.

### ✓ Step 2: Phase 2: Create the APK Download Page (app/download/page.tsx)
Build a mobile-first download landing page with APK download button, installation instructions, and QR code.

- Install `qrcode` (server-side QR generation, no React dependency needed) as a dependency.
- Create `app/download/page.tsx` — a Server Component that:
  - Renders a hero section with app branding and a large "Download APK" button linking to `/app-release.apk`.
  - Shows step-by-step Android installation instructions (allow unknown sources → open file → install).
  - Generates a QR code (pointing to `https://aplusmentality.vercel.app/download`) using the `qrcode` library as a Server Component, rendered as an `<img>` with a data-URL.
  - Uses Tailwind CSS for mobile-first responsive design, matching the existing app's design language (blue primary, dark mode support).
- Place a placeholder note in `public/` for the APK file (`app-release.apk`).
- Add `/download` to `publicRoutePatterns` in `proxy.ts` so it's accessible without auth.

### ✓ Step 3: Phase 3: Create DownloadBanner component and wire into app
Create a dismissible bottom banner for Android users prompting them to download the app.

- Create `components/DownloadBanner.tsx` — a client component that:
  - Detects Android via `navigator.userAgent` in a `useEffect`.
  - Shows a slim banner at the bottom: "Get the A+ Mentality App" with a link to `/download`.
  - Stores dismissal in `localStorage` (key: `download-banner-dismissed`).
  - Includes a dismiss button (X icon).
  - Uses Tailwind styling consistent with the app's design.
- Add the `DownloadBanner` to `app/layout.tsx` (root layout) so it appears on all pages.
- Add a "Download App" link to `components/AppFooter.tsx` in the Platform section.

### ✓ Step 4: Phase 4: Add Download App to Dashboard Navigation
Add a 'Download App' navigation item to the student dashboard sidebar.

- Update `components/DashboardLayout.tsx` — add a nav item `{ href: '/download', label: 'Download App', icon: Download, section: 'General' }` to `studentNavItems` (and optionally to tutor/lecturer nav items).
- Import the `Download` icon from `lucide-react` (already a dependency).
- This ensures students can easily find the download page from within the app.