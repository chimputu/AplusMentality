import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Building2, MapPin, Globe, BookOpen, GraduationCap, ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { getUniversityForExploration } from '@/lib/queries/exploration';

export const metadata = {
  title: 'University Overview | A+ Mentality',
  description: 'Explore programmes and courses at Zambian universities',
};

interface PageProps {
  params: { slug: string };
}

export default async function UniversityPage({ params }: PageProps) {
  const university = await getUniversityForExploration(params.slug);

  if (!university) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all universities
      </Link>

      {/* Hero */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8">
        <div className="flex items-start gap-6">
          {university.logoUrl ? (
            <img
              src={university.logoUrl}
              alt={university.name}
              className="w-20 h-20 rounded-2xl object-contain bg-gray-50 dark:bg-gray-700 p-2"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {university.shortName || university.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-3">{university.name}</p>
            {university.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">{university.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {university.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{university.city}{university.country ? `, ${university.country}` : ''}</span>
                </div>
              )}
              {university.website && (
                <a
                  href={university.website.startsWith('http') ? university.website : `https://${university.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {university.programmes.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Programmes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {university._count.courses}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Courses</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {university.faculties.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Faculties</p>
          </div>
        </div>
      </div>

      {/* Programmes */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Programmes
        </h2>

        {university.programmes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No programmes available yet.
          </p>
        ) : (
          <div className="space-y-3">
            {university.programmes.map((prog) => (
              <Link
                key={prog.id}
                href={`/explore/${university.slug}/programmes/${prog.code}`}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group"
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                    {prog.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {prog.code && <span className="font-mono">{prog.code}</span>}
                    {prog.faculty && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {prog.faculty.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>{prog._count.courses} courses</span>
                  <ChevronRight className="w-4 h-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Faculties */}
      {university.faculties.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Faculties
          </h2>
          <div className="flex flex-wrap gap-2">
            {university.faculties.map((fac) => (
              <span
                key={fac.id}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg"
              >
                {fac.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
