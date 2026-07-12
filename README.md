# A+Mentality - Learning Management System

## 🚀 Overview

**A+Mentality** is a modern, role-based Learning Management System (LMS) built with Next.js 16, Clerk Authentication, and Prisma ORM. It empowers educators to share announcements, upload videos, and manage students efficiently.

**Technology Stack:** Next.js 16, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Clerk, Cloudinary

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
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Role-Based Access Control (RBAC)
- **Admin Dashboard**: Create announcements, upload videos, manage users
- **Student Dashboard**: View announcements, watch videos, track progress

### Core Functionality
- ✅ **Authentication**: Clerk-powered secure authentication with social login
- ✅ **Announcements**: Create, read, update, and delete announcements
- ✅ **Video Management**: Upload videos to Cloudinary or embed YouTube links
- ✅ **User Management**: Promote/demote users between STUDENT and ADMIN roles
- ✅ **Search**: Real-time search across announcements and videos
- ✅ **Responsive Design**: Mobile-first sidebar with collapsible navigation
- ✅ **YouTube Support**: Embed YouTube videos alongside uploaded content

### Technical Highlights
- ⚡ **Next.js 16 App Router** with Server Components
- 🔒 **TypeScript** for type safety
- 🎨 **Tailwind CSS** for styling
- 📊 **Prisma ORM** with PostgreSQL
- 🔐 **Clerk** for authentication and user management
- 📁 **Cloudinary** for video storage and streaming

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
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
│                    Database Layer                          │
│              (Prisma ORM + PostgreSQL)                     │
├─────────────────────────────────────────────────────────────┤
│                    Storage Layer                           │
│              (Cloudinary - Video Storage)                  │
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
- [Clerk](https://clerk.com) - Authentication
- [Cloudinary](https://cloudinary.com) - Video storage
- [Neon](https://neon.tech) or [Supabase](https://supabase.com) - Database hosting (optional)

---

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/a-mentality.git
cd a-mentality
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
```bash
cp .env.example .env.local
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# ============================================
# CLERK AUTHENTICATION
# ============================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# ============================================
# DATABASE
# ============================================
# Local Development (Docker)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/amentality?schema=public"

# Production (Neon)
# DATABASE_URL="postgresql://username:password@ep-xyz.neon.tech/amentality?sslmode=require"

# Production (Supabase)
# DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres?sslmode=require"

# ============================================
# CLOUDINARY - Video Storage
# ============================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Environment Variables Explained

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | ✅ Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | ✅ Yes |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret | ✅ Yes |
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ Yes |

---

## 🗄️ Database Setup

### Option 1: Local PostgreSQL (Docker) - Recommended for Development

```bash
# Pull and run PostgreSQL
docker run --name amentality-postgres \
  -e POSTGRES_USER=your_username \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=amentality \
  -p 5432:5432 \
  -v amentality-data:/var/lib/postgresql/data \
  -d postgres:17

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed the database (optional)
npx prisma db seed
```

### Option 2: Production Database (Neon/Supabase)

**Using Neon:**
1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Update `DATABASE_URL` in `.env.local`

**Using Supabase:**
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get connection string from Settings → Database
4. Update `DATABASE_URL` in `.env.local`

---

## 🚀 Running the Application

### Development Mode
```bash
# Start development server
npm run dev

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

---

## 📁 Project Structure

```
a-mentality/
├── app/
│   ├── (dashboard)/           # Protected dashboard routes
│   │   ├── admin/             # Admin dashboard
│   │   └── student/           # Student dashboard
│   ├── (auth)/                # Authentication routes
│   │   ├── sign-in/           # Sign-in page
│   │   └── sign-up/           # Sign-up page
│   ├── api/                   # REST API endpoints
│   │   ├── admin/             # Admin-only endpoints
│   │   ├── announcements/     # Announcement CRUD
│   │   ├── videos/            # Video CRUD
│   │   ├── users/             # User management
│   │   └── search/            # Search endpoint
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── components/                # Reusable UI components
├── lib/                       # Utility functions
│   ├── auth.ts                # Authentication helpers
│   ├── prisma.ts              # Database client
│   └── types.ts               # TypeScript types
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
├── .env.local                 # Environment variables
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies
├── proxy.ts                   # Clerk middleware
├── tailwind.config.js         # Tailwind CSS config
└── tsconfig.json              # TypeScript config
```

---

## 📚 API Documentation

### Authentication Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/clerk` | POST | Clerk webhook for user sync |

### Announcement Endpoints
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/announcements` | GET | List all announcements | ✅ |
| `/api/announcements` | POST | Create announcement | ADMIN |
| `/api/announcements/[id]` | DELETE | Delete announcement | ADMIN |

### Video Endpoints
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/videos` | GET | List all videos | ✅ |
| `/api/videos` | POST | Upload video | ADMIN |
| `/api/videos/[id]` | DELETE | Delete video | ADMIN |

### User Endpoints
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/users` | GET | List all users | ADMIN |
| `/api/admin/promote` | POST | Change user role | ADMIN |

### Search Endpoint
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/search?q=query` | GET | Search announcements and videos | ✅ |

---

## 🧪 Database Schema

```prisma
enum Role {
  ADMIN
  STUDENT
}

model User {
  id             String   @id @default(cuid())
  clerkId        String   @unique
  email          String   @unique
  name           String?
  role           Role     @default(STUDENT)
  announcements  Announcement[]
  videos         Video[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Announcement {
  id        String   @id @default(cuid())
  title     String
  content   String
  authorId  String
  author    User     @relation(fields: [authorId], references: [clerkId])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Video {
  id           String   @id @default(cuid())
  title        String
  description  String?
  cloudinaryId String?
  url          String
  source       String?  // 'cloudinary' or 'youtube'
  youtubeId    String?
  uploadedBy   String
  uploader     User     @relation(fields: [uploadedBy], references: [clerkId])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
# 1. Push code to GitHub
git push origin main

# 2. Import project in Vercel
# - Go to vercel.com
# - Click "Add New Project"
# - Select your repository
# - Add environment variables
# - Deploy

# 3. Environment Variables (Add in Vercel)
# - All variables from .env.local
```

### Deploy Database to Neon/Supabase

1. Create account on Neon or Supabase
2. Get connection string
3. Add `DATABASE_URL` to Vercel environment variables
4. Run migrations: `npx prisma migrate deploy`

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
| **CLERK_WEBHOOK_SECRET not set** | Add to `.env.local` |
| **Cloudinary upload failed** | Verify Cloudinary credentials |
| **SSL connection error** | Add `?sslmode=require` to `DATABASE_URL` |

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
- GitHub: [@kafiswe](https://github.com/kafiswe)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React Framework
- [Clerk](https://clerk.com) - Authentication
- [Prisma](https://prisma.io) - ORM
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Cloudinary](https://cloudinary.com) - Video Storage
- [Lucide Icons](https://lucide.dev) - Icons

---

## 📊 Project Status

| Feature | Status | Completion |
|---------|--------|------------|
| Authentication | ✅ Complete | 100% |
| User Management | ✅ Complete | 100% |
| Announcements | ✅ Complete | 100% |
| Video Upload (Cloudinary) | ✅ Complete | 100% |
| YouTube Integration | ✅ Complete | 100% |
| Search Functionality | ✅ Complete | 100% |
| Responsive Design | ✅ Complete | 100% |
| Documentation | ✅ Complete | 100% |

---

## 🎯 Future Roadmap

- [ ] Add quizzes and assessments
- [ ] Lecture slides integration
- [ ] Course progress tracking
- [ ] Notifications system
- [ ] Student certificates
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

---

## 🏆 Why This Project?

As a software engineer evaluating candidates, here's what I look for:

| Quality | How This Project Demonstrates It |
|---------|----------------------------------|
| **Full-Stack Proficiency** | Next.js + TypeScript + Prisma + PostgreSQL |
| **Security Awareness** | Clerk auth, role-based access, environment variables |
| **Code Quality** | Clean TypeScript, proper error handling, comments |
| **Modern Architecture** | App Router, Server Components, API routes |
| **User Experience** | Responsive design, search, loading states |
| **Best Practices** | Environment variables, modular code, type safety |
| **Problem Solving** | Handles complex features (video upload, YouTube embed) |

---

*Built with ❤️ by Kafiswe George Chimputu*
