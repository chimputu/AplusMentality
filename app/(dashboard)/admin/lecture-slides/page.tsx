// app/(dashboard)/admin/lecture-slides/page.tsx
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, ExternalLink, Pencil, Eye, FileText } from 'lucide-react';
import DeleteSlideButton from './DeleteSlideButton';

/**
 * Wraps a PDF URL with Google Docs Viewer for reliable inline display.
 * Works across all browsers — Windows, Mac, Android, iOS.
 */
function getGoogleDocsViewerUrl(fileUrl: string): string {
  const encoded = encodeURIComponent(fileUrl);
  return `https://docs.google.com/viewer?url=${encoded}&embedded=true`;
}

/**
 * Compute the "Open" URL for a slide:
 * - Google Slides embed → use embedUrl
 * - PDF → wrap in Google Docs Viewer
 * - Other → use raw URL
 */
function getSlideOpenUrl(slide: {
  embedUrl: string | null;
  fileUrl: string | null;
  contentType: string | null;
}): string {
  if (slide.embedUrl) return slide.embedUrl;
  if (!slide.fileUrl) return '#';

  const isPdf =
    slide.contentType === 'pdf' ||
    slide.fileUrl.toLowerCase().endsWith('.pdf');

  return isPdf ? getGoogleDocsViewerUrl(slide.fileUrl) : slide.fileUrl;
}

export default async function AdminLectureSlidesPage() {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  let slides: any[] = [];
  try {
    slides = await prisma.lectureSlide.findMany({
      include: {
        creator: { select: { name: true } },
        course: { select: { id: true, title: true, code: true } },
      },
      orderBy: { order: 'asc' },
    });
  } catch (err) {
    console.error('[AdminLectureSlides] Failed to fetch slides:', err);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lecture Slides</h1>
          <p className="text-gray-600 dark:text-muted-foreground text-sm">
            Manage all lecture slides and presentations
          </p>
        </div>
        <Link
          href="/admin/lecture-slides/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Slide
        </Link>
      </div>

      {slides.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 dark:text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-foreground">
            No lecture slides yet
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Create your first lecture slide to get started.
          </p>
          <Link
            href="/admin/lecture-slides/create"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Slide
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {slides.map((slide) => (
                  <tr
                    key={slide.id}
                    className="hover:bg-muted transition"
                  >
                    <td className="px-6 py-4">{slide.title}</td>
                    <td className="px-6 py-4">{slide.course?.title || '—'}</td>
                    <td className="px-6 py-4">{slide.category || '—'}</td>
                    <td className="px-6 py-4">
                      {slide.contentType || 'google_slides'}
                    </td>
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
                        href={getSlideOpenUrl(slide)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" /> Open
                      </a>
                      <DeleteSlideButton slideId={slide.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}