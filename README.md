# A+ Mentality — Learning Management System

> **Empowering Zambian lifelong learners through technology.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2d3748)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#-license)

---

## 📖 About

**A+ Mentality** is a multi-tenant Learning Management System (LMS) and tutor marketplace built for Zambian higher education institutions. It connects students, lecturers, tutors, and administrators in a unified platform for course delivery, content sharing, assessments, and peer tutoring — accessible from any device, even offline.

The platform supports **multiple universities** with full data isolation, a **5-tier role system** with granular permissions, and a **tutor marketplace** where students can discover and book qualified tutors.

---

## 📋 Table of Contents

- [Roles & Permissions](#-roles--permissions)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [API Overview](#-api-overview)
- [Security](#-security)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)
- [Author](#-author)
- [Acknowledgments](#-acknowledgments)

---

## 👥 Roles & Permissions

A+ Mentality uses a **5-tier role-based access control (RBAC)** system enforced at the middleware, API, and UI levels:

| Role | Description | Key Capabilities |
|------|-------------|-----------------|
| **SUPER_ADMIN** | Platform owner with global access | Manage all institutions, organizations, users; bypass all data filters; system health monitoring |
| **ADMIN** | University-level administrator | Manage users, courses, programmes, tutors, and content within their institution; approve tutor applications |
| **LECTURER** | Faculty member | Create and manage courses; upload videos, slides, past papers; create assignments, quizzes, and tests; grade submissions |
| **TUTOR** | Peer tutor | Upload content to assigned courses; manage tutor profile, specialties, and offerings; receive reviews and requests |
| **STUDENT** | Learner | Browse and enroll in courses; watch videos; take assessments; submit assignments; find and book tutors |

### Route Protection

Middleware (`proxy.ts`) enforces role-based route access:

- `/super-admin/*` → SUPER_ADMIN only
- `/admin/*` → ADMIN, SUPER_ADMIN
- `/lecturer/*` → LECTURER
- `/tutor/*` → TUTOR
- `/student/*` → STUDENT

Unauthorized access redirects users to their role-appropriate dashboard.

### Data Isolation

- **SUPER_ADMIN**: Sees all data across all institutions
- **ADMIN**: Scoped to their own institution only
- **LECTURER/TUTOR**: Can only write to courses they are assigned to (via course ownership or TutorSpecialty)
- **STUDENT**: Read-only access to published content within their institution

---

## ✨ Features

### 🎓 Learning Management

- **Courses & Programmes**: Hierarchical structure — institutions → programmes → courses → modules → lessons
- **Video Lessons**: Upload to Cloudinary or embed YouTube links, organized by course
- **Lecture Slides**: Upload and view PDF, PowerPoint, and other presentation formats
- **Past Exam Papers**: Browse and download by course, year, and semester
- **Assignments**: File-based submissions with grading workflow (pending → graded → returned)
- **Quizzes**: Create and take quizzes with automatic or manual grading
- **Tests**: Timed assessments with score tracking and result pages
- **Progress Tracking**: Lesson completion and course enrollment progress
- **Announcements**: Institution-wide announcements with read-tracking notifications

### 🤝 Tutor Marketplace

- **Tutor Applications**: Students apply to become tutors; admins review and approve
- **Tutor Profiles**: Tutors manage specialties, offerings, availability, and ratings
- **Find a Tutor**: Students browse tutors by specialty, rating, and availability
- **Tutor Requests**: Students can request tutoring sessions
- **Reviews & Ratings**: Students rate tutors after sessions
- **Institution Change Requests**: Tutors can request to switch institutions

### 🤖 AI Study Assistant

- **AI Chat**: Powered by OpenRouter with multiple AI model providers (Google, Groq)
- **Context-Aware**: Landing page chat answers platform questions; logged-in chat provides institution-specific study help
- **Smart Caching**: Redis (Upstash) caches AI responses for fast repeat queries

### 👤 User Experience

- **Authentication**: Clerk-powered with social login and webhook-based user sync
- **Dark/Light/System Theme**: Persistent theme preference synced to database
- **PWA**: Installable on mobile devices with offline support (Serwist)
- **Responsive Design**: Mobile-first layout with collapsible navigation
- **Search**: Real-time search across courses, videos, announcements, and more
- **Notifications**: Announcement read-tracking with notification bell
- **E-Book Library**: Browse, read, and save books from public-domain sources

### 📊 Admin & Analytics

- **User Management**: List, promote, and manage users with bulk operations
- **Institution Management**: Create and configure universities, colleges, and programmes
- **Content Analytics**: View submission analytics and grade distributions
- **Export Tools**: Export institutions, users, students, gradebooks, and tutor data
- **Banner Management**: Create and manage promotional banners
- **Health Checks**: System health monitoring endpoints

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.x | App Router, Server/Client Components, API Routes |
| **React** | 19.x | UI library |
| **TypeScript** | 5.9 | Type safety |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **Framer Motion** | 12.x | Animations |
| **Recharts** | 2.x | Data visualization |
| **Sonner** | 1.x | Toast notifications |
| **Tabler Icons** | 3.x | Icon library |
| **Lucide React** | 1.x | Icon library |

### Backend & Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| **Prisma** | 7.x | ORM with PostgreSQL |
| **PostgreSQL** | 16+ | Primary database |
| **Clerk** | — | Authentication and user management |
| **Cloudinary** | 2.x | Video and file storage |
| **Upstash Redis** | 1.x | Caching layer |
| **OpenRouter AI** | — | AI model provider |
| **Vercel AI SDK** | 7.x | AI streaming |
| **Resend** | 6.x | Email delivery |
| **Brevo** | 6.x | Email marketing |
| **Sentry** | 11.x | Error tracking and monitoring |
| **Serwist** | 9.x | PWA service worker |

### Development & Testing

| Technology | Purpose |
|------------|---------|
| **Vitest** | Unit and integration testing |
| **Testing Library** | React component testing |
| **ESLint** | Code linting |
| **Husky** | Git hooks |
| **jsdom** | DOM simulation for tests |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client (Browser / PWA)                       │
├─────────────────────────────────────────────────────────────────┤
│                  Next.js 16 App Router                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Server     │  │   Client     │  │   API Routes │         │
│  │  Components  │  │  Components  │  │  (REST)      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
├─────────────────────────────────────────────────────────────────┤
│              Middleware (proxy.ts + Clerk)                       │
│         Role-based route protection & auth                      │
├─────────────────────────────────────────────────────────────────┤
│              Scope Enforcement Layer                             │
│    (lib/auth/scope.ts — institution + course-assignment checks)  │
├─────────────────────────────────────────────────────────────────┤
│              Caching Layer (Upstash Redis)                       │
├─────────────────────────────────────────────────────────────────┤
│              Database Layer (Prisma + PostgreSQL)                │
├─────────────────────────────────────────────────────────────────┤
│              Storage Layer (Cloudinary)                          │
├─────────────────────────────────────────────────────────────────┤
│              AI Layer (OpenRouter + Vercel AI SDK)              │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Layout

Four distinct dashboards, each with role-specific navigation:

- **Admin Dashboard**: Institutions, organizations, programmes, courses, users, tutor applications, assessments, analytics, exports, banners, change requests
- **Lecturer Dashboard**: Courses, videos, slides, past papers, assignments, quizzes, tests, enrollments, student grades, announcements
- **Tutor Dashboard**: Tutor requests, specialties, offerings, reviews, courses, upload materials, application status
- **Student Dashboard**: Courses, videos, materials, assessments, assignments, past papers, e-books, find tutor, results, AI chat

---

## 📦 Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 22.x | JavaScript runtime |
| **npm** | 10.x+ | Package manager |
| **PostgreSQL** | 16+ | Database |
| **Git** | Latest | Version control |
| **Docker** | Latest (optional) | Local database container |

### Required Accounts

- [**Clerk**](https://clerk.com) — Authentication
- [**Cloudinary**](https://cloudinary.com) — Media storage
- [**Upstash**](https://upstash.com) — Redis caching
- [**OpenRouter**](https://openrouter.ai) — AI chat
- [**Resend**](https://resend.com) — Email delivery
- [**Brevo**](https://brevo.com) — Email marketing (optional)
- [**Sentry**](https://sentry.io) — Error tracking (optional)
- [**Neon**](https://neon.tech) or [**Supabase**](https://supabase.com) — Database hosting (optional)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/chimputu/AplusMentality.git
cd AplusMentality
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Fill in all required credentials. See [Environment Variables](#-environment-variables).

### 4. Set Up the Database

#### Option A: Local PostgreSQL (Docker)

```bash
docker run --name amentality-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=amentality \
  -p 5432:5432 \
  -v amentality-data:/var/lib/postgresql/data \
  -d postgres:17
```

#### Option B: Cloud Database

Set `DATABASE_URL` to your Neon, Supabase, or other PostgreSQL connection string.

#### Push the Schema

```bash
npm run db:push
```

### 5. Run the Development Server

```bash
npm run dev
```

The app starts at `http://localhost:3000`.

### 6. (Optional) Seed the Database

```bash
npm run db:seed
```

### Useful Commands

```bash
npm run build          # Production build
npm start              # Start production server
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Test coverage report
npx prisma studio      # Database GUI
```

---

## 🔐 Environment Variables

See `.env.example` for the complete template.

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI chat |

### Recommended

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Your app's public URL |
| `RESEND_API_KEY` | Resend API key for email |
| `BREVO_API_KEY` | Brevo API key for email marketing |
| `SENTRY_DSN` | Sentry error tracking DSN |

---

## 🗄️ Database Schema

The database models a complete multi-tenant LMS:

### Core Entities

| Model | Description |
|-------|-------------|
| **User** | Authenticated users with 5-tier roles, Clerk ID, institution, and theme |
| **Institution** | Universities, colleges, polytechnics with academic system config |
| **Organisation** | Sub-units within institutions (faculties, departments) |
| **Programme** | Academic programmes (degrees, diplomas) with hierarchical structure |
| **Course** | Courses with code, title, category, level, year, and period |

### Content

| Model | Description |
|-------|-------------|
| **Module** | Modules within courses, ordered sequentially |
| **Lesson** | Lessons within modules, linked to videos, slides, or quizzes |
| **Video** | Uploaded or embedded videos (Cloudinary/YouTube) |
| **LectureSlide** | Uploaded lecture slides (PDF, PPT, etc.) |
| **PastPaper** | Past exam papers with course, year, and semester |
| **Book** | E-books from public-domain sources |

### Assessments

| Model | Description |
|-------|-------------|
| **Assignment** | File-based assignments with due dates |
| **AssignmentSubmission** | Student submissions with grading |
| **Quiz** | Quizzes with questions and auto/manual grading |
| **QuizSubmission** | Student quiz responses with scores |
| **Test** | Timed assessments |
| **TestSubmission** | Student test responses |
| **Question** | Reusable question bank (MC, true/false, essay, etc.) |

### Tutor Marketplace

| Model | Description |
|-------|-------------|
| **Tutor** | Tutor profiles linked to User accounts |
| **TutorSpecialty** | Tutor-course assignments and specialties |
| **TutorOffering** | Tutor availability and pricing |
| **TutorApplication** | Pending tutor applications for admin approval |
| **TutorRequest** | Student requests for tutoring |
| **TutorReview** | Student ratings and reviews of tutors |

### Engagement

| Model | Description |
|-------|-------------|
| **Enrollment** | Student-course enrollment with progress |
| **LessonCompletion** | Per-lesson completion tracking |
| **Announcement** | Institution-wide announcements |
| **NotificationSeen** | Read-tracking for announcements |
| **SavedBook** | Student's bookmarked e-books |

---

## 📁 Project Structure

```
AplusMentality/
├── app/
│   ├── (dashboard)/           # Role-based dashboards
│   │   ├── admin/             # Admin dashboard
│   │   │   ├── courses/       # Course CRUD
│   │   │   ├── institutions/  # Institution management
│   │   │   ├── organizations/ # Organization management
│   │   │   ├── programmes/    # Programme management
│   │   │   ├── tutor-applications/ # Tutor approval workflow
│   │   │   ├── tutor-requests/    # Tutor request management
│   │   │   ├── assessments/   # Assessment engine
│   │   │   ├── questions/     # Question bank
│   │   │   ├── submissions/   # All submissions overview
│   │   │   ├── analytics/     # Analytics dashboard
│   │   │   ├── banners/       # Banner management
│   │   │   ├── change-requests/ # Institution change requests
│   │   │   └── users/         # User management
│   │   ├── lecturer/          # Lecturer dashboard
│   │   │   ├── courses/       # Course creation and management
│   │   │   ├── videos/        # Video uploads
│   │   │   ├── lecture-slides/# Slide uploads
│   │   │   ├── past-papers/   # Past paper uploads
│   │   │   ├── assignments/   # Assignment creation
│   │   │   ├── quizzes/       # Quiz creation
│   │   │   ├── tests/         # Test creation
│   │   │   ├── grades/        # Student grading
│   │   │   └── enrollments/   # Enrollment management
│   │   ├── tutor/             # Tutor dashboard
│   │   │   ├── requests/      # Tutoring requests
│   │   │   ├── specialties/   # Specialty management
│   │   │   ├── offerings/     # Availability and pricing
│   │   │   ├── reviews/       # Student reviews
│   │   │   └── courses/       # Assigned courses
│   │   ├── student/           # Student dashboard
│   │   │   ├── courses/       # Browse and enroll
│   │   │   ├── videos/        # Watch videos
│   │   │   ├── materials/     # All materials by category
│   │   │   ├── assessments/   # Take assessments
│   │   │   ├── assignments/   # Submit assignments
│   │   │   ├── quizzes/       # Take quizzes
│   │   │   ├── tests/         # Take tests
│   │   │   ├── past-papers/   # Browse past papers
│   │   │   ├── books/         # E-book library
│   │   │   ├── find-tutor/    # Find and book tutors
│   │   │   ├── results/       # Grades and results
│   │   │   ├── ai/            # AI study assistant
│   │   │   └── profile/       # User profile
│   │   └── explore/           # Public institution explorer
│   │       └── [slug]/        # Institution pages
│   │           ├── courses/   # Browse courses
│   │           └── programmes/# Browse programmes
│   ├── api/                   # REST API endpoints
│   │   ├── assignments/       # Assignment CRUD + submissions
│   │   ├── announcements/     # Announcement CRUD
│   │   ├── analytics/         # Analytics data
│   │   ├── books/             # E-book browsing
│   │   ├── courses/           # Course CRUD
│   │   ├── enrollments/       # Enrollment management
│   │   ├── export/            # Data export endpoints
│   │   ├── health/            # Health check endpoints
│   │   ├── institution-change-request/ # Institution switch requests
│   │   ├── lecture-slides/    # Slide CRUD
│   │   ├── lecturer/          # Lecturer-specific endpoints
│   │   ├── modules/           # Module CRUD
│   │   ├── notifications/     # Notification management
│   │   ├── past-papers/       # Past paper CRUD
│   │   ├── programmes/        # Programme CRUD
│   │   ├── quizzes/           # Quiz CRUD + submissions
│   │   ├── search/            # Search endpoint
│   │   ├── tests/             # Test CRUD + submissions
│   │   ├── tutors/            # Tutor marketplace
│   │   ├── user/              # User role endpoint
│   │   ├── users/             # User management
│   │   ├── videos/            # Video CRUD
│   │   └── webhooks/clerk/    # Clerk webhook
│   ├── sign-in/               # Authentication pages
│   ├── join/                  # Institution join pages
│   ├── about/                 # About page
│   ├── privacy-policy/        # Privacy policy
│   ├── terms-of-service/      # Terms of service
│   └── layout.tsx             # Root layout with providers
├── components/                # Reusable UI components
│   ├── DashboardLayout.tsx    # Role-based dashboard layout
│   ├── SimpleChat.tsx         # AI chat widget
│   ├── ThemeToggle.tsx        # Theme switcher
│   └── NotificationBell.tsx   # Notification bell
├── lib/                       # Shared utilities
│   ├── auth/                  # Authentication and authorization
│   │   ├── scope.ts           # Role-based scope enforcement
│   │   ├── org-scope.ts       # Organization-level scoping
│   │   └── api-auth.ts        # API route auth helpers
│   ├── actions/               # Server actions
│   │   ├── institution-crud.ts
│   │   ├── tutor-application.ts
│   │   ├── tutor-crud.ts
│   │   ├── user-admin.ts
│   │   └── ...
│   ├── prisma.ts              # Prisma client
│   ├── cache.ts               # Redis client
│   ├── cloudinary.ts          # Cloudinary config
│   └── ...
├── prisma/
│   └── schema.prisma          # Database schema
├── proxy.ts                   # Middleware for auth and RBAC
├── public/                    # Static assets and PWA manifest
├── .env.example               # Environment variable template
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

---

## 🔌 API Overview

All API routes require authentication unless noted. Role requirements are enforced at the route level.

### Content Management

| Endpoint | Roles | Description |
|----------|-------|-------------|
| `GET /api/courses` | All | List published courses (scoped by role) |
| `POST /api/courses` | ADMIN, SUPER_ADMIN | Create course |
| `POST /api/lecturer/courses` | LECTURER, ADMIN | Lecturer course creation (institution-scoped) |
| `GET /api/videos` | All | List videos (scoped by role) |
| `POST /api/videos` | TUTOR, LECTURER, ADMIN | Upload video (course-assignment verified) |
| `POST /api/lecture-slides` | TUTOR, LECTURER, ADMIN | Upload slide (course-assignment verified) |
| `POST /api/past-papers` | TUTOR, LECTURER, ADMIN | Upload past paper (course-assignment verified) |

### Assessments

| Endpoint | Roles | Description |
|----------|-------|-------------|
| `POST /api/assignments` | TUTOR, LECTURER, ADMIN | Create assignment |
| `POST /api/assignments/[id]/submit` | STUDENT | Submit assignment |
| `POST /api/quizzes` | TUTOR, LECTURER, ADMIN | Create quiz |
| `POST /api/quizzes/[id]/submit` | STUDENT | Submit quiz |
| `POST /api/tests` | TUTOR, LECTURER, ADMIN | Create test |
| `POST /api/tests/[id]/submit` | STUDENT | Submit test |

### Tutor Marketplace

| Endpoint | Roles | Description |
|----------|-------|-------------|
| `GET /api/tutors` | All | Browse tutors |
| `POST /api/tutors/upload` | TUTOR | Upload tutor content |
| `GET /api/institution-change-request/admin` | ADMIN | View change requests |

### Administration

| Endpoint | Roles | Description |
|----------|-------|-------------|
| `GET /api/users` | ADMIN, SUPER_ADMIN | List users (scoped by role) |
| `POST /api/users/promote` | ADMIN, SUPER_ADMIN | Change user role |
| `POST /api/users/promote/bulk` | ADMIN, SUPER_ADMIN | Bulk role changes |
| `GET /api/export/*` | ADMIN, SUPER_ADMIN | Data export endpoints |
| `GET /api/health` | Public | Health check |
| `GET /api/health/detailed` | ADMIN, SUPER_ADMIN | Detailed health check |

### AI & Search

| Endpoint | Roles | Description |
|----------|-------|-------------|
| `POST /api/chat` | Public (rate-limited) | AI chat with caching |
| `GET /api/search?q=` | Authenticated | Search content |

---

## 🔒 Security

### Role-Based Access Control

- **Middleware** (`proxy.ts`): DB-first role lookup with fail-closed behavior; role-based route protection
- **Scope Enforcement** (`lib/auth/scope.ts`): Institution-level data isolation with course-assignment verification for write operations
- **API Routes**: Granular role checks on every endpoint; `isUserAuthorizedForCourse` verifies TUTOR/LECTURER assignment before writes

### Data Isolation

- SUPER_ADMIN bypasses all institution filters
- ADMIN is scoped to their own institution
- LECTURER/TUTOR can only write to courses they own or are assigned to
- STUDENT has read-only access within their institution

### Security Headers

Configured in `next.config.ts`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Error Tracking

Sentry integration for production error monitoring and performance tracking.

---

## 🧪 Testing

The project uses **Vitest** with **React Testing Library** and **jsdom**.

```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode for TDD
npm run test:coverage  # Generate coverage report
```

Test files are co-located with source files and cover:

- Middleware role verification
- Authentication and authorization
- Scope enforcement and data isolation
- Server actions
- API route role checks
- Tutor CRUD operations
- Role sync between Clerk and Prisma

---

## 🚢 Deployment

### Platform Requirements

- **Node.js 22** runtime
- **PostgreSQL** database
- All environment variables configured

### Deploy to Render (Recommended)

1. Create a [Render](https://render.com) account and a new Web Service
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node 22
4. Add all environment variables from `.env.example`
5. Push to `main` to trigger deployment

### Environment Checklist

For production, ensure:

- Clerk uses `pk_live_` / `sk_live_` keys
- Database URL points to a production PostgreSQL instance
- Redis uses production Upstash credentials
- `NEXT_PUBLIC_SITE_URL` matches your deployment URL

---

## 🧑‍💻 Contributing

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Coding Standards

- ✅ Use TypeScript for all new code
- ✅ Follow Next.js App Router patterns
- ✅ Write tests for new features
- ✅ Handle errors gracefully
- ✅ Respect role-based access boundaries
- ✅ Scope data queries to the user's institution

### Pre-Commit Hooks

Husky runs ESLint on every commit. Fix lint errors before committing.

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| **Can't reach database** | Verify `DATABASE_URL` and network connectivity |
| **Unique constraint on clerkId** | User already exists; check Clerk sync |
| **CLERK_WEBHOOK_SECRET not set** | Add to `.env` from Clerk dashboard |
| **Cloudinary upload failed** | Verify credentials and folder permissions |
| **SSL connection error** | Add `?sslmode=require` to `DATABASE_URL` |
| **Redis connection error** | Verify Upstash URL and token |
| **Role not recognized** | Check Prisma `role` enum matches Clerk metadata |

### Quick Fixes

```bash
npx prisma generate      # Regenerate Prisma client
npx prisma db push       # Sync schema to database
rm -rf .next             # Clear Next.js cache
npm run dev              # Restart development server
```

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

## 👤 Author

**Kafiswe George Chimputu**

- 📧 kafiswegchimputu@gmail.com
- 💻 [GitHub](https://github.com/chimputu)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) — React Framework
- [Clerk](https://clerk.com) — Authentication
- [Prisma](https://prisma.io) — ORM
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [Cloudinary](https://cloudinary.com) — Media Storage
- [Upstash](https://upstash.com) — Redis Caching
- [OpenRouter](https://openrouter.ai) — AI Models
- [Vercel AI SDK](https://sdk.vercel.ai) — AI Streaming
- [Framer Motion](https://www.framer.com/motion) — Animations
- [Serwist](https://serwist.pages.dev) — PWA
- [Sentry](https://sentry.io) — Error Tracking
- [Recharts](https://recharts.org) — Data Visualization
- [Resend](https://resend.com) — Email Delivery
- [Brevo](https://brevo.com) — Email Marketing
- [Tabler Icons](https://tabler.io/icons) — Icons
- [Lucide Icons](https://lucide.dev) — Icons

---

*Built with ❤️ by Kafiswe George Chimputu — Empowering Zambian lifelong learners.*