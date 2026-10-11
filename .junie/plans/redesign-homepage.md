---
sessionId: session-261011-042922-1cwg
---

# Requirements

### Overview
Redesign the A+ Mentality homepage to remove all hallucinated numbers, add a glowing text animation for the platform name, keep accurate Zambian content (grading system, courses, testimonials), and optimize mobile scrolling.

### Key Changes

**Remove:**
- ❌ "Monthly Overview" fake dashboard section (6 courses, 3 completed, 24.5 hours, 87% score)
- ❌ Course rating numbers (4.7, 4.8, 4.9, etc.) and student counts (950, 1200, etc.) from course cards
- ❌ Any invented student/institution counts

**Keep:**
- ✅ University Grading System tables (accurate Zambian standards)
- ✅ Course codes (CHE111, BIO111, ICT261, etc.)
- ✅ All Zambian-specific content
- ✅ Testimonials (confirmed real: Sarah Mwansa, David Banda, Grace Phiri)
- ✅ Partner institutions, university logos, footer

**Add:**
- ✅ GlowingText component with blue fill animation
- ✅ Hero redesign with dark gradient + glowing "A+ Mentality" text
- ✅ Source note for grading tables (HEA reference)
- ✅ Mobile horizontal scroll hints for grading tables
- ✅ YouTube video embed in "Why Choose A+?" section
- ✅ Horizontal carousel for partner institutions

### Mobile Target
Reduce from ~10-12 screens to 6-7 screens maximum on mobile.

# Technical Design

### Current Implementation
- **Homepage**: `components/HomePageClient.tsx` (1460 lines, single monolithic component)
- **Framework**: Next.js, TypeScript strict, Tailwind CSS, framer-motion, lucide-react
- **Theme**: Primary `#2563eb`, Dark `#1e40af`, Accent `#10b981`, Background `#ffffff`/`#fafafa`
- **Existing animations**: `fadeInUp`, `staggerContainer`, `mobileSafe` variants already defined
- **University logos**: All 5 exist in `/public` (unza.png, cbu.png, mulu.png, nku.png, chau.png)

### Key Decisions
1. **GlowingText as separate component** — reusable, testable in isolation, accessible with `prefers-reduced-motion`
2. **Hero dark gradient** — `#0a0a0a → #1e3a8a` background to make the glowing text pop
3. **Remove course ratings/students from cards** — keep only code, title, description, and CTA button
4. **Grading tables in horizontal scroll** — `overflow-x-auto` wrapper with mobile swipe hint
5. **Keep testimonials** — confirmed real people

### Proposed Changes

#### New File: `components/glowing-text.tsx`
- Ghost outline start → blue fill animation (left to right) → glow when complete
- Props: `text`, `duration`, `color`, `className`
- Uses framer-motion for animation
- Respects `prefers-reduced-motion` (skip animation, show filled text immediately)
- Adds `aria-label` for accessibility

#### Modified: `components/HomePageClient.tsx`

**Hero Section (lines 260-352):**
- Replace current hero with dark gradient background
- Use GlowingText for "A+ Mentality"
- Subtitle: "Zambia's multi-university learning platform"
- CTAs: "Get started free", "Browse universities"
- Trust indicators: Built for Zambia, Works offline, Free for students
- Right side: Feature card with icons (no metrics)

**Remove Monthly Overview (lines 392-449):**
- Delete entire section — fake dashboard data on public homepage

**Course Cards (lines 696-907):**
- Remove `rating` and `students` from course data objects
- Remove rating stars and student count from card rendering
- Keep: course code badge, title, description, "Explore now" button

**Grading Section (lines 911-1052):**
- Wrap tables in `overflow-x-auto -mx-4 px-4` container
- Add mobile swipe hint (`sm:hidden`)
- Add source note below tables: "Based on HEA and university standards"
- Keep all grading numbers (they're standards, not invented data)

**Mobile Padding:**
- Reduce section padding: `py-16` → `py-10 sm:py-16` on wide sections
- Compact hero to fit one screen on mobile

### File Structure
```
components/
  glowing-text.tsx       # NEW - Glowing text animation component
  HomePageClient.tsx     # MODIFIED - Homepage redesign
```

### Section Order (Final)
1. BannerCarousel
2. Nav
3. Hero (glowing text)
4. Four Pillars
5. Top Zambian Universities
6. Must Explore
7. What We Offer
8. Courses by Year
9. University Grading System (with source note)
10. Sign Up as a Tutor
11. Why Choose A+? (with video)
12. Testimonials (real - keeping)
13. Partner Institutions
14. Advertise With Us
15. Word of Encouragement
16. Footer

# Testing

### Validation Approach
Verify each stage incrementally after implementation.

### Key Scenarios
- **GlowingText**: Renders text, animates fill left-to-right, respects reduced motion, shows aria-label
- **Hero**: Dark gradient visible, glowing text animates, CTAs link correctly, trust indicators show
- **Monthly Overview**: Section completely removed, no orphaned references
- **Course Cards**: No rating numbers or student counts visible, course codes intact
- **Grading Tables**: Horizontal scroll on mobile, swipe hint visible on small screens, source note present
- **Mobile**: Total scroll height reduced, no horizontal overflow

### Edge Cases
- Reduced motion preference: GlowingText shows filled text immediately
- Very small screens (<320px): Tables scroll, no overflow
- University logos: All 5 load from `/public`
- Testimonials carousel: Infinite scroll animation works

### Numbers to Verify Removed
- Course ratings: 4.7, 4.8, 4.9, 4.5, 4.6, 4.4
- Student counts: 950, 1200, 820, 1500, 1100, 780, 1300, 880, 650, 1800, 920, 540, 1020, 850, 720, 2200, 1350, 1600
- Dashboard stats: 6 courses, 3 completed, 24.5 hours, 87%

# Delivery Steps

### ✓ Step 1: Create GlowingText component
Create `components/glowing-text.tsx` with blue fill animation, glow effect, and accessibility support.
- Ghost outline start → blue fill left-to-right → glow on complete
- Props: `text`, `duration`, `color`, `className`
- framer-motion animation with `prefers-reduced-motion` support
- `aria-label` for screen readers
- Test in isolation by importing into a simple page

### ✓ Step 2: Redesign hero section
Replace the hero section in `HomePageClient.tsx` with dark gradient + GlowingText.
- Dark gradient background (`#0a0a0a → #1e3a8a`)
- GlowingText for "A+ Mentality" brand name
- Subtitle: "Zambia's multi-university learning platform"
- CTAs: "Get started free" (links to /sign-up), "Browse universities" (links to universities section)
- Trust indicators: Built for Zambia, Works offline, Free for students
- Right side: Feature card with icons (no metrics/numbers)
- Compact for mobile (fits one screen)

### ✓ Step 3: Remove Monthly Overview and clean course cards
Remove fake dashboard data and hallucinated numbers from course cards.
- Delete entire "Monthly Overview" section (lines 392-449)
- Remove `rating` and `students` fields from year1Courses and year2Course data
- Remove star rating and student count display from all course card renderings (4 semester blocks)
- Keep: course code, title, description, "Explore now" button
- Verify no other section references these removed fields

### ✓ Step 4: Improve grading section for mobile
Make grading tables mobile-friendly and add credibility.
- Wrap both tables in `overflow-x-auto -mx-4 px-4` container
- Add mobile swipe hint (visible only on small screens, `sm:hidden`)
- Reduce cell padding on mobile: `px-2 py-2 sm:px-4 sm:py-3`
- Add source note below tables: "Based on HEA and university standards" with italic muted styling
- Keep all grading numbers intact (they're accurate standards)
- Ensure color coding matches theme (green=Distinction, blue=Merit/Credit, yellow=Pass, red=Fail)

### ✓ Step 5: Mobile polish and final verification
Optimize mobile scrolling and verify all changes.
- Reduce section padding: `py-16` → `py-10 sm:py-16` on wide sections
- Verify complete removal of all hallucinated numbers (grep for patterns)
- Verify grading tables kept with source note
- Verify testimonials section intact (real people confirmed)
- Verify all university logos load from `/public`
- Verify all links functional (sign-in, sign-up, WhatsApp, email)
- Verify no horizontal overflow on mobile
- Confirm mobile scroll height target (6-7 screens)

### ✓ Step 6: Improve glowing text contrast & fix hero background
Update GlowingText to use brighter blue (#60a5fa) and stronger glow for better readability on dark background.
- Change default fillColor from #3b82f6 to #60a5fa
- Increase stroke width from 1.5px to 2px
- Strengthen glow shadows
- Ensure hero gradient is clean navy (#0a0a0a → #1e3a8a)

### ✓ Step 7: Convert partner institutions to horizontal carousel
Replace static grid with horizontally scrollable carousel.
- Create scrollable container with snap-to-card
- Add left/right arrow buttons for desktop
- Hide arrows on mobile, use swipe gesture
- Each card ~200px wide on mobile, ~240px on desktop
- Hide scrollbar with CSS

### ✓ Step 8: Add YouTube video embed
Embed the YouTube video (g6BtbIiJ_rc) in the "Why Choose A+?" section.
- Use iframe with proper aspect ratio (16:9)
- Lazy loading for performance
- Proper title for accessibility
- Already present from previous session

### ✓ Step 9: Remove remaining dashes and separators
Grep for em dashes, en dashes, middle dots, and vertical bars.
- All remaining dashes are in comments only, not visible text
- No changes needed

### ✓ Step 10: Final verification and push
- TypeScript: zero errors
- ESLint: passed during commit hook
- Git: pushed `c82536d..a92a44b main -> main`
- Vercel will auto-deploy from `main`