import Link from 'next/link';
import { Compass, MapPin, BookOpen, Building2, ArrowRight } from 'lucide-react';
import { listExplorableUniversities } from '@/lib/queries/exploration';

export const metadata = {
  title: 'Explore Universities',
  description: 'Browse other Zambian universities and preview their course materials on A+ Mentality.',
  openGraph: {
    title: 'Explore Universities — A+ Mentality',
    description: 'Browse other Zambian universities and preview their course materials.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/explore`,
    siteName: 'A+ Mentality',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Explore Universities — A+ Mentality',
    description: 'Browse Zambian universities and preview course materials.',
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/explore`,
  },
};

export default async function ExplorePage() {
  const universities = await listExplorableUniversities();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Compass className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Explore Other Universities
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          See how other Zambian institutions teach. Browse programmes and preview course materials.
        </p>
      </div>

      {/* University Grid */}
      {universities.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No other universities available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Other Zambian institutions will appear here once they join A+ Mentality.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universities.map((uni) => (
            <div
              key={uni.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Card header */}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  {uni.logoUrl ? (
                    <img
                      src={uni.logoUrl}
                      alt={uni.name}
                      className="w-14 h-14 rounded-xl object-contain bg-gray-50 dark:bg-gray-700 p-1"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {uni.shortName || uni.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {uni.name}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {uni.city}
                    {uni.city && uni.country ? ', ' : ''}
                    {uni.country}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{uni._count.programmes} programmes</span>
                  </div>
                </div>

                {/* Browse button */}
                <Link
                  href={`/explore/${uni.slug}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors group-hover:bg-indigo-700"
                >
                  Browse Courses
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
