---
sessionId: session-261025-131905-1e4h
---

# Requirements

### Overview
Replace the current horizontal scrolling testimonials section on the homepage with the Aceternity UI `AnimatedTestimonials` component. Both the core UI component and the demo wrapper already exist in the project, but they need updates before being integrated into the homepage.

### Current State
- **`components/ui/animated-testimonials.tsx`** — Already exists, but uses a raw `<img>` tag (will cause Vercel build warnings/errors).
- **`components/animated-testimonials-demo.tsx`** — Already exists, but contains generic placeholder testimonials instead of the actual A+ Mentality testimonials.
- **`components/HomePageClient.tsx`** — Contains the current horizontal scrolling testimonials section (lines 1068–1119) with 3 testimonials that need to be replaced.

### Prerequisites Verification
- ✅ **TypeScript** — Project uses TypeScript.
- ✅ **shadcn/ui** — `components.json` exists, configured with Aceternity registry.
- ✅ **Tailwind CSS v4** — `tailwindcss: ^4.3.3`.
- ✅ **Dependencies** — `@tabler/icons-react` (^3.49.0) and `motion` (^14.6.0) are already installed.

### What Needs to Change
1. **Fix `animated-testimonials.tsx`**: Replace `<img>` with Next.js `<Image />` to prevent Vercel build errors.
2. **Update `animated-testimonials-demo.tsx`**: Replace generic data with the 3 real A+ Mentality testimonials.
3. **Update `HomePageClient.tsx`**: Remove the horizontal scrolling testimonials section, import and render `<AnimatedTestimonialsDemo />` in its place, keeping the "What Our Community Says" heading and matching dark/light mode theming.

### Out of Scope
- Creating `lib/utils.ts` (not needed for this component).
- Replacing Unsplash image URLs with actual user photos (noted for later).

# Technical Design

### Current Implementation

**Testimonials data** (in `HomePageClient.tsx`, lines 178–182):
- Grace Phiri, Student, Lusaka
- Sarah Mwansa, Medical Student, UNZA  
- David Banda, Engineering Graduate, CBU

**Current testimonials section** (`HomePageClient.tsx`, lines 1068–1119): A `motion.section` with horizontal scroll animation, gradient fade masks, and card-based layout with star ratings and quote icons.

### Proposed Changes

#### 1. Fix `components/ui/animated-testimonials.tsx`
- Import `Image` from `next/image`.
- Replace the `<img>` tag (line 82–89) with `<Image>` using `fill` prop and `sizes` attribute.
- Keep all existing motion animations and structure intact.

#### 2. Update `components/animated-testimonials-demo.tsx`
- Replace the 5 generic testimonials with the 3 real A+ Mentality testimonials.
- Map the data format: `role` → `designation`, keep `quote` and add Unsplash `src` URLs.

#### 3. Update `components/HomePageClient.tsx`
- Remove the entire testimonials section block (lines 1068–1119).
- Remove the `testimonials` array from component state (lines 178–182).
- Remove unused imports: `Star`, `Quote` from `lucide-react`.
- Import `AnimatedTestimonialsDemo`.
- Add a new section with the heading "What Our Community Says", `py-20` spacing, and `<AnimatedTestimonialsDemo />`.

### Key Decisions
- **Keep `motion` package** — The project already has `motion` ^14.6.0, component uses `motion/react` import.
- **Use `Image` with `fill`** — The parent `div` has fixed dimensions (`h-80 w-full`), so `fill` works naturally.
- **Remove `testimonials` array from HomePageClient** — Data moves to the demo component.

# Delivery Steps

### ✓ Step 1: Fix animated-testimonials.tsx to use Next.js Image
Replace the raw `<img>` tag with Next.js `<Image>` component to prevent Vercel build errors.
- Import `Image` from `next/image` in `components/ui/animated-testimonials.tsx`.
- Replace `<img src={...} alt={...} width={500} height={500} ... />` with `<Image src={...} alt={...} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="h-full w-full rounded-3xl object-cover object-center" draggable={false} />`.
- Keep all motion animations, structure, and existing styling intact.

### ✓ Step 2: Update animated-testimonials-demo.tsx with real testimonials
Replace generic placeholder data with the 3 real A+ Mentality testimonials.
- Update `components/animated-testimonials-demo.tsx`.
- Replace the 5 generic testimonials with:
  - Grace Phiri, Student, Lusaka
  - Sarah Mwansa, Medical Student, UNZA
  - David Banda, Engineering Graduate, CBU
- Map fields: `role` → `designation`, use Unsplash image URLs for `src`.
- Keep the component structure and export intact.

### ✓ Step 3: Integrate AnimatedTestimonialsDemo into the homepage
Replace the horizontal scrolling testimonials section with the new animated component.
- In `components/HomePageClient.tsx`:
  - Remove the `testimonials` array (lines 178–182).
  - Remove the entire testimonials `motion.section` block (lines 1068–1119).
  - Remove unused imports (`Star`, `Quote` from `lucide-react`) if no longer referenced elsewhere.
  - Import `AnimatedTestimonialsDemo` from `@/components/animated-testimonials-demo`.
  - Add a new section with `py-20` spacing, `bg-background`, the heading "What Our Community Says", and `<AnimatedTestimonialsDemo />`.
  - Ensure dark/light mode compatibility with `text-foreground` and `text-muted-foreground` classes.