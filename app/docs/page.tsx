import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  UserPlus,
  Settings,
  FileText,
  MessageCircle,
  GraduationCap,
  Shield,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Learn how to use A+ Mentality — guides for students, tutors, and administrators.',
};

// ---------------------------------------------------------------------------
// Sidebar navigation
// ---------------------------------------------------------------------------

const studentNav = [
  { label: 'Getting Started', id: 'student-start' },
  { label: 'Finding Courses', id: 'student-courses' },
  { label: 'Past Papers & Quizzes', id: 'student-papers' },
  { label: 'Booking a Tutor', id: 'student-tutor' },
];

const tutorNav = [
  { label: 'Setting Up Your Profile', id: 'tutor-profile' },
  { label: 'Managing Availability', id: 'tutor-availability' },
  { label: 'Receiving Payments', id: 'tutor-payments' },
];

const adminNav = [
  { label: 'Dashboard Overview', id: 'admin-dashboard' },
  { label: 'User Management', id: 'admin-users' },
  { label: 'Content Management', id: 'admin-content' },
  { label: 'Analytics & Reports', id: 'admin-analytics' },
];

function SectionIcon({ role }: { role: 'student' | 'tutor' | 'admin' }) {
  switch (role) {
    case 'student':
      return <GraduationCap className="w-5 h-5" />;
    case 'tutor':
      return <UserPlus className="w-5 h-5" />;
    case 'admin':
      return <Settings className="w-5 h-5" />;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <section className="border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Documentation
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Everything you need to know about using A+ Mentality. Navigate by
            role using the sidebar, or scroll through the full guide below.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14 flex flex-col lg:flex-row gap-10">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="sticky top-6 space-y-8 text-sm">
            {/* Students */}
            <div>
              <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-2">
                <SectionIcon role="student" />
                Students
              </div>
              <ul className="space-y-1 pl-7">
                {studentNav.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-muted-foreground hover:text-blue-500 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tutors */}
            <div>
              <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-2">
                <SectionIcon role="tutor" />
                Tutors
              </div>
              <ul className="space-y-1 pl-7">
                {tutorNav.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-muted-foreground hover:text-blue-500 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Admins */}
            <div>
              <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-2">
                <SectionIcon role="admin" />
                Admins
              </div>
              <ul className="space-y-1 pl-7">
                {adminNav.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-muted-foreground hover:text-blue-500 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-16">
          {/* ===================== STUDENTS ===================== */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <GraduationCap className="w-6 h-6 text-blue-500" />
              For Students
            </h2>

            <div id="student-start" className="prose-like space-y-4 mb-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Getting Started
              </h3>
              <p className="text-muted-foreground">
                Sign up at{' '}
                <Link href="/sign-up" className="text-blue-500 hover:underline">
                  /sign-up
                </Link>{' '}
                using your university email. Once registered, you&apos;ll land
                on the student dashboard where you can browse courses, access
                past papers, and discover tutors near you.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Complete your profile with your university and course.</li>
                <li>Select your institution to see relevant content.</li>
                <li>Explore the homepage for trending courses and resources.</li>
              </ul>
            </div>

            <div id="student-courses" className="prose-like space-y-4 mb-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Finding Courses
              </h3>
              <p className="text-muted-foreground">
                Use the search bar or browse by institution and department. Each
                course page includes lecture slides, video lessons, and
                associated quizzes. Filter by year level to find content matched
                to your programme.
              </p>
            </div>

            <div id="student-papers" className="prose-like space-y-4 mb-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Past Papers &amp; Quizzes
              </h3>
              <p className="text-muted-foreground">
                Access curated past exam papers from Zambian universities.
                Download PDFs, attempt interactive quizzes, and track your
                scores over time. Quizzes provide instant feedback so you can
                identify areas to improve.
              </p>
            </div>

            <div id="student-tutor" className="prose-like space-y-4 mb-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Booking a Tutor
              </h3>
              <p className="text-muted-foreground">
                Browse the tutor directory, read reviews, and book a session
                that fits your schedule. Payments are made securely via Mobile
                Money. After booking, you&apos;ll receive a confirmation and
                session details via email.
              </p>
            </div>
          </section>

          {/* ===================== TUTORS ===================== */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <UserPlus className="w-6 h-6 text-blue-500" />
              For Tutors
            </h2>

            <div id="tutor-profile" className="prose-like space-y-4 mb-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Setting Up Your Profile
              </h3>
              <p className="text-muted-foreground">
                After signing up, select the <strong>Tutor</strong> role and
                complete your profile. Add your qualifications, subjects you
                teach, hourly rate, and a short bio. A complete profile
                increases your visibility in student searches.
              </p>
            </div>

            <div id="tutor-availability" className="prose-like space-y-4 mb-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Managing Availability
              </h3>
              <p className="text-muted-foreground">
                Set your weekly availability from the tutor dashboard. Students
                can only book time slots you&apos;ve marked as open. You can
                pause, extend, or block out dates at any time.
              </p>
            </div>

            <div id="tutor-payments" className="prose-like space-y-4 mb-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Receiving Payments
              </h3>
              <p className="text-muted-foreground">
                Payments are processed via Mobile Money (MTN, Airtel, Zamtel).
                After each completed session, funds are transferred to your
                registered number. A small platform commission applies per
                booking. View your earnings in the analytics dashboard.
              </p>
            </div>
          </section>

          {/* ===================== ADMINS ===================== */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <Settings className="w-6 h-6 text-blue-500" />
              For Administrators
            </h2>

            <div id="admin-dashboard" className="prose-like space-y-4 mb-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dashboard Overview
              </h3>
              <p className="text-muted-foreground">
                The admin dashboard provides a high-level view of platform
                activity: active users, recent submissions, content uploads, and
                system health. Use the quick-action buttons to create courses,
                manage users, or view reports.
              </p>
            </div>

            <div id="admin-users" className="prose-like space-y-4 mb-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Management
              </h3>
              <p className="text-muted-foreground">
                Search, filter, and manage users across roles. Assign
                institution affiliations, promote users to tutor or admin roles,
                and suspend accounts when necessary. Bulk import is available
                via CSV upload.
              </p>
            </div>

            <div id="admin-content" className="prose-like space-y-4 mb-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Content Management
              </h3>
              <p className="text-muted-foreground">
                Create and organize courses, modules, lessons, past papers, and
                quizzes. Upload lecture slides and e-books, and assign them to
                specific programmes or year levels. All content can be published
                or kept as drafts.
              </p>
            </div>

            <div id="admin-analytics" className="prose-like space-y-4 mb-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Analytics &amp; Reports
              </h3>
              <p className="text-muted-foreground">
                Track engagement metrics, quiz completion rates, and tutor
                session data. Export reports as CSV for institutional review.
                Real-time charts help you understand platform usage trends.
              </p>
            </div>
          </section>

          {/* ===================== SUPPORT ===================== */}
          <section className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              Need More Help?
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              If you couldn&apos;t find what you&apos;re looking for, reach out
              to our support team.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
              >
                Contact Support
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
