// app/(dashboard)/student/materials/page.tsx
import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { Presentation, PlayCircle, FileText, BookOpen, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';

const categories = [
  {
    slug: 'slides',
    label: 'Lecture Slides',
    description: 'Access lecture slides and presentations from your courses.',
    icon: Presentation,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  {
    slug: 'videos',
    label: 'Videos',
    description: 'Watch recorded lectures and tutorial videos.',
    icon: PlayCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  {
    slug: 'past-papers',
    label: 'Past Papers',
    description: 'Practice with past examination papers and solutions.',
    icon: FileText,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  {
    slug: 'tutorials',
    label: 'Tutorials',
    description: 'Download tutorial sheets and exercise materials.',
    icon: BookOpen,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
];

async function getMaterialCounts(): Promise<Record<string, number>> {
  try {
    const [slidesCount, videosCount, papersCount, tutorialsCount] = await Promise.all([
      prisma.lectureSlide.count({ where: { courseId: { not: null } } }),
      prisma.video.count({ where: { courseId: { not: null } } }),
      prisma.pastPaper.count({ where: { courseId: { not: null } } }),
      prisma.tutorialSheet.count(),
    ]);
    return {
      slides: slidesCount,
      videos: videosCount,
      'past-papers': papersCount,
      tutorials: tutorialsCount,
    };
  } catch {
    return {
      slides: 0,
      videos: 0,
      'past-papers': 0,
      tutorials: 0,
    };
  }
}

export default async function StudentMaterialsPage() {
  await requireAuth(['STUDENT']);

  const counts = await getMaterialCounts();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Study Materials
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Browse materials organized by type and course.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const count = counts[cat.slug] || 0;
          return (
            <Link
              key={cat.slug}
              href={`/student/materials/${cat.slug}`}
              className={`group flex items-start gap-4 p-5 rounded-xl border ${cat.borderColor} ${cat.bgColor} hover:ring-2 hover:ring-blue-500/50 transition-all`}
            >
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon className={`w-5 h-5 ${cat.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                    {cat.label}
                  </h2>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                  {cat.description}
                </p>
                <span className="inline-block mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {count} {count === 1 ? 'item' : 'items'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
