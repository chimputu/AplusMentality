---
sessionId: session-261025-115642-13xy
---

# Homepage Design Consistency Audit

### Overview
Audit and refactor the entire homepage (`app/page.tsx` → `HomePageClient.tsx`) and its imported components to ensure 100% consistent design language across all sections: typography contrast, alternating section backgrounds, proper card styling, and global max-width containers.

### Current State
- **HomePageClient.tsx** (1388 lines): Already uses semantic utilities extensively (`bg-card`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`). Most sections are well-themed.
- **world-map-demo.tsx**: Already uses semantic utilities (`bg-background`, `text-foreground`, `text-primary`, `text-muted-foreground`). No changes needed.
- **animated-testimonials.tsx**: Has hardcoded colors (`text-black`, `text-gray-500`, `bg-gray-100`) that don't respect dark mode properly.
- **CSS Variables**: All 14 variables are exposed in `globals.css` `@theme inline` block. Utilities like `bg-card`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `border-border` work everywhere.

### Issues Found

1. **Testimonials section gradient masks** (HomePageClient.tsx lines 1083-1084): Uses `from-white` hardcoded gradients for fade effects. In dark mode, the white gradient is visible and doesn't blend with dark backgrounds.
2. **animated-testimonials.tsx**: Uses `text-black dark:text-white`, `text-gray-500 dark:text-neutral-500`, `bg-gray-100 dark:bg-neutral-800` — should use semantic utilities instead.
3. **"What We Offer" section** (line 587): Uses `bg-gradient-to-br from-blue-50 to-blue-100/50` — hardcoded light-mode gradient. Needs a dark mode counterpart.
4. **"Sign Up as a Tutor" section** (line 989): Uses `bg-gradient-to-r from-blue-50 to-emerald-50` — hardcoded light-mode gradient.
5. **"Advertise" section** (line 1032): Uses `bg-primary-light` which is fine (maps to CSS variable), but the inner card is correct.
6. **Section background rhythm**: Some adjacent sections have the same background (`bg-background` next to `bg-background`), reducing visual rhythm.

### Proposed Changes

#### 1. Fix Testimonials Gradient Masks
Replace hardcoded `from-white` gradients with theme-aware gradients using CSS variables.

- Line 1083: `from-white` → `from-background`
- Line 1084: `from-white` → `from-background`

#### 2. Refactor animated-testimonials.tsx
Replace all hardcoded colors with semantic utilities.

- `text-black dark:text-white` → `text-foreground`
- `text-gray-500 dark:text-neutral-500` → `text-muted-foreground`
- `text-gray-500 dark:text-neutral-300` → `text-muted-foreground`
- `bg-gray-100 dark:bg-neutral-800` → `bg-muted`
- `text-black` in button icons → `text-foreground`

#### 3. Fix Hardcoded Gradient Backgrounds
Add dark mode counterparts to gradient sections.

- "What We Offer" (line 587): `bg-gradient-to-br from-blue-50 to-blue-100/50` → `bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-muted dark:to-background`
- "Sign Up as a Tutor" (line 989): `bg-gradient-to-r from-blue-50 to-emerald-50` → `bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-muted dark:to-background`

#### 4. Improve Section Background Rhythm
Ensure alternating backgrounds for visual flow:
- Hero (image) → Four Pillars (`bg-card`) → Universities (`bg-background`) → World Map (`bg-background`) → Explore (`bg-muted`) → What We Offer (gradient) → Our Aim (`bg-background`) → Courses (`bg-background`) → Grading (`bg-background`) → Tutor CTA (gradient) → Advertise (`bg-primary-light`) → Testimonials (`bg-background`) → Why Choose (`bg-muted`) → Encouragement (`bg-blue-600`) → Partners (`bg-muted`) → Footer (`bg-background`)

Some adjacent `bg-background` sections should alternate to `bg-muted` for better rhythm.

### Scope
**In Scope:**
- Fix gradient masks in testimonials section
- Refactor animated-testimonials.tsx colors
- Add dark mode to gradient backgrounds
- Improve section background alternating rhythm

**Out of Scope:**
- WorldMap component (already themed correctly)
- Hero section (image-based, already correct)
- Navbar (already themed)
- Course cards (already themed)
- Footer (already themed)
- Video containers (`bg-black` is contextual, not a background color)
- Overlay backdrops (`bg-black/60` is intentional for contrast)

# Testing

### Validation Approach
Verify each stage by toggling between light and dark mode and checking that all elements transition smoothly without flash.

### Key Scenarios
1. **First visit**: Page loads with OS system preference (dark OS → dark theme)
2. **Theme toggle**: Click toggle → all colors transition smoothly (0.2s ease)
3. **Page navigation**: Navigate between routes → theme persists
4. **Tab sync**: Open new tab → same theme as current tab
5. **Signed-in user**: Theme preference saved to DB, synced across devices
6. **Clerk pages**: Sign-in/Sign-up pages respect current theme
7. **Dashboard**: Sidebar, header, content all respect theme
8. **Modals**: Cookie consent, theme dropdown, etc. respect theme

### Edge Cases
1. **Hydration mismatch**: `theme === undefined` fallback in ThemeToggle renders correctly
2. **Theme during SSR**: No FOIT on initial page load
3. **System theme change**: OS theme change while app is open → app updates
4. **Clerk overlays**: UserButton popover respects theme
5. **Form inputs**: All form fields have proper dark mode styling
6. **Scrollbars**: Custom scrollbar uses theme variables

### Test Changes
No automated test changes — validation is visual/manual by toggling themes across all major pages.

# Turbopack Build Fix

### Problem
`lib/auth/scope.ts` has `'use server'` at the top of the file. In Turbopack (Next.js 16), this directive causes all `export function` declarations to be treated as Server Functions, which must be `async`. The 4 synchronous utility functions (`buildCourseScopeWhere`, `buildCourseResourceScopeWhere`, `isResourceInScope`, `assertWriteAllowed`) fail the build because they are not async.

### Fix
Remove `'use server'` from `lib/auth/scope.ts`. The `getScopeContext` function still works on the server because it's imported from Server Components and Route Handlers (server contexts). The utility functions are pure synchronous helpers — they never need `'use server'` since they're never called from client components.

# Delivery Steps (Build Fix)

### ✓ Step 1: Remove `'use server'` from `lib/auth/scope.ts`
Remove the directive so Turbopack no longer treats the 4 utility functions as Server Functions.

- Edit `lib/auth/scope.ts`: Delete the `'use server';` line at the top
- Verify `getScopeContext` still works (it's imported from server contexts only)
- Verify all 16 import sites still work (page.tsx files and API routes)

### ✓ Step 2: Verify build and push
Confirm the build passes locally and deploy.

- Run `npm run build` to verify Turbopack no longer errors on the 4 functions
- Commit and push to `main`
- Verify Vercel deployment succeeds

# Delivery Steps (Homepage Design Consistency)

### ✓ Step 1: Fix animated-testimonials.tsx and homepage gradient issues
Replace hardcoded colors in animated-testimonials.tsx and fix gradient masks/backgrounds in HomePageClient.tsx.

- `components/ui/animated-testimonials.tsx`: Replace `text-black dark:text-white` → `text-foreground`, `text-gray-500 dark:text-neutral-500` → `text-muted-foreground`, `text-gray-500 dark:text-neutral-300` → `text-muted-foreground`, `bg-gray-100 dark:bg-neutral-800` → `bg-muted`, button icon `text-black` → `text-foreground`
- `components/HomePageClient.tsx` line 1083-1084: Replace `from-white` → `from-background` in testimonial scroll gradient masks
- `components/HomePageClient.tsx` line 587: Add `dark:from-muted dark:to-background` to "What We Offer" gradient
- `components/HomePageClient.tsx` line 989: Add `dark:from-muted dark:to-background` to "Sign Up as a Tutor" gradient

### * Step 2: Improve section background rhythm and push
Alternate adjacent sections with identical backgrounds and deploy.

- `components/HomePageClient.tsx`: Change Courses section (line 717) from `bg-background` to `bg-muted` to alternate with "Our Aim" section above
- `components/HomePageClient.tsx`: Change Grading section (line 841) from `bg-background` to `bg-background` (keep, alternates with muted Courses)
- Run `npm run build` to verify no errors
- Commit and push to `main`

# Delivery Steps

### ✓ Step 1: Extend CSS variable exposure in globals.css
Add all CSS variables to the `@theme inline` block so Tailwind v4 generates semantic utilities like `bg-card`, `bg-muted`, `text-muted-foreground`, `bg-input`, `border-border`, `bg-accent`, `bg-destructive`.

- Update `app/globals.css`: Extend `@theme inline` to map all 14 CSS variables (`--background`, `--foreground`, `--primary`, `--primary-hover`, `--primary-light`, `--border`, `--card`, `--card-hover`, `--input`, `--muted`, `--muted-foreground`, `--accent`, `--destructive`, `--destructive-hover`) to Tailwind color utilities
- Add Clerk CSS overrides in `globals.css` for dark mode (`.dark .cl-...` selectors)
- Verify that new utilities like `bg-card`, `text-muted-foreground` work in a test component

### ✓ Step 2: Refactor DashboardLayout and HomePageClient colors
Replace hardcoded colors in the two most visible components with semantic utilities.

- `components/DashboardLayout.tsx`: Replace `bg-white`, `text-black`, `bg-gray-*`, `text-gray-*` with `bg-card`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`, etc.
- `components/HomePageClient.tsx`: Same refactoring pattern — replace all hardcoded color classes with semantic utilities
- Verify dark mode toggle works correctly on dashboard and home pages

### ✓ Step 3: Refactor remaining component colors
Replace hardcoded colors in all remaining components with semantic utilities.

- `components/AdminContent.tsx` — ~20 hardcoded instances
- `components/AppFooter.tsx`
- `components/CookieConsentModal.tsx` — ~6 instances
- `components/CourseList.tsx`
- `components/CreateAnnouncementForm.tsx`
- `components/CreateCourseForm.tsx` — ~10 instances
- `components/CreateLessonForm.tsx` — ~8 instances
- `components/CreateModuleForm.tsx` — ~5 instances
- `components/AssignmentSubmitButton.tsx`
- `components/EmptyState.tsx`
- `components/FileViewer.tsx` — ~8 instances
- `components/HeroVideoFacade.tsx`
- Verify all components respect dark mode after refactoring

### ✓ Step 4: Integrate Clerk theme and finalize
Add Clerk `appearance` prop to auth components and push to git.

- `app/sign-in/[[...sign-in]]/page.tsx`: Add `appearance` prop to `<SignIn />` with CSS variable-based theming
- `app/sign-up/[[...sign-up]]/page.tsx`: Add `appearance` prop to `<SignUp />` with CSS variable-based theming
- `components/DashboardLayout.tsx`: Add `appearance` prop to `<UserButton />` instances (lines 884 and 1114)
- Run `git add`, `git commit`, and `git push` to deploy changes
- Final verification: toggle theme on sign-in, sign-up, dashboard, and home pages