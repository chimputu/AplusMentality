import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Eye, Lock, Mail, FileText, Database } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how A+ Mentality collects, uses, and protects your personal data.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/privacy-policy`,
  },
};

const sections = [
  {
    icon: <Eye className="w-5 h-5" />,
    title: 'Information We Collect',
    items: [
      'Personal information you provide when creating an account (name, email, phone number)',
      'Academic information including your institution, programme, year, and course selections',
      'Usage data such as pages visited, features used, and time spent on the platform',
      'Device and browser information for security and analytics purposes',
      'Tutor application documents including identity photos, qualifications, and references',
      'Communication records when you contact our support team',
    ],
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'How We Use Your Information',
    items: [
      'To provide, maintain, and improve our learning platform services',
      'To authenticate your identity and manage your account securely',
      'To personalize your experience with relevant courses and content',
      'To process tutor applications and verify tutor qualifications',
      'To send important notifications about your account, courses, and assessments',
      'To analyze usage patterns and improve platform performance',
      'To comply with legal obligations and enforce our terms of service',
    ],
  },
  {
    icon: <Database className="w-5 h-5" />,
    title: 'Data Storage & Security',
    items: [
      'Your data is stored on secure PostgreSQL databases with encryption at rest',
      'All data transmissions are encrypted using TLS 1.2 or higher',
      'Authentication is handled by Clerk, a SOC 2 compliant identity provider',
      'Error tracking is managed by Sentry with PII (personally identifiable information) filtering enabled',
      'Access to your data is restricted to authorized personnel only',
      'We conduct regular security audits and vulnerability assessments',
    ],
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Your Rights',
    items: [
      'Right to access a copy of your personal data we hold',
      'Right to correct inaccurate or incomplete personal data',
      'Right to request deletion of your account and associated data',
      'Right to export your data in a machine-readable format',
      'Right to withdraw consent for data processing at any time',
      'Right to lodge a complaint with a data protection authority',
    ],
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'Cookies & Tracking',
    items: [
      'Essential cookies for authentication and security (always active)',
      'Analytics cookies to understand platform usage (Vercel Analytics)',
      'Functional cookies to remember your preferences (theme, language)',
      'You can manage your cookie preferences at any time through our cookie consent modal',
      'We do not use third-party advertising or tracking cookies',
    ],
  },
  {
    icon: <Mail className="w-5 h-5" />,
    title: 'Contact Us',
    items: [
      'For privacy-related inquiries, contact us at privacy@aplusmentality.vercel.app',
      'Data protection requests will be processed within 30 days',
      'You can also reach us through the support section of the platform',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-6 transition"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8" />
            <h1 className="text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Last updated: October 19, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 mb-8">
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-6">
            At A+ Mentality, we take your privacy seriously. This policy explains how we collect,
            use, store, and protect your personal information when you use our learning management
            platform. By using our services, you agree to the practices described in this policy.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            We are committed to complying with applicable data protection laws including the Data
            Protection Act of Zambia and international best practices for data privacy.
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
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  {section.icon}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Data Retention */}
        <div className="mt-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-300 mb-3">
            Data Retention
          </h2>
          <p className="text-amber-700 dark:text-amber-400 text-sm leading-relaxed">
            We retain your personal data for as long as your account is active or as needed to
            provide our services. When you delete your account, we will remove your personal data
            within 30 days, except where we are required to retain certain information for legal
            purposes (e.g., transaction records, tutor application history).
          </p>
        </div>

        {/* Bottom links */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/terms-of-service"
            className="flex-1 text-center px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
          >
            View Terms of Service →
          </Link>
          <Link
            href="/"
            className="flex-1 text-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
