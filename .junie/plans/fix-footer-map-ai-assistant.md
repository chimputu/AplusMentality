---
sessionId: session-261030-113956-113g
---

# Requirements

### Overview
Convert the "What We Offer" feature cards in `HomePageClient.tsx` from a static 4-column grid into an infinite horizontal marquee that scrolls smoothly, matching the style of the university logo carousel.

### Functional Requirements

#### Feature Cards Marquee
- As a visitor, I see the 8 feature cards scrolling horizontally in an infinite loop.
- The marquee scrolls right-to-left seamlessly without visible gaps.
- The animation pauses when I hover over the cards.
- The cards have gradient fade masks on the left and right edges for a smooth blend.
- On mobile, the cards scroll at a comfortable speed and are tappable.

### Out of Scope
- Changing card content, images, or descriptions.
- Adding new feature cards.
- Changing the section heading or subtitle.

# Technical Design

### Current Implementation

**Feature Cards (lines 717-805 of `HomePageClient.tsx`):**
- 8 cards in a `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6` layout.
- Each card is a `motion.div` with `variants={fadeInUp}`, `h-48 sm:h-56`, and hover effects.
- Cards use Next.js `<Image>` with gradient overlays (`from-black/80 via-black/40`).
- White text (`text-white` titles, `text-gray-100` descriptions).

**University Logo Marquee (lines 220-256):**
- Uses CSS keyframes (`@keyframes marquee`) — `translateX(0)` to `translateX(-50%)`.
- Duplicates the array (`[...items, ...items]`) for seamless looping.
- Wraps in `flex gap-4 animate-marquee` with `overflow-hidden` container.
- Edge fade masks: `absolute` positioned gradient divs (`from-background to-transparent`).
- Pauses on hover via `.animate-marquee:hover { animation-play-state: paused; }`.

**CSS Keyframes (lines 1661-1681):**
- `@keyframes marquee` already defined and used by `animate-marquee` class.
- 30s linear infinite duration.

### Key Decisions

1. **Reuse the existing CSS marquee pattern** — The university logo carousel already uses a proven CSS-based infinite scroll. No need for Framer Motion here — CSS is simpler and more performant for this use case.

2. **Duplicate the 8 cards array** — Create a `doubled` array (`[...cards, ...cards]`) so the animation loops seamlessly when `translateX` reaches -50%.

3. **Fixed card widths** — Each card needs a fixed width (e.g., `w-[280px] sm:w-[320px]`) to ensure consistent spacing and seamless looping.

4. **Same fade masks** — Reuse the left/right gradient overlay pattern from the university carousel for visual consistency.

### Proposed Changes

#### Convert Feature Cards Grid to Marquee in `HomePageClient.tsx`

1. **Extract card data into a constant** — Move the 8-card array from the JSX into a `featureCards` constant (similar to `partnerInstitutions`).

2. **Create a `FeatureCardsMarquee` component** — A function component that:
   - Duplicates the cards array for seamless looping.
   - Wraps cards in an `overflow-hidden` container with edge fade masks.
   - Uses the existing `animate-marquee` CSS class.
   - Each card has a fixed width (`w-[280px] sm:w-[320px]`) and `flex-shrink-0`.

3. **Replace the grid** — Remove the `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` wrapper and replace it with the new marquee component.

4. **Adjust animation speed** — The university marquee uses 30s. For 8 cards (16 doubled), a slightly faster speed (e.g., 25s) may be better since cards are wider. This can be tuned.

### File Structure

| File | Change |
|------|--------|
| `components/HomePageClient.tsx` | Convert feature cards grid to infinite marquee |

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

### ✓ Step 6: Convert Feature Cards to Infinite Marquee
Replace the static 4-column grid with an infinite horizontal scrolling marquee.
- Extract the 8 feature cards into a `featureCards` constant array near the top of the file (after `partnerInstitutions`).
- Create a `FeatureCardsMarquee` function component (similar to `UniversitiesCarousel`):
  - Duplicate the array: `const doubled = [...featureCards, ...featureCards]`.
  - Wrap in `div.relative.overflow-hidden` with left/right gradient fade masks.
  - Inner track uses `flex gap-6 animate-marquee` classes.
  - Each card has `flex-shrink-0 w-[280px] sm:w-[320px]` fixed width.
  - Reuse the existing card markup (Image, gradient overlay, text) but without `motion.div` wrappers (CSS animation handles the scrolling).
- Replace the current grid section (lines 734-803) with `<FeatureCardsMarquee />`.
- Add a new CSS keyframe (e.g., `@keyframes featureMarquee`) with a slightly faster duration (25s) for wider cards, or reuse the existing `animate-marquee` class.
- Ensure hover pause works: `.animate-feature-marquee:hover { animation-play-state: paused; }`.