# A+ Mentality — Learning Management System

## 🚀 Overview

**A+ Mentality** is a modern, role-based Learning Management System (LMS) built for Zambian students, with a primary focus on **Mulungushi University**. It provides a complete learning experience: courses, lessons, quizzes, tests, assignments, past exam papers, lecture slides, an e-book library, and an AI-powered study assistant — all accessible from any device, even offline.

**Technology Stack:** Next.js 16, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Clerk, Cloudinary, Upstash Redis, OpenRouter AI, PWA

---

## 📋 Table of Contents

- [Features](#-features)
- [Technical Architecture](#-technical-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Role-Based Access Control (RBAC)
- **Admin Dashboard**: Full content management — create courses, modules, lessons, quizzes, tests, assignments, lecture slides, past papers, and announcements. Grade submissions and manage users.
- **Student Dashboard**: Enroll in courses, watch lessons, take quizzes and tests, submit assignments, browse past papers, read e-books, track progress, and chat with the AI study assistant.

### Core Learning Features
- ✅ **Courses & Modules**: Hierarchical course structure with modules and lessons
- ✅ **Video Lessons**: Upload videos to Cloudinary or embed YouTube links
- ✅ **Lecture Slides**: Upload and view presentation slides (PDF, PowerPoint, etc.)
- ✅ **Quizzes**: Create and take quizzes with automatic or manual grading
- ✅ **Tests**: Timed assessments with submission tracking
- ✅ **Assignments**: File-based assignments with submission and grading workflow
- ✅ **Past Exam Papers**: Browse and download past university exam papers by course, year, and semester
- ✅ **E-Book Library**: Browse, read, and save educational books from public-domain sources (Project Gutenberg, Open Library)
- ✅ **Progress Tracking**: Track lesson completions and course enrollment progress
- ✅ **Announcements**: Admin announcements with read-tracking notifications

### AI-Powered Study Assistant
- ✅ **AI Chat**: Powered by OpenRouter with free AI models, cached with Redis for fast responses
- ✅ **Context-Aware**: Landing page chat answers questions about the platform; logged-in chat provides Mulungushi University-specific study help
- ✅ **Smart Caching**: Redis (Upstash) caches AI responses and model selection for performance

### User Experience
- ✅ **Authentication**: Clerk-powered secure authentication with social login
- ✅ **Dark/Light/System Theme**: Persistent theme preference synced to database
- ✅ **PWA (Progressive Web App)**: Installable on mobile devices with offline support
- ✅ **Responsive Design**: Mobile-first layout with collapsible navigation
- ✅ **Search**: Real-time search across announcements, videos, and courses
- ✅ **Notifications**: Announcement read-tracking with notification bell

### Technical Highlights
- ⚡ **Next.js 16 App Router** with Server and Client Components
- 🔒 **TypeScript** for end-to-end type safety
- 🎨 **Tailwind CSS v4** for styling
- 📊 **Prisma ORM** with PostgreSQL and connection pooling
- 🔐 **Clerk** for authentication and user management
- 📁 **Cloudinary** for video and file storage
- 💾 **Upstash Redis** for response caching and performance
- 🤖 **OpenRouter AI** for the study assistant (Vercel AI SDK)
- 📱 **PWA** support via `next-pwa`
- 🎭 **Framer Motion** for animations
- 🔒 **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser / PWA)                  │
├─────────────────────────────────────────────────────────────┤
│                   Next.js 16 App Router                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Server     │  │   Client     │  │   API Routes │    │
│  │  Components  │  │  Components  │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Authentication Layer                     │
│                      (Clerk SDK)                            │
├─────────────────────────────────────────────────────────────┤
│                    Caching Layer                            │
│                  (Upstash Redis)                            │
├─────────────────────────────────────────────────────────────┤
│                    Database Layer                           │
│              (Prisma ORM + PostgreSQL)                      │
├─────────────────────────────────────────────────────────────┤
│                    Storage Layer                            │
│           (Cloudinary — Video & File Storage)               │
├─────────────────────────────────────────────────────────────┤
│                    AI Layer                                 │
│           (OpenRouter + Vercel AI SDK)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18.x or higher | JavaScript runtime |
| **npm** | 9.x or higher | Package manager |
| **Docker** | Latest | PostgreSQL container (optional) |
| **PostgreSQL** | 16.x | Production database |
| **Git** | Latest | Version control |

### Required Accounts
- [Clerk](https://clerk.com) — Authentication
- [Cloudinary](https://cloudinary.com) — Video and file storage
- [Upstash](https://upstash.com) — Redis caching
- [OpenRouter](https://openrouter.ai) — AI chat assistant
- [Neon](https://neon.tech) or [Supabase](https://supabase.com) — Database hosting (optional)

---

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/chimputu/AplusMentality.git
cd AplusMentality
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
```bash
cp .env.example .env
```

Then fill in your actual credentials. See [Environment Variables](#-environment-variables) below.

---

## 🔐 Environment Variables

See `.env.example` for a complete template. Key variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_live_` for production) | ✅ Yes |
| `CLERK_SECRET_KEY` | Clerk secret key (`sk_live_` for production) | ✅ Yes |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret | ✅ Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | ✅ Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | ✅ Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI chat | ✅ Yes |
| `NEXT_PUBLIC_SITE_URL` | Your app's public URL | ⚠️ Recommended |

---

## 🗄️ Database Setup

### Option 1: Local PostgreSQL (Docker) — Recommended for Development

```bash
# Pull and run PostgreSQL
docker run --name amentality-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=amentality \
  -p 5432:5432 \
  -v amentality-data:/var/lib/postgresql/data \
  -d postgres:17

# Update DATABASE_URL in .env, then:
npx prisma generate
npx prisma db push
```

### Option 2: Production Database (Prisma Data Proxy / Neon / Supabase)

1. Create a database on your preferred host
2. Set `DATABASE_URL` in `.env`
3. Generate the Prisma client: `npx prisma generate`
4. Push the schema: `npx prisma db push`

---

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
App runs at `http://localhost:3000`.

### Production Build
```bash
npm run build
npm start
```

### Prisma Studio (Database GUI)
```bash
npx prisma studio
```

---

## 📚 Database Schema

The database models a complete LMS with the following entities:

| Model | Description |
|-------|-------------|
| **User** | Authenticated users (Admin/Student) with Clerk ID, role, and theme preference |
| **Announcement** | Admin announcements with author tracking |
| **Course** | Courses with code, title, category, and publish status |
| **Module** | Modules within courses, ordered sequentially |
| **Lesson** | Lessons within modules, optionally linked to a video, slide, or quiz |
| **Video** | Uploaded or embedded videos (Cloudinary/YouTube) |
| **LectureSlide** | Uploaded lecture slides (PDF, PPT, etc.) |
| **Quiz** | Quizzes with embed/form URLs, due dates, and publish status |
| **QuizSubmission** | Student quiz submissions with score, feedback, and grading status |
| **Test** | Tests similar to quizzes, with max score tracking |
| **TestSubmission** | Student test submissions |
| **Assignment** | Assignments with file submissions |
| **AssignmentSubmission** | Student assignment submissions with file URLs |
| **PastPaper** | Past exam papers with course code, year, semester, and file download |
| **Book** | E-books from public-domain sources (Gutenberg, Open Library) |
| **SavedBook** | Student's saved/bookmarked books |
| **Enrollment** | Student-course enrollment with progress tracking |
| **LessonCompletion** | Tracks which lessons a student has completed |
| **NotificationSeen** | Tracks which announcements a student has read |

---

## 📁 Project Structure

```
AplusMentality/
├── app/
│   ├── (auth)/                # Authentication routes
│   │   └── sign-in/           # Sign-in page
│   ├── (dashboard)/           # Protected dashboard routes
│   │   ├── admin/             # Admin dashboard
│   │   │   ├── courses/       # Course management
│   │   │   ├── lessons/       # Lesson management
│   │   │   ├── quizzes/       # Quiz management + submissions
│   │   │   ├── tests/         # Test management
│   │   │   ├── assignments/   # Assignment management + submissions
│   │   │   ├── videos/        # Video management
│   │   │   ├── lecture-slides/# Slide management
│   │   │   ├── past-papers/   # Past paper management
│   │   │   ├── announcements/ # Announcement management
│   │   │   ├── users/         # User management
│   │   │   └── submissions/   # All submissions overview
│   │   └── student/           # Student dashboard
│   │       ├── courses/       # Browse and enroll in courses
│   │       ├── lessons/       # Watch lessons
│   │       ├── quizzes/       # Take quizzes
│   │       ├── tests/         # Take tests
│   │       ├── assignments/   # Submit assignments
│   │       ├── videos/        # Watch videos
│   │       ├── lecture-slides/# View slides
│   │       ├── past-papers/   # Browse past papers
│   │       ├── books/         # E-book library
│   │       ├── announcements/ # View announcements
│   │       ├── results/       # View grades and results
│   │       └── settings/      # User settings
│   ├── api/                   # REST API endpoints
│   │   ├── chat/              # AI chat (OpenRouter + Redis cache)
│   │   ├── courses/           # Course CRUD
│   │   ├── modules/           # Module CRUD
│   │   ├── lessons/           # Lesson CRUD
│   │   ├── quizzes/           # Quiz CRUD + submissions
│   │   ├── tests/             # Test CRUD + submissions
│   │   ├── assignments/       # Assignment CRUD + submissions
│   │   ├── videos/            # Video CRUD
│   │   ├── lecture-slides/    # Slide CRUD
│   │   ├── past-papers/       # Past paper CRUD
│   │   ├── books/             # E-book browsing and saving
│   │   ├── enrollments/       # Enrollment and progress
│   │   ├── users/             # User management + theme
│   │   ├── search/            # Search endpoint
│   │   └── webhooks/clerk/    # Clerk webhook for user sync
│   ├── sign-in/               # Public sign-in page
│   ├── unauthorized/          # Unauthorized access page
│   ├── layout.tsx             # Root layout with providers
│   └── page.tsx               # Landing page (auto-redirects logged-in users)
├── components/                # Reusable UI components
│   ├── DashboardLayout.tsx    # Shared dashboard layout with sidebar
│   ├── SimpleChat.tsx         # AI chat widget
│   ├── ThemeToggle.tsx        # Dark/Light/System theme switcher
│   ├── NotificationBell.tsx   # Announcement notifications
│   ├── HomePageClient.tsx     # Landing page with animations
│   └── ...                    # Forms, lists, and action components
├── lib/                       # Utility functions
│   ├── cache.ts               # Upstash Redis client
│   ├── prisma.ts              # Prisma client with connection pooling
│   └── ...
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets and PWA manifest
├── .env.example               # Environment variable template
├── next.config.ts             # Next.js config (PWA, security headers, images)
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript config
```

---

## 📚 API Documentation

### AI Chat
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Stream AI response (cached in Redis) |

### Courses
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/courses` | GET | List published courses | ✅ |
| `/api/courses` | POST | Create course | ADMIN |
| `/api/courses/[id]` | PUT | Update course | ADMIN |
| `/api/courses/[id]` | DELETE | Delete course | ADMIN |

### Modules & Lessons
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/module` | POST | Create module | ADMIN |
| `/api/lessons` | POST | Create lesson | ADMIN |
| `/api/lessons/[id]` | PUT/DELETE | Update/Delete lesson | ADMIN |

### Quizzes
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/quizzes` | GET/POST | List/Create quizzes | ✅ / ADMIN |
| `/api/quizzes/[id]` | PUT/DELETE | Update/Delete quiz | ADMIN |
| `/api/quizzes/[id]/submit` | POST | Submit quiz response | ✅ |
| `/api/quizzes/[id]/submissions` | GET | View submissions | ADMIN |
| `/api/quizzes/submissions/[id]/grade` | POST | Grade submission | ADMIN |

### Tests
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/tests` | GET/POST | List/Create tests | ✅ / ADMIN |
| `/api/tests/[id]` | PUT/DELETE | Update/Delete test | ADMIN |
| `/api/tests/[id]/submit` | POST | Submit test response | ✅ |
| `/api/tests/submissions/[id]/grade` | POST | Grade submission | ADMIN |

### Assignments
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/assignments` | GET/POST | List/Create assignments | ✅ / ADMIN |
| `/api/assignments/[id]` | PUT/DELETE | Update/Delete assignment | ADMIN |
| `/api/assignments/[id]/submit` | POST | Submit assignment | ✅ |
| `/api/assignments/submissions/[id]/grade` | POST | Grade submission | ADMIN |

### Videos & Slides
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/videos` | GET/POST | List/Upload videos | ✅ / ADMIN |
| `/api/videos/[id]` | DELETE | Delete video | ADMIN |
| `/api/lecture-slides` | GET/POST | List/Upload slides | ✅ / ADMIN |
| `/api/lecture-slides/[id]` | PUT/DELETE | Update/Delete slide | ADMIN |

### Past Papers
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/past-papers` | GET/POST | List/Upload papers | ✅ / ADMIN |
| `/api/past-papers/[id]` | DELETE | Delete paper | ADMIN |

### E-Books
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/books` | GET | Browse books | ✅ |
| `/api/books/search` | GET | Search books | ✅ |
| `/api/books/saved` | GET/POST | Get/Save books | ✅ |
| `/api/books/saved/[id]` | DELETE | Unsave book | ✅ |

### Users & Enrollment
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/users` | GET | List users | ADMIN |
| `/api/users/promote` | POST | Change user role | ADMIN |
| `/api/users/me/theme` | GET/PUT | Get/Set theme | ✅ |
| `/api/enrollments` | POST | Enroll in course | ✅ |
| `/api/enrollments/progress` | PUT | Update progress | ✅ |

### Search & Webhooks
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/search?q=query` | GET | Search content | ✅ |
| `/api/webhooks/clerk` | POST | Clerk user sync webhook | — |

---

## 🚢 Deployment

### Deploy to Render (Recommended)

The app uses a GitHub Actions workflow (`.github/workflows/deploy.yml`) to automatically deploy to Render on every push to `main`. The workflow builds the application first, and only triggers deployment to Render after the build succeeds, using the Render CLI.

**Setup:**

1. **Create a Render account** at [render.com](https://render.com)
2. **Create a Web Service** and connect your GitHub repository
3. **Configure the service:**
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node 22 (see `.node-version`)
4. **Add all environment variables** from `.env.example` in your Render service settings
5. **Add the Render API key and Service ID** as GitHub secrets:
   - `RENDER_API_KEY` — your Render account API key (found in Render Dashboard → Account → API Keys)
   - `RENDER_SERVICE_ID` — your Render service ID (found in the service URL: `https://dashboard.render.com/services/srv-xxxxx`)

**GitHub Secrets Required:**
- `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `OPENROUTER_API_KEY`, `BREVO_API_KEY`, `NEXT_PUBLIC_SITE_URL`
- `RENDER_API_KEY` (your Render API key)
- `RENDER_SERVICE_ID` (your Render service ID)

### Environment Variables

Add all variables from `.env.example` in your Render service settings. For production, use:
- **Clerk**: `pk_live_` / `sk_live_` keys (not test keys)
- **Database**: Production PostgreSQL URL
- **Redis**: Upstash production credentials

### Security

The app includes security headers configured in `next.config.ts`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## 🧑‍💻 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**:
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Coding Standards
- ✅ Use TypeScript for all files
- ✅ Follow Next.js App Router patterns
- ✅ Write clean, commented code
- ✅ Include proper error handling
- ✅ Test before submitting PR

---

## 🛠️ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **P1001: Can't reach database server** | Check `DATABASE_URL` and network connectivity |
| **Unique constraint failed on clerkId** | User already exists, run `npx prisma db push` |
| **CLERK_WEBHOOK_SECRET not set** | Add to `.env` |
| **Cloudinary upload failed** | Verify Cloudinary credentials |
| **SSL connection error** | Add `?sslmode=require` to `DATABASE_URL` |
| **Redis connection error** | Verify Upstash URL and token in `.env` |

### Quick Fixes

```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (development only)
npx prisma db push --force-reset

# Clear Next.js cache
rm -rf .next

# Restart development server
npm run dev
```

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

## 👤 Author

**Kafiswe George Chimputu**
- Email: [kafiswegchimputu@gmail.com](mailto:kafiswegchimputu@gmail.com)
- GitHub: [@chimputu](https://github.com/chimputu)

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
- [Lucide Icons](https://lucide.dev) — Icons
- [EmailJS](https://www.emailjs.com) — Email Notifications

---

## 📊 Project Status

| Feature | Status |
|---------|--------|
| Authentication (Clerk) | ✅ Complete |
| User Management & Roles | ✅ Complete |
| Courses, Modules, Lessons | ✅ Complete |
| Video Lessons (Cloudinary + YouTube) | ✅ Complete |
| Lecture Slides | ✅ Complete |
| Quizzes with Grading | ✅ Complete |
| Tests with Grading | ✅ Complete |
| Assignments with File Submission | ✅ Complete |
| Past Exam Papers | ✅ Complete |
| E-Book Library | ✅ Complete |
| Progress Tracking | ✅ Complete |
| Announcements & Notifications | ✅ Complete |
| AI Study Assistant (OpenRouter + Redis) | ✅ Complete |
| Dark/Light/System Theme | ✅ Complete |
| PWA (Offline Support) | ✅ Complete |
| Search | ✅ Complete |
| Responsive Design | ✅ Complete |
| Security Headers | ✅ Complete |

---

## 🎯 Future Roadmap

- [ ] Student certificates and achievements
- [ ] Analytics dashboard for admins
- [ ] Discussion forums
- [ ] Live tutoring sessions
- [ ] Mobile app (React Native)
- [ ] Payment integration for premium features

---

*Built with ❤️ by Kafiswe George Chimputu — Empowering Zambian lifelong learners.*
