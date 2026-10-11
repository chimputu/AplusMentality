import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
} from 'lucide-react';

const statusConfig: Record<string, { icon: any; color: string; label: string; description: string }> = {
  PENDING: {
    icon: Clock,
    color: 'text-yellow-500',
    label: 'Pending',
    description: 'Your application has been submitted and is waiting for review.',
  },
  UNDER_REVIEW: {
    icon: AlertCircle,
    color: 'text-blue-500',
    label: 'Under Review',
    description: 'An admin is currently reviewing your application.',
  },
  APPROVED: {
    icon: CheckCircle,
    color: 'text-green-500',
    label: 'Approved',
    description: 'Congratulations! Your application has been approved. You are now a verified tutor.',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-red-500',
    label: 'Rejected',
    description: 'Your application was not approved. You can re-apply after addressing the feedback.',
  },
  WITHDRAWN: {
    icon: XCircle,
    color: 'text-gray-500',
    label: 'Withdrawn',
    description: 'You withdrew your application. You can submit a new one anytime.',
  },
};

export default async function ApplicationStatusPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.user.findUnique({ where: { clerkId: userId! } });
  if (!user) redirect('/sign-in');
  const u = user!;

  const application = await prisma.tutorApplication.findUnique({
    where: { userId: u.id },
    include: {
      institution: { select: { id: true, name: true, shortName: true } },
    },
  });

  const config = application
    ? statusConfig[application.status] || statusConfig.PENDING
    : statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Link
        href="/apply-as-tutor"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to application
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Application Status
      </h1>

      {!application ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Application Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven&apos;t submitted a tutor application yet.
          </p>
          <Link
            href="/apply-as-tutor"
            className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Apply Now
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
            <Icon className={`w-16 h-16 ${config.color} mx-auto mb-4`} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {config.label}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{config.description}</p>
          </div>

          {/* Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Application Details
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Name</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {application.fullName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {application.email}
                </dd>
              </div>
              {application.institution && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Institution</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">
                    {application.institution.shortName || application.institution.name}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Experience</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {application.experienceYears} years
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Submitted</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {application.submittedAt.toLocaleDateString('en-GB')}
                </dd>
              </div>
              {application.reviewedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Reviewed</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">
                    {application.reviewedAt.toLocaleDateString('en-GB')}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Rejection reason */}
          {application.rejectionReason && application.status === 'REJECTED' && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-6">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                Feedback
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {application.rejectionReason}
              </p>
            </div>
          )}

          {/* Admin notes */}
          {application.adminNotes && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Admin Notes
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {application.adminNotes}
              </p>
            </div>
          )}

          {/* Re-apply button */}
          {(application.status === 'REJECTED' || application.status === 'WITHDRAWN') && (
            <div className="text-center">
              <Link
                href="/apply-as-tutor"
                className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Submit New Application
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
