---
sessionId: session-261030-014421-1lbg
---

# Requirements

### Overview & Goals
Add a "Download for Windows" feature to the A+ Mentality home page, including a high-converting download section, navbar navigation link, footer updates, and middleware fixes to ensure public pages are accessible without login.

### Scope

**In Scope:**
1. Add a Windows Download section to `HomePageClient.tsx` (before the inline footer)
2. Add "Download App" link to the Navbar (desktop + mobile hamburger menu) with smooth scroll to the download section
3. Fix `proxy.ts` middleware — add `/privacy-policy` and `/terms-of-service` to public routes
4. Add "Download for Windows" link in the inline Footer under "Quick Links"
5. Migrate newsletter subscription from EmailJS to Brevo server-side email
6. Create a basic `/about` placeholder page (footer links reference it)

**Out of Scope:**
- Creating a separate `/download` route (task explicitly says not to)
- Building an actual Windows installer (placeholder link only)
- Modifying the standalone `AppFooter.tsx` component (the home page uses an inline footer)

### Functional Requirements

1. **Download Section** — placed near the bottom of HomePageClient, before the footer
   - Headline: "Get A+ Mentality for Windows"
   - Subtext: "Study offline, access past papers instantly, and sync your progress."
   - CTA Button: blue button with Windows icon linking to `/downloads/aplus-setup.exe`
   - CSS-based laptop/desktop mockup frame
   - 3-column features grid: Offline Mode, Fast Performance, Auto-Sync (lucide-react icons)
   - Dark/Light mode support (`bg-gray-50 dark:bg-neutral-900`)

2. **Navbar Update**
   - New "Download App" link with `<Download />` icon as a secondary button
   - Style: `border border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-md px-3 py-1.5`
   - Links to `/#download` for smooth scroll
   - Added to mobile hamburger menu as well

3. **Footer Fixes**
   - Add `/privacy-policy` and `/terms-of-service` to public routes in `proxy.ts`
   - Add "Download for Windows" link in footer Quick Links
   - Create `/about` placeholder page

4. **Brevo Email Migration**
   - Replace EmailJS newsletter subscription in HomePageClient with a server action that uses the existing Brevo email system (`lib/email/send.ts`)

# Technical Design

### Current Implementation

**HomePageClient.tsx** (`components/HomePageClient.tsx`, 1325 lines):
- Single-file component with embedded navbar (lines 247-293), all content sections, and an inline footer (lines 1176-1284)
- Does NOT use the `AppFooter` component — the footer is hardcoded inline
- Navbar has: Sign In, Get Started links (desktop) + hamburger menu (mobile)
- Newsletter subscription uses **EmailJS** (client-side, lines 156-186) — `handleSubscribe` function
- Uses framer-motion for animations, lucide-react for icons, Tailwind CSS for styling
- Dark mode support via Tailwind's `dark:` prefix

**proxy.ts** (middleware, 151 lines):
- Public routes array (lines 5-29) includes `/`, `/about`, `/download` but **missing** `/privacy-policy` and `/terms-of-service`
- This causes footer links to `/privacy-policy` and `/terms-of-service` to trigger Clerk login redirects

**lib/email/send.ts** — Brevo server-side email utility:
- `sendEmail({ to, subject, html })` function, ready to use
- Uses `@getbrevo/brevo` SDK v6
- Falls back to console logging if `BREVO_API_KEY` is not set

**Existing pages:**
- `app/privacy-policy/page.tsx` — exists, well-designed
- `app/terms-of-service/page.tsx` — exists, well-designed
- `app/download/page.tsx` — exists (Android APK downloads)
- `app/about/page.tsx` — **does NOT exist**

### Key Decisions

1. **Download section placement**: Insert the new section between the "Partner Institutions" carousel (line ~1173) and the inline footer (line ~1176). This is the natural bottom-of-page position before the footer.

2. **Smooth scroll via hash**: Use `<a href="#download">` in the navbar to scroll to a section with `id="download"` — no JavaScript router needed, native browser behavior.

3. **Brevo migration**: Replace the client-side EmailJS `handleSubscribe` with a server action (`@/lib/email/send`) called via a Next.js Route Handler or `use server` function. This ensures emails are actually delivered server-side.

4. **CSS desktop mockup**: Create a pure CSS laptop frame (no images) using Tailwind — a rounded rectangle with a "screen" area showing a simplified app preview.

5. **About page**: Create a minimal placeholder page matching the design style of existing privacy/terms pages.

### Proposed Changes

#### 1. HomePageClient.tsx — Add Download Section
- Add `id="download"` to the new section for anchor scrolling
- Import additional icons: `Download, Monitor, WifiOff, Zap, RefreshCw` from lucide-react
- Add the section between the Partner Institutions carousel and the inline footer
- Design: gradient background, centered headline, CSS desktop mockup, 3-column feature grid
- Dark mode: `bg-gray-50 dark:bg-neutral-900` with appropriate text colors

#### 2. HomePageClient.tsx — Update Navbar
- Add "Download App" button between "Get Started" and the SmartCorp badge in the desktop nav
- Add "Download App" link to the mobile hamburger menu
- Use `href="/#download"` for smooth scroll

#### 3. HomePageClient.tsx — Update Inline Footer
- Add "Download for Windows" link under "Quick Links" section
- Link to `/#download`

#### 4. HomePageClient.tsx — Migrate Newsletter to Brevo
- Replace `handleSubscribe` EmailJS logic with a `fetch()` call to a new API route `/api/subscribe`
- Create `app/api/subscribe/route.ts` that uses `sendEmail` from `lib/email/send.ts`

#### 5. proxy.ts — Add Missing Public Routes
- Add `/privacy-policy` and `/terms-of-service` to `publicRoutePatterns`

#### 6. Create /about placeholder page
- Create `app/about/page.tsx` with a clean design matching the existing privacy/terms pages

### File Structure

```
components/
  HomePageClient.tsx          (MODIFIED — download section, navbar, footer, brevo)
proxy.ts                      (MODIFIED — add public routes)
app/
  api/
    subscribe/
      route.ts                (NEW — Brevo newsletter subscription endpoint)
  about/
    page.tsx                  (NEW — about placeholder page)
```

### Architecture Diagram

``` mermaid
graph LR
  A[HomePageClient Navbar] -->|href=#download| B[Download Section]
  A -->|Mobile Menu| B
  C[Footer Quick Links] -->|/#download| B
  D[Newsletter Form] -->|POST /api/subscribe| E[API Route Handler]
  E -->|sendEmail| F[Brevo SDK]
  G[Footer Privacy Link] -->|proxy.ts public route| H[privacy-policy/page.tsx]
  I[Footer Terms Link] -->|proxy.ts public route| J[terms-of-service/page.tsx]
```

# Delivery Steps

### ✓ Step 1: Add Download Section and Update Navbar in HomePageClient
Add the Windows download section to HomePageClient and update the navbar with the Download App link.

**HomePageClient.tsx changes:**
- Import new icons: `Download, Monitor, WifiOff, Zap, RefreshCw` from lucide-react
- Add the download section (with `id="download"`) between the Partner Institutions carousel and the inline footer
- Section includes: headline "Get A+ Mentality for Windows", subtext, CTA button linking to `/downloads/aplus-setup.exe`, CSS-based desktop mockup, and 3-column features grid (Offline Mode, Fast Performance, Auto-Sync)
- Dark mode support: `bg-gray-50 dark:bg-neutral-900`, `text-foreground`, etc.
- Add "Download App" button with `<Download />` icon to the desktop navbar (between "Get Started" and SmartCorp badge)
- Add "Download App" link to the mobile hamburger menu
- Both navbar links use `href="/#download"` for smooth scroll
- Add "Download for Windows" link in the inline Footer under "Quick Links"

### ✓ Step 2: Fix Middleware Public Routes and Create About Page
Add missing public routes to proxy.ts and create the /about placeholder page.

**proxy.ts changes:**
- Add `/privacy-policy` to `publicRoutePatterns` array
- Add `/terms-of-service` to `publicRoutePatterns` array
- These routes will no longer trigger Clerk login redirects

**New file — app/about/page.tsx:**
- Create a clean placeholder page matching the design style of existing privacy/terms pages
- Include: gradient header with "About A+ Mentality", mission statement, team section, and contact info
- Dark mode support, back-to-home link, and consistent styling

### ✓ Step 3: Migrate Newsletter to Brevo (bonus)
- Created `app/api/subscribe/route.ts` — Brevo newsletter subscription endpoint
- Updated `handleSubscribe` in HomePageClient to use `fetch('/api/subscribe')` instead of EmailJS

### ✓ Step 4: Build Verification
- IDE lint confirms no new errors introduced — all reported errors are pre-existing IDE indexing issues