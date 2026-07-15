import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Presentation, ExternalLink, Calendar } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default async function AdminLectureSlidesPage() {
  // ✅ NO AUTH - layout handles it

  const slidesData = await prisma.lectureSlide.findMany({
    include: {
      creator: {
        select: { name: true, email: true },
      },
      lessons: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const slides = slidesData.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lecture Slides"
        description="Manage all lecture slides (Google Slides)"
        action={{
          label: 'Create Slides',
          href: '/admin/lecture-slides/create',
        }}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {slides.length === 0 ? (
          <EmptyState
            icon={<Presentation className="w-10 h-10 text-gray-400 dark:text-gray-500" />}
            title="No lecture slides yet"
            description="Create your first lecture slides using Google Slides."
            action={{
              label: 'Create Slides',
              href: '/admin/lecture-slides/create',
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Lessons</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {slides.map((slide) => (
                  <tr key={slide.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">{slide.title}</p>
                        {slide.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{slide.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(slide.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {slide.lessons.length} lessons
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/lecture-slides/${slide.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        >
                          Edit
                        </Link>
                        <a
                          href={slide.embedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}