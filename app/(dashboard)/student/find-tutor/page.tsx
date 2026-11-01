import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import DashboardLayout from '@/components/DashboardLayout';
import { getTutors } from '@/lib/actions/tutor-directory';
import TutorCard from '@/components/TutorCard';
import { Search, Users, Globe, School } from 'lucide-react';

export const metadata = {
  title: 'Find a Tutor | A+ Mentality',
  description: 'Browse and find tutors for your courses',
};

export default async function FindTutorPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; search?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const params = await searchParams;
  const { scope = 'my-university', search } = params;

  // Get user's institution
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { institutionId: true, role: true },
  });

  const filters: { institutionId?: string | null; search?: string } = {};
  if (scope === 'all') {
    filters.institutionId = null;
  } else if (user?.institutionId) {
    filters.institutionId = user.institutionId;
  }
  if (search) {
    filters.search = search;
  }

  const result = await getTutors(filters);
  const tutors = 'tutors' in result ? (result.tutors ?? []) : [];

  return (
    <DashboardLayout role={user?.role || 'STUDENT'}>
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Find a Tutor
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse verified tutors for your courses. Filter by your university or view all
            available tutors.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Scope toggle */}
          <div className="flex gap-2">
            <a
              href={`/student/find-tutor?scope=my-university${search ? `&search=${encodeURIComponent(search)}` : ''}`}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                scope !== 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              <School className="w-4 h-4" />
              My University
            </a>
            <a
              href={`/student/find-tutor?scope=all${search ? `&search=${encodeURIComponent(search)}` : ''}`}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                scope === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              <Globe className="w-4 h-4" />
              All Universities
            </a>
          </div>

          {/* Search */}
          <form className="flex-1">
            <input
              type="hidden"
              name="scope"
              value={scope}
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                name="search"
                defaultValue={search || ''}
                placeholder="Search tutors or courses..."
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:border-blue-500 text-sm text-foreground"
              />
            </div>
          </form>
        </div>

        {/* Tutor Grid */}
        {tutors.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No tutors found</h3>
            <p className="text-muted-foreground">
              {scope === 'all'
                ? 'There are no verified tutors yet.'
                : 'No tutors are available at your university yet. Try "All Universities" or check back later.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
