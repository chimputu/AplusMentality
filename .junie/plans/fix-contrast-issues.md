---
sessionId: session-261025-133651-12y3
---

# Requirements

### Overview
Fix contrast issues where dark text (`text-foreground`) appears on dark backgrounds (`bg-blue-500`, `bg-blue-600`, `bg-black`, etc.), making text unreadable.

### Scope
**In Scope:**
- Replace `text-foreground` with `text-white` on all buttons and elements with dark backgrounds
- Fix the navbar "Get Started" buttons in `HomePageClient.tsx`
- Fix the hero video title overlay in `HeroVideoFacade.tsx`
- Fix all form submit buttons, action buttons, and links with `bg-blue-600` background

**Out of Scope:**
- Changing the blue color scheme or button styles
- Modifying dark mode logic

### Key Findings
- **40+ instances** of `bg-blue-600 text-foreground` across the codebase
- The `text-foreground` Tailwind class resolves to a dark color, creating unreadable text on dark blue backgrounds
- The fix is consistent: replace `text-foreground` with `text-white` wherever a dark background is present

# Technical Design

### Current Implementation
The codebase uses `text-foreground` as a default text color class on buttons with `bg-blue-600` or `bg-blue-500` backgrounds. In Tailwind, `text-foreground` resolves to a dark color (typically near-black), making it unreadable on dark backgrounds.

### Proposed Changes
Replace `text-foreground` with `text-white` in all components where it appears alongside a dark background color.

**HomePageClient.tsx** (8+ instances):
- Line 261: Navbar "Get Started" button
- Line 283: Mobile menu "Get Started" link
- Lines 814, 974, 999, 1079, 1114, 1154, 1235: Various CTA buttons

**HeroVideoFacade.tsx** (2 instances):
- Line 52: Title text on `from-black/80` gradient
- Line 55: Subtitle text on `from-black/80` gradient

**Form submit buttons** (28+ files):
AssignmentSubmitButton, CreateAnnouncementForm, CreateCourseForm, CreateLessonForm, CreateModuleForm, EmptyState, FileViewer, LectureSlideForm, MarkLessonCompleteButton, ModuleList, PageHeader, QuizSubmitButton, SimpleChat, SlideViewerButton, StudentAssignmentList, StudentQuizList, StudentTestList, StudentVideoList, TestSubmitButton, UserManagement, VideoUploadForm, banner-form, SaveBookButton, course-card, tutor-image-uploader, ai-assistant-page, ai-assistant, home-ai-assistant, CourseList, TutorContent, banner-carousel

Each fix: `bg-blue-600 text-foreground` → `bg-blue-600 text-white`

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