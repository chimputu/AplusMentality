---
sessionId: session-261030-113956-113g
---

# Requirements

### Overview
Elevate the public `HomeClient` page from "good" to "world-class" across 5 pillars: Visual Hierarchy, Performance, Conversion Optimization, Micro-Interactions, and Accessibility. Additionally, add a QR code to the Download section and a Light/Dark mode theme toggle to the public navbar.

### Functional Requirements

#### QR Code in Download Section
- As a desktop visitor, I see a QR code in the Download section that I can scan with my phone to download the app.
- The QR code is wrapped in a white container so it scans reliably in both light and dark modes.

#### Theme Toggle in Public Navbar
- As a visitor (not logged in), I can switch between Light, Dark, and System themes using a toggle button in the navbar.
- The toggle is visible on both desktop and mobile.
- The theme preference persists across page reloads (via `next-themes` localStorage).

#### Performance Improvements
- Heavy below-the-fold components (World Map, Testimonials) are lazy-loaded to speed up initial page load.
- No layout shift (CLS) from images — all images use Next.js `<Image>` with proper `sizes` and `priority`.

#### Accessibility
- All buttons and links have visible focus rings (`focus-visible:ring-2`).
- The page works at 360px width with all grids stacking vertically.

### Out of Scope
- Changes to the authenticated dashboard (it already has a theme toggle).
- New content or copy changes.
- Grading section redesign (already completed).

# Technical Design

### Current Implementation

**Navbar (inline in `HomePageClient.tsx`, lines 387-444):**
- Already sticky (`sticky top-0 z-50`).
- Uses `bg-card` background (theme-aware).
- No theme toggle present.
- Mobile menu exists with hamburger toggle.

**Feature Cards (lines 710-779):**
- Already have `text-white` titles and `text-gray-100` descriptions.
- Already have gradient overlay (`from-black/80 via-black/40`).
- Use Next.js `<Image>` with `fill`, `sizes`, and `priority` props.
- Have hover effects (`hover:scale-[1.03]`, `group-hover:scale-110`).

**Download Section (lines 1526-1614):**
- Has desktop mockup, CTA button, and feature cards.
- No QR code present.
- `react-qr-code` is NOT installed.

**Theme Support:**
- `next-themes` and `ThemeProvider` are already set up globally in `app/providers.tsx`.
- `ThemeToggle.tsx` exists in `components/` with a dropdown menu (Light/Dark/System).
- Used in `DashboardLayout.tsx` but NOT in the public navbar.
- The component handles hydration mismatch (shows placeholder when `theme === undefined`).

**Animations:**
- Framer Motion variants (`fadeInUp`, `staggerContainer`) already defined and used extensively.
- Sections use `whileInView` with `viewport={{ once: true }}`.

**Heavy Components:**
- `WorldMapDemo` and `AnimatedTestimonialsDemo` are imported directly (not lazy loaded).
- These are below the fold and block initial paint.

### Key Decisions

1. **Reuse existing ThemeToggle** — The `ThemeToggle.tsx` component is already production-ready with hydration fix, dropdown menu, and DB sync for logged-in users. For public visitors, the DB sync is skipped automatically. No new component needed.

2. **Install `react-qr-code`** — A lightweight, well-maintained library for generating QR codes in React. The QR code will encode the app download URL.

3. **Lazy load World Map and Testimonials** — Use `next/dynamic` with `ssr: false` and `loading` fallback. These components are below the fold and don't need to render on the server.

4. **Add focus-visible rings** — Add `focus-visible:ring-2 focus-visible:ring-blue-500` to interactive elements that lack them.

### Proposed Changes

#### 1. Install `react-qr-code` and add QR Code to Download Section
- Run `npm install react-qr-code`.
- In `HomePageClient.tsx`, import `QRCode` from `react-qr-code`.
- Add a QR code component in the Download section (lines 1526-1614) next to the desktop mockup.
- Wrap in a white container: `bg-white p-4 rounded-xl inline-block`.
- The QR code encodes the app download URL (e.g., the sign-up page or Windows download link).

#### 2. Add Theme Toggle to Public Navbar
- Import `ThemeToggle` from `@/components/ThemeToggle` in `HomePageClient.tsx`.
- Add `<ThemeToggle />` to the desktop navbar (line 397-420) next to the "Download App" link.
- Add `<ThemeToggle />` to the mobile menu (lines 427-443) above the "Sign In" link.

#### 3. Lazy Load Heavy Components
- Wrap `WorldMapDemo` and `AnimatedTestimonialsDemo` imports with `next/dynamic`.
- Add loading fallback skeletons.

#### 4. Add Focus States
- Add `focus-visible:ring-2 focus-visible:ring-blue-500` to CTA buttons, explore cards, and nav links that lack them.

### File Structure

| File | Change |
|------|--------|
| `package.json` | Add `react-qr-code` dependency |
| `components/HomePageClient.tsx` | Add QR code, theme toggle, lazy imports, focus states |

# Delivery Steps

### ✓ Step 1: Add /api/chat to public routes in proxy.ts
Fix the AI Assistant on the public homepage by allowing anonymous access to the chat API.
- Open `proxy.ts` and add `/api/chat` to the `publicRoutePatterns` array.
- This is the only change needed — the AI component and API route already handle guest mode correctly.
- Verify that the `/api/chat` route is matched before the Clerk auth check at line 91.

### ✓ Step 2: Update World Map to connect Zambia to all 7 continents
Replace the current 5 connection dots with 7 dots spanning all continents.
- Open `components/world-map-demo.tsx` and update the `dots` array in the `WorldMap` component.
- New destinations: London (Europe), New York (N. America), Beijing (Asia), São Paulo (S. America), Sydney (Oceania), Antarctica, Cairo (Africa).
- All dots originate from Lusaka, Zambia (lat: -15.3875, lng: 28.3228).

### ✓ Step 3: Add QR Code to Download Section
Add a scannable QR code to the Download section so desktop users can easily access the app on their phones.
- Run `npm install react-qr-code`.
- Import `QRCode` from `react-qr-code` in `HomePageClient.tsx`.
- Add a QR code component in the Download section (after the desktop mockup, before the CTA button).
- Wrap in `bg-white p-4 rounded-xl inline-block shadow-lg` for reliable scanning in dark mode.
- The QR code encodes the app sign-up URL (`https://aplusmentality.com/sign-up`) or the Windows download page.
- Position it in a responsive layout: stacked on mobile, side by side on desktop.

### ✓ Step 4: Add Theme Toggle to Public Navbar
Allow anonymous visitors to switch between Light, Dark, and System themes.
- Import the existing `ThemeToggle` component from `@/components/ThemeToggle`.
- Add `<ThemeToggle />` to the desktop navbar next to the "Download App" link (around line 413).
- Add `<ThemeToggle />` to the mobile menu above the "Sign In" link (around line 428).
- The component already handles hydration mismatch and skips DB sync for anonymous users.

### ✓ Step 5: Lazy Load Heavy Components and Add Focus States
Improve initial page load performance and accessibility.
- Wrap `WorldMapDemo` import with `next/dynamic({ ssr: false, loading: () => <Skeleton /> })`.
- Wrap `AnimatedTestimonialsDemo` import similarly.
- Add `focus-visible:ring-2 focus-visible:ring-blue-500` to CTA buttons, explore cards, and nav links that lack visible focus indicators.
- Verify the page works at 360px width with all grids stacking vertically.