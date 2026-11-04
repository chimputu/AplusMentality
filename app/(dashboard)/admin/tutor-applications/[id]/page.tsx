export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import Image from 'next/image';
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
  Shield,
  Users,
  BookOpen,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { formatDateTime } from '@/lib/date-format';

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
      references: true,
      offerings: true,
    },
  });

  if (!application) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold text-foreground">
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
    <div className="p-4 md:p-8 max-w-5xl">
      <Link
        href="/admin/tutor-applications"
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to applications
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {application.fullName}
          </h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-1">
            Tutor Application
          </p>
        </div>
        {statusBadge(application.status)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            Personal Information
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Full Name</dt>
              <dd className="text-foreground font-medium">
                {application.fullName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </dt>
              <dd className="text-foreground font-medium">
                {application.email}
              </dd>
            </div>
            {application.phone && (
              <div>
                <dt className="text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </dt>
                <dd className="text-foreground font-medium">
                  {application.phone}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Identity Verification */}
        <div className="bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-500" />
            Identity Verification
          </h2>
          <dl className="space-y-4 text-sm">
            {/* Profile Photo */}
            {application.profilePhotoUrl && (
              <div>
                <dt className="text-muted-foreground mb-2">Profile Photo</dt>
                <dd>
                  <div className="flex items-center gap-4">
                    <Image
                      src={application.profilePhotoUrl}
                      alt="Profile"
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover border-2 border-border"
                    />
                    <div className="space-x-2">
                      <a
                        href={application.profilePhotoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Full Size
                      </a>
                      <a
                        href={application.profilePhotoUrl}
                        download
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </dd>
              </div>
            )}

            {/* NRC */}
            {(application.nrcFrontUrl || application.nrcBackUrl) && (
              <div>
                <dt className="text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> NRC Card
                  </span>
                </dt>
                <dd className="space-y-2">
                  {application.nrcNumber && (
                    <p className="text-xs text-gray-600 dark:text-muted-foreground">
                      NRC Number: <span className="font-medium text-foreground">{application.nrcNumber}</span>
                    </p>
                  )}
                  <div className="flex gap-4">
                    {application.nrcFrontUrl && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Front</p>
                        <a
                          href={application.nrcFrontUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-32 rounded overflow-hidden border border-border"
                        >
                          <Image
                            src={application.nrcFrontUrl}
                            alt="NRC Front"
                            width={128}
                            height={80}
                            className="w-full object-cover"
                          />
                        </a>
                        <div className="mt-1 space-x-2">
                          <a
                            href={application.nrcFrontUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View
                          </a>
                          <a
                            href={application.nrcFrontUrl}
                            download
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    )}
                    {application.nrcBackUrl && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Back</p>
                        <a
                          href={application.nrcBackUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-32 rounded overflow-hidden border border-border"
                        >
                          <Image
                            src={application.nrcBackUrl}
                            alt="NRC Back"
                            width={128}
                            height={80}
                            className="w-full object-cover"
                          />
                        </a>
                        <div className="mt-1 space-x-2">
                          <a
                            href={application.nrcBackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View
                          </a>
                          <a
                            href={application.nrcBackUrl}
                            download
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Professional Info */}
        <div className="bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-gray-500" />
            Professional Information
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Experience</dt>
              <dd className="text-foreground font-medium">
                {application.experienceYears} years
              </dd>
            </div>
            {application.institution && (
              <div>
                <dt className="text-muted-foreground">Institution</dt>
                <dd className="text-foreground font-medium">
                  {application.institution.shortName || application.institution.name}
                </dd>
              </div>
            )}
            {application.teachingModes && application.teachingModes.length > 0 && (
              <div>
                <dt className="text-muted-foreground">Teaching Modes</dt>
                <dd className="flex flex-wrap gap-1 mt-1">
                  {application.teachingModes.map((mode: string) => (
                    <span key={mode} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      {mode}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {application.physicalLocation && (
              <div>
                <dt className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Location
                </dt>
                <dd className="text-foreground font-medium">
                  {application.physicalLocation}
                </dd>
              </div>
            )}
            {application.hourlyRateZMW !== null && application.hourlyRateZMW !== undefined && (
              <div>
                <dt className="text-muted-foreground">Hourly Rate</dt>
                <dd className="text-foreground font-medium">
                  K{application.hourlyRateZMW.toLocaleString()} ZMW
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Qualifications */}
        {qualifications && qualifications.length > 0 && (
          <div className="bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-gray-500" />
              Qualifications
            </h2>
            <div className="space-y-3">
              {qualifications.map((q: any, i: number) => (
                <div key={i} className="border-l-2 border-blue-500 pl-3">
                  <p className="text-sm font-medium text-foreground">
                    {q.degree}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {q.institution} • {q.year}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grade 12 Results */}
        {application.grade12School && (
          <div className="bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-gray-500" />
              Grade 12 Results
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">School</dt>
                <dd className="text-foreground font-medium">{application.grade12School}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Year</dt>
                <dd className="text-foreground font-medium">{application.grade12Year}</dd>
              </div>
              {application.grade12Summary && (
                <div>
                  <dt className="text-muted-foreground">Summary</dt>
                  <dd className="text-foreground">{application.grade12Summary}</dd>
                </div>
              )}
              {application.grade12ResultsUrl && (
                <div className="pt-2">
                  <a
                    href={application.grade12ResultsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Results Document →
                  </a>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Current Academic Records */}
        {application.currentInstitution && (
          <div className="bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-gray-500" />
              Current Academic Records
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Institution</dt>
                <dd className="text-foreground font-medium">{application.currentInstitution}</dd>
              </div>
              {application.currentProgramme && (
                <div>
                  <dt className="text-muted-foreground">Programme</dt>
                  <dd className="text-foreground font-medium">{application.currentProgramme}</dd>
                </div>
              )}
              {application.currentYear && (
                <div>
                  <dt className="text-muted-foreground">Year</dt>
                  <dd className="text-foreground font-medium">Year {application.currentYear}</dd>
                </div>
              )}
              {application.academicSummary && (
                <div>
                  <dt className="text-muted-foreground">Summary</dt>
                  <dd className="text-foreground">{application.academicSummary}</dd>
                </div>
              )}
              {application.academicRecordsUrl && (
                <div className="pt-2">
                  <a
                    href={application.academicRecordsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Academic Records →
                  </a>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* CV */}
        {application.cvUrl && (
          <div className="bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
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

        {/* References */}
        {application.references.length > 0 && (
          <div className="bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              References ({application.references.length})
            </h2>
            <div className="space-y-4">
              {application.references.map((ref: any) => (
                <div key={ref.id} className="border-l-2 border-green-500 pl-3">
                  <p className="text-sm font-medium text-foreground">
                    {ref.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ref.relationship}
                    {ref.institution && ` • ${ref.institution}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ref.email}
                    {ref.phone && ` • ${ref.phone}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Offerings */}
        {application.offerings.length > 0 && (
          <div className="md:col-span-2 bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-500" />
              Course Offerings ({application.offerings.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {application.offerings.map((off: any) => (
                <div key={off.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {off.title}
                    </h3>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                      K{off.priceZMW}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {off.level} • {off.durationMinutes}min
                  </p>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground line-clamp-2">
                    {off.description}
                  </p>
                  {off.modes && off.modes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {off.modes.map((mode: string) => (
                        <span key={mode} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          {mode}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teaching Philosophy */}
        {application.teachingPhilosophy && (
          <div className="md:col-span-2 bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-500" />
              Teaching Philosophy
            </h2>
            <p className="text-sm text-gray-700 dark:text-foreground whitespace-pre-wrap">
              {application.teachingPhilosophy}
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="md:col-span-2 bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Timeline
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="text-foreground font-medium">
                {formatDateTime(application.submittedAt)}
              </dd>
            </div>
            {application.reviewedAt && (
              <div>
                <dt className="text-muted-foreground">Reviewed</dt>
                <dd className="text-foreground font-medium">
                  {formatDateTime(application.reviewedAt)}
                </dd>
              </div>
            )}
            {application.decidedAt && (
              <div>
                <dt className="text-muted-foreground">Decision Made</dt>
                <dd className="text-foreground font-medium">
                  {formatDateTime(application.decidedAt)}
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
