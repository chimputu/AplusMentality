import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, UserCheck, AlertTriangle, CreditCard, MessageSquare, Gavel } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the terms and conditions for using the A+ Mentality learning platform.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/terms-of-service`,
  },
};

const sections = [
  {
    icon: <Scale className="w-5 h-5" />,
    title: 'Acceptance of Terms',
    items: [
      'By accessing or using the A+ Mentality platform, you agree to be bound by these Terms of Service.',
      'If you do not agree to these terms, please do not use our platform.',
      'We may update these terms from time to time. Continued use after changes constitutes acceptance of the new terms.',
      'These terms apply to all users, including students, tutors, and administrators.',
    ],
  },
  {
    icon: <UserCheck className="w-5 h-5" />,
    title: 'Account Responsibilities',
    items: [
      'You must be at least 16 years old to create an account on our platform.',
      'You are responsible for maintaining the confidentiality of your account credentials.',
      'You must provide accurate and current information when registering.',
      'You must notify us immediately of any unauthorized use of your account.',
      'You may not create multiple accounts for the purpose of circumventing platform restrictions.',
      'We reserve the right to suspend or terminate accounts that violate these terms.',
    ],
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Acceptable Use',
    items: [
      'You may use the platform for educational purposes only.',
      'You must not upload, share, or distribute illegal, harmful, or inappropriate content.',
      'You must not attempt to hack, scrape, or exploit the platform in any way.',
      'You must not impersonate other users or misrepresent your identity.',
      'You must not use automated tools to access the platform without prior written consent.',
      'Academic integrity must be maintained — no cheating, plagiarism, or unauthorized collaboration.',
    ],
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Tutor Services',
    items: [
      'Tutors must apply and be approved before offering tutoring services.',
      'Tutors are responsible for the accuracy of their qualifications and teaching materials.',
      'Tutor fees are set by the individual tutor and are subject to their own terms.',
      'A+ Mentality acts as a platform and does not guarantee the quality of individual tutoring sessions.',
      'Disputes between students and tutors should be reported to our support team for mediation.',
      'Tutors must maintain professional conduct and respect student privacy.',
    ],
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Intellectual Property',
    items: [
      'All platform content, including course materials, quizzes, and past papers, is protected by copyright.',
      'Users retain ownership of content they upload but grant A+ Mentality a license to display and distribute it within the platform.',
      'You may not reproduce, distribute, or sell content from the platform without permission.',
      'Institutional content (e.g., university past papers) is shared with the permission of the respective institutions.',
      'We respect the intellectual property rights of others and will respond to valid DMCA takedown notices.',
    ],
  },
  {
    icon: <Gavel className="w-5 h-5" />,
    title: 'Limitation of Liability',
    items: [
      'A+ Mentality is provided "as is" without warranties of any kind, express or implied.',
      'We do not guarantee uninterrupted or error-free service.',
      'We are not liable for any indirect, incidental, or consequential damages arising from use of the platform.',
      'We are not responsible for the actions or content of individual users.',
      'Our total liability shall not exceed the amount paid by you in the preceding 12 months.',
      'These limitations apply to the fullest extent permitted by applicable law.',
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-indigo-100 hover:text-white mb-6 transition"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-8 h-8" />
            <h1 className="text-3xl sm:text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-indigo-100 text-lg">
            Last updated: October 19, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 mb-8">
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-6">
            Welcome to A+ Mentality. These Terms of Service govern your use of our learning
            management platform, including all features, services, and content provided through
            the website or mobile application.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            Please read these terms carefully before using our platform. By creating an account or
            accessing any part of the service, you confirm that you have read, understood, and
            agree to be bound by these terms.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  {section.icon}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Governing Law */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-300 mb-3">
            Governing Law & Dispute Resolution
          </h2>
          <p className="text-blue-700 dark:text-blue-400 text-sm leading-relaxed mb-3">
            These terms are governed by the laws of the Republic of Zambia. Any disputes arising
            from these terms or your use of the platform shall first be subject to good-faith
            negotiation. If negotiation fails, disputes shall be resolved through arbitration in
            Lusaka, Zambia.
          </p>
          <p className="text-blue-700 dark:text-blue-400 text-sm leading-relaxed">
            For questions about these terms, contact us at legal@aplusmentality.vercel.app.
          </p>
        </div>

        {/* Bottom links */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/privacy-policy"
            className="flex-1 text-center px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
          >
            View Privacy Policy →
          </Link>
          <Link
            href="/"
            className="flex-1 text-center px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
