import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, ExternalLink, Pencil, Trash2, Eye } from 'lucide-react';

export default async function AdminLectureSlidesPage() {
  await requireAuth(['ADMIN']);
  const slides = await prisma.lectureSlide.findMany({
    include: {
      creator: { select: { name: true } },
      course: { select: { id: true, title: true, code: true } },
    },
    orderBy: { order: 'asc' },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lecture Slides</h1>
        <Link
          href="/admin/lecture-slides/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Slide
        </Link>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {slides.map((slide) => (
              <tr key={slide.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">{slide.title}</td>
                <td className="px-6 py-4">{slide.course?.title || '—'}</td>
                <td className="px-6 py-4">{slide.category || '—'}</td>
                <td className="px-6 py-4">{slide.contentType || 'google_slides'}</td>
                <td className="px-6 py-4">{slide.order}</td>
                <td className="px-6 py-4 flex gap-3 flex-wrap">
                  <Link
                    href={`/admin/lecture-slides/${slide.id}`}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" /> View
                  </Link>
                  <Link
                    href={`/admin/lecture-slides/${slide.id}/edit`}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </Link>
                  <a
                    href={slide.embedUrl || slide.fileUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" /> Open
                  </a>
                  <button
                    className="text-red-600 hover:underline flex items-center gap-1"
                    onClick={async () => {
                      if (confirm('Delete this slide?')) {
                        await fetch(`/api/lecture-slides/${slide.id}`, { method: 'DELETE' });
                        window.location.reload();
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}