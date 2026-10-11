import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

const statusBadge = (status: string) => {
  const config: Record<string, { icon: any; color: string; label: string }> = {
    PENDING: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
    UNDER_REVIEW: { icon: AlertCircle, color: 'text-blue-500', label: 'Under Review' },
    APPROVED: { icon: CheckCircle, color: 'text-green-500', label: 'Approved' },
    REJECTED: { icon: XCircle, color: 'text-red-500', label: 'Rejected' },
    WITHDRAWN: { icon: XCircle, color: 'text-gray-500', label: 'Withdrawn' },
  };
  const c = config[status] || config.PENDING;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${c.color}`}>
      <Icon className="w-4 h-4" />
      {c.label}
    </span>
  );
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.user.findUnique({ where: { clerkId: userId! } });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized');
  }

  const { id } = await params;

  const application = await prisma.tutorApplication.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
          role: true,
          institutionId: true,
        },
      },
      institution: { select: { id: true, name: true, shortName: true } },
    },
  });

  if (!application) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Application not found
        </h1>
        <Link href="/admin/tutor-applications" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to list
        </Link>
      </div>
    );
  }

  const qualifications = application.qualifications as
    | Array<{ degree: string; institution: string; year: number }>
    | null
    | undefined;

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <Link
        href="/admin/tutor-applications"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to applications
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {application.fullName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tutor Application
          </p>
        </div>
        {statusBadge(application.status)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            Personal Information
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Full Name</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">
                {application.fullName}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">
                {application.email}
              </dd>
            </div>
            {application.phone && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {application.phone}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Professional Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-gray-500" />
            Professional Information
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Experience</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">
                {application.experienceYears} years
              </dd>
            </div>
            {application.institution && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Institution</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {application.institution.shortName || application.institution.name}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Qualifications */}
        {qualifications && qualifications.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-gray-500" />
              Qualifications
            </h2>
            <div className="space-y-3">
              {qualifications.map((q: any, i: number) => (
                <div key={i} className="border-l-2 border-blue-500 pl-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {q.degree}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {q.institution} • {q.year}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CV */}
        {application.cvUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              CV / Resume
            </h2>
            <a
              href={application.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View CV →
            </a>
          </div>
        )}

        {/* Teaching Philosophy */}
        {application.teachingPhilosophy && (
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-500" />
              Teaching Philosophy
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {application.teachingPhilosophy}
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Timeline
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Submitted</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">
                {application.submittedAt.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
            {application.reviewedAt && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Reviewed</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {application.reviewedAt.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
            )}
            {application.decidedAt && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Decision Made</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {application.decidedAt.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Admin Notes */}
        {application.adminNotes && (
          <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Admin Notes
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
              {application.adminNotes}
            </p>
          </div>
        )}

        {/* Rejection Reason */}
        {application.rejectionReason && (
          <div className="md:col-span-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              Rejection Reason
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
              {application.rejectionReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
