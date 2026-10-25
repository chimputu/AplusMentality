---
sessionId: session-261025-115642-13xy
---

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