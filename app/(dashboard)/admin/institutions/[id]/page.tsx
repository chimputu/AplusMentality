import { getInstitution } from '@/lib/actions/institution-crud';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Building2, MapPin, Globe, Mail, Phone, GraduationCap, Users, BookOpen } from 'lucide-react';

const TYPE_EMOJI: Record<string, string> = {
  UNIVERSITY: '🎓',
  COLLEGE: '🏛️',
  POLYTECHNIC: '🔬',
  INSTITUTE: '🏫',
  MEDICAL_SCHOOL: '⚕️',
  BUSINESS_SCHOOL: '💼',
  TECHNICAL_COLLEGE: '🔧',
  VOCATIONAL_SCHOOL: '🛠️',
};

export default async function InstitutionViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const institution = await getInstitution(id);

  if (!institution) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/institutions"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Institutions
        </Link>
        <Link
          href={`/admin/institutions/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </Link>
      </div>

      {/* Institution Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl">{TYPE_EMOJI[institution.type] || '🏫'}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {institution.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {institution.shortName} · {institution.slug}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {institution.type.replace(/_/g, ' ')}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  institution.isVerified
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {institution.isVerified ? 'Verified' : 'Unverified'}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  institution.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}
              >
                {institution.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {institution.description && (
          <p className="mt-4 text-gray-600 dark:text-gray-400">{institution.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          {institution.city && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {institution.city}{institution.province && `, ${institution.province}`}
              {institution.country && `, ${institution.country}`}
            </span>
          )}
          {institution.website && (
            <a
              href={institution.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Globe className="w-4 h-4" />
              {institution.website}
            </a>
          )}
          {institution.email && (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              {institution.email}
            </span>
          )}
          {institution.phone && (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-4 h-4" />
              {institution.phone}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span className="text-sm">Levels</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {institution.levels.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Building2 className="w-4 h-4" />
            <span className="text-sm">Faculties</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {institution.faculties.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm">Programmes</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {institution.programmes.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Users</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {institution._count.users}
          </p>
        </div>
      </div>

      {/* Academic Structure */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Academic Structure
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Levels ({institution.levelType})
            </h3>
            <div className="space-y-1">
              {institution.levels.map((level) => (
                <div
                  key={level.id}
                  className="text-sm text-gray-700 dark:text-gray-300 py-1"
                >
                  {level.name}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Periods ({institution.periodType})
            </h3>
            <div className="space-y-1">
              {institution.periods.map((period) => (
                <div
                  key={period.id}
                  className="text-sm text-gray-700 dark:text-gray-300 py-1"
                >
                  {period.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Faculties */}
      {institution.faculties.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Faculties
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {institution.faculties.map((faculty) => (
              <div
                key={faculty.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50"
              >
                <span className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                  {faculty.code}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {faculty.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Programmes */}
      {institution.programmes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Programmes
          </h2>
          <div className="space-y-2">
            {institution.programmes.map((prog) => (
              <div
                key={prog.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                    {prog.code}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {prog.name}
                  </span>
                  {prog.faculty && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({prog.faculty.name})
                    </span>
                  )}
                </div>
                {prog.branches.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {prog.branches.length} branch{prog.branches.length > 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
