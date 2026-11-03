import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, MapPin, Globe, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Universities',
  description: 'Explore Zambian universities and academic institutions supported by A+ Mentality.',
};

export const dynamic = 'force-dynamic';

async function getUniversities() {
  try {
    const res = await fetch('http://localhost:3000/api/universities', {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const institutionTypeLabels = {
  UNIVERSITY: 'University',
  POLYTECHNIC: 'Polytechnic',
  COLLEGE: 'College',
};

export default async function UniversitiesPage() {
  const universities = await getUniversities();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <section className="px-4 py-16 sm:py-24 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
          Zambian Universities
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Access curated past papers, connect with expert tutors, and elevate your academic journey across Zambian institutions.
        </p>
      </section>

      {/* University list */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          {universities.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                No universities available yet
              </h3>
              <p className="mt-2 text-muted-foreground">
                We are currently onboarding institutions. Check back soon!
              </p>
              <Link
                href="/sign-up"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
              >
                Join the waitlist
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {universities.map((uni) => (
                <div
                  key={uni.id}
                  className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {uni.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {uni.shortName && (
                          <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                            {uni.shortName}
                          </span>
                        )}
                        {uni.type && (
                          <span className="text-xs">
                            {institutionTypeLabels[uni.type] ?? uni.type}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {uni.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {uni.city}
                            {uni.province && `, ${uni.province}`}
                          </span>
                        )}
                        {uni.website && (
                          <a
                            href={uni.website.startsWith('http') ? uni.website : `https://${uni.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-500 hover:underline"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 text-center">
        <div className="max-w-xl mx-auto rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 p-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Don&apos;t see your institution?
          </h3>
          <p className="mt-2 text-muted-foreground">
            We are actively expanding our network. Sign up to get notified when your university joins.
          </p>
          <Link
            href="/sign-up"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
          >
            Sign up now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
