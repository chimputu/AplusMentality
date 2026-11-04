# A+ Mentality

> A learning management system and tutor marketplace for Zambian higher education.

---

## About

**A+ Mentality** is a platform built for Zambian higher education institutions. It connects students, lecturers, tutors, and administrators in a unified system for course delivery, content sharing, assessments, and peer tutoring — accessible from any device, even offline.

The platform supports **multiple universities** with full data isolation, a **5-tier role system** with granular permissions, and a **tutor marketplace** where students can discover and book qualified tutors.

**Live Site:** [aplusmentality.com](https://aplusmentality.com)

---

## Table of Contents

- [User Roles](#user-roles)
- [Features](#features)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## User Roles

A+ Mentality supports five user roles, each with specific capabilities:

| Role | Description |
|------|-------------|
| **Super Admin** | Platform owner with global access to manage all institutions and users |
| **Admin** | University-level administrator who manages users, courses, and content within their institution |
| **Lecturer** | Faculty member who creates and manages courses, uploads content, and grades submissions |
| **Tutor** | Peer tutor who offers tutoring sessions and manages their profile and availability |
| **Student** | Learner who browses courses, watches videos, takes assessments, and books tutors |

---

## Features

### Learning Management

- **Courses & Programmes**: Browse courses organized by institution, programme, year, and semester
- **Video Lessons**: Watch uploaded or embedded video content
- **Lecture Slides**: View PDF and presentation materials
- **Past Exam Papers**: Browse and download past papers by course, year, and semester
- **Assignments**: Submit assignments and receive graded feedback
- **Quizzes & Tests**: Take timed assessments with score tracking
- **Progress Tracking**: Track lesson completion and course enrollment progress
- **Announcements**: Stay updated with institution-wide announcements
- **Zambian Grading System**: Built-in reference for university grading bands and degree classification

### Tutor Marketplace

- **Tutor Applications**: Apply to become a tutor
- **Tutor Profiles**: Browse tutors by specialty, rating, and availability
- **Tutor Requests**: Request tutoring sessions
- **Reviews & Ratings**: Rate tutors after sessions

### AI Study Assistant

- **AI Chat**: Get study help powered by AI
- **Context-Aware**: Platform questions on the landing page; institution-specific help when logged in

### User Experience

- **Authentication**: Social login support
- **Dark/Light Mode**: Persistent theme preference
- **PWA**: Installable on mobile devices with offline support
- **Responsive Design**: Mobile-first layout optimized for all screen sizes
- **Search**: Find courses, videos, and announcements quickly
- **Notifications**: Stay informed with announcement updates
- **E-Book Library**: Browse and read public-domain books

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| **Node.js** | 22.x |
| **npm** | 10.x+ |
| **PostgreSQL** | 16+ |
| **Git** | Latest |

### Installation

```bash
git clone https://github.com/chimputu/AplusMentality.git
cd AplusMentality
npm install
```

### Configuration

```bash
cp .env.example .env
```

Fill in the required environment variables in `.env`.

### Database Setup

```bash
npm run db:push
```

### Run Locally

```bash
npm run dev
```

The app starts at `http://localhost:3000`.

### Useful Commands

```bash
npm run build          # Production build
npm start              # Start production server
npm run test           # Run tests
npx prisma studio      # Database GUI
```

---

## Deployment

### Platform Requirements

- **Node.js 22** runtime
- **PostgreSQL** database
- All environment variables configured

### Deploy to Vercel or Render

1. Connect your repository to your hosting platform
2. Configure build command: `npm run build`
3. Configure start command: `npm start`
4. Add all environment variables from `.env.example`
5. Deploy

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Can't reach database** | Verify `DATABASE_URL` and network connectivity |
| **SSL connection error** | Add `?sslmode=require` to `DATABASE_URL` |
| **Build fails** | Run `npx prisma generate` and `npx prisma db push` |
| **Cache issues** | Run `rm -rf .next` and restart the dev server |

---

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

Built by [Kafiswe George Chimputu](https://github.com/chimputu).
