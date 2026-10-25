---
sessionId: session-261025-133651-12y3
---

# Requirements

### Overview
Redesign the Welcome Banner in `components/TutorContent.tsx` to look like a premium, modern SaaS dashboard (Stripe, Vercel, or Linear style). The current banner has a flat dark blue gradient with basic text and badges that lack depth, hierarchy, and visual polish.

### Scope
**In Scope:**
- Redesign the welcome header banner in `TutorContent.tsx` (lines 46-69)
- Apply premium gradient background with decorative glow effect
- Elevate typography with high contrast and proper hierarchy
- Transform status badges (Verified/Active) into glassmorphism style
- Ensure responsive layout (mobile to desktop)

**Out of Scope:**
- Adding new elements (university badges, notification chips, profile avatars)
- Modifying other components or the rest of the dashboard
- Changing the data or props passed to the component

### Design Specifications

#### Background & Depth
- Replace flat `bg-gradient-to-r from-blue-600 to-indigo-600` with a deeper gradient: `bg-gradient-to-r from-blue-950 via-slate-900 to-black`
- Add a decorative blurred glow circle using absolute positioning, `bg-blue-500/20`, and `blur-3xl`
- Make the container `relative` with `overflow-hidden` to contain the glow

#### Typography
- "Welcome back" label: small accent text, `text-blue-400 text-sm font-medium uppercase tracking-wider`
- "{displayName}!" heading: massive, `text-3xl md:text-4xl font-bold text-white`
- Subtitle text: `text-slate-300` instead of `text-blue-100`

#### Badges (Glassmorphism)
- Replace solid color badges with glass effect: `bg-white/10 backdrop-blur-md border border-white/20 text-white`
- Icon colors: keep `text-green-400` for Verified, `text-blue-400` for Active
- Badge text: `text-sm font-medium`
- Add subtle hover effects for interactivity

# Technical Design

### Current Implementation
The welcome banner in `TutorContent.tsx` (lines 46-69) is a simple gradient div:
```tsx
<div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold">Welcome back, {displayName}!</h1>
      <p className="text-blue-100 mt-1">{subtitle}</p>
    </div>
    <div className="flex items-center gap-2">
      {stats.isVerified && <VerifiedBadge />}
      {stats.isActive && <ActiveBadge />}
    </div>
  </div>
</div>
```

### Proposed Changes

#### 1. Background gradient replacement
- `from-blue-600 to-indigo-600` → `from-blue-950 via-slate-900 to-black`
- Add `relative overflow-hidden` to the container

#### 2. Decorative glow element
- Insert an absolutely positioned div with `bg-blue-500/20 blur-3xl rounded-full` in the top-right area
- Position: `absolute -top-20 -right-20 w-64 h-64`

#### 3. Typography hierarchy
- Split "Welcome back" and "{displayName}!" into separate elements
- "Welcome back": `text-blue-400 text-sm font-medium uppercase tracking-wider`
- "{displayName}!": `text-3xl md:text-4xl font-bold text-white mt-1`
- Subtitle: `text-slate-300 mt-2`

#### 4. Glassmorphism badges
- Current Verified badge: `bg-green-500/20 text-green-200`
- New Verified badge: `bg-white/10 backdrop-blur-md border border-white/20 text-white`
- Icon: `text-green-400`
- Current Active badge: `bg-blue-500/20 text-blue-200`
- New Active badge: `bg-white/10 backdrop-blur-md border border-white/20 text-white`
- Icon: `text-blue-400`

### File Structure
- **Modified**: `components/TutorContent.tsx` (lines 46-69 only)

# Delivery Steps

### ✓ Step 1: Fix HomePageClient.tsx navbar and CTA buttons
Replace `text-foreground` with `text-white` on all dark-background buttons in HomePageClient.tsx.
- Line 261: Navbar "Get Started" button: `bg-blue-600 text-foreground` → `bg-blue-600 text-white`
- Line 283: Mobile menu "Get Started" link: same fix
- Lines 814, 974, 999, 1079, 1114, 1154, 1235: All CTA buttons with `bg-blue-600 text-foreground` → `bg-blue-600 text-white`

### ✓ Step 2: Fix HeroVideoFacade.tsx text overlay
Replace `text-foreground` with `text-white` on title overlay text in HeroVideoFacade.tsx.
- Line 52: `text-foreground font-semibold` → `text-white font-semibold`
- Line 55: `text-foreground/70 text-xs` → `text-white/70 text-xs`

### ✓ Step 3: Fix form submit and action buttons across all components
Replace `text-foreground` with `text-white` in all remaining components that have dark background buttons.
- Fix `bg-blue-600 text-foreground` → `bg-blue-600 text-white` in: AssignmentSubmitButton, CreateAnnouncementForm, CreateCourseForm, CreateLessonForm, CreateModuleForm, EmptyState, FileViewer, LectureSlideForm, MarkLessonCompleteButton, ModuleList, PageHeader, QuizSubmitButton, SimpleChat, SlideViewerButton, StudentAssignmentList, StudentQuizList, StudentTestList, StudentVideoList, TestSubmitButton, UserManagement, VideoUploadForm, banner-form, SaveBookButton, course-card, tutor-image-uploader, ai-assistant-page, ai-assistant, home-ai-assistant, CourseList, TutorContent, banner-carousel

### ✓ Step 4: Redesign Welcome Banner in TutorContent.tsx
Transform the welcome header into a premium SaaS-style banner with depth, glassmorphism, and proper typography hierarchy.
- Replace background gradient: `from-blue-600 to-indigo-600` → `from-blue-950 via-slate-900 to-black`
- Add decorative glow circle: absolute positioned `bg-blue-500/20 blur-3xl` div
- Split heading into two lines: "Welcome back" (accent color, small) + "{displayName}!" (massive white text)
- Change subtitle color from `text-blue-100` to `text-slate-300`
- Transform Verified badge to glassmorphism: `bg-white/10 backdrop-blur-md border border-white/20 text-white` with `text-green-400` icon
- Transform Active badge to glassmorphism: same glass style with `text-blue-400` icon
- Ensure responsive layout with proper spacing on mobile vs desktop

### ✓ Step 5: Fix remaining contrast issues in course badges, YouTube badges, and notification bell
Fix the last 4 files that still have `text-foreground` on dark backgrounds.
- **`course-card.tsx`** (2 fixes):
  - Line 59: Course code badge `${badgeBg} text-foreground` → `${badgeBg} text-white` (fixes BIO111, CS101, etc.)
  - Line 84: "Explore" button `${buttonBg} text-foreground` → `${buttonBg} text-white`
- **`NotificationBell.tsx`** (1 fix):
  - Line 188: Notification count `bg-red-500 text-foreground` → `bg-red-500 text-white`
- **`StudentVideoList.tsx`** (1 fix):
  - Line 111: YouTube badge `bg-red-500 text-foreground` → `bg-red-500 text-white`
- **`VideoList.tsx`** (1 fix):
  - Line 140: YouTube badge `bg-red-500 text-foreground` → `bg-red-500 text-white`