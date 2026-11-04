export const dynamic = 'force-dynamic';

// app/(dashboard)/student/materials/[category]/[courseId]/page.tsx
import { requireAuth } from '@/lib/auth';
import { getMaterialsForCourse } from '@/lib/actions/materials';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  PlayCircle,
  ExternalLink,
  Download,
  Calendar,
  HardDrive,
} from 'lucide-react';

const VALID_CATEGORIES = ['slides', 'videos', 'past-papers', 'tutorials'];

const CATEGORY_LABELS: Record<string, string> = {
  slides: 'Lecture Slides',
  videos: 'Videos',
  'past-papers': 'Past Papers',
  tutorials: 'Tutorials',
};

function getFileIcon(material: any, category: string) {
  if (category === 'videos') {
    return <PlayCircle className="w-5 h-5 text-red-500" />;
  }

  const fileType = material.fileType || material.contentType || '';
  const url = material.fileUrl || material.url || material.embedUrl || '';

  if (fileType.includes('pdf') || url.endsWith('.pdf')) {
    return <FileText className="w-5 h-5 text-blue-500" />;
  }
  if (fileType.includes('video') || url.match(/\.(mp4|mov|avi|webm)$/i)) {
    return <PlayCircle className="w-5 h-5 text-red-500" />;
  }
  if (fileType.includes('presentation') || url.match(/\.(pptx?|key)$/i)) {
    return <FileText className="w-5 h-5 text-purple-500" />;
  }
  if (url.startsWith('http') && !url.match(/\.(pdf|mp4|mov|avi|pptx?|docx?|xlsx?)$/i)) {
    return <ExternalLink className="w-5 h-5 text-green-500" />;
  }

  return <FileText className="w-5 h-5 text-gray-500" />;
}

function getFileUrl(material: any, category: string) {
  if (category === 'videos') {
    return material.url || material.embedUrl || '#';
  }
  if (category === 'slides') {
    return material.fileUrl || material.embedUrl || '#';
  }
  if (category === 'past-papers') {
    return material.fileUrl || '#';
  }
  if (category === 'tutorials') {
    return material.url || '#';
  }
  return '#';
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default async function CourseMaterialPage({
  params,
}: {
  params: Promise<{ category: string; courseId: string }>;
}) {
  await requireAuth(['STUDENT']);

  const { category, courseId } = await params;

  // Validate category slug
  if (!VALID_CATEGORIES.includes(category)) {
    redirect('/student/materials');
  }

  const categoryLabel = CATEGORY_LABELS[category];

  // Fetch materials via server action (includes IDOR protection)
  let result: Awaited<ReturnType<typeof getMaterialsForCourse>> = null;
  try {
    result = await getMaterialsForCourse(category, courseId);
  } catch (err) {
    console.error(`[CourseMaterialPage] Failed to fetch materials for ${category}/${courseId}:`, err);
  }

  // If null, the course doesn't exist, isn't published, or belongs to another university (IDOR)
  if (!result) {
    redirect('/student/materials');
  }

  const { course, materials } = result;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href={`/student/materials/${category}`}
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {categoryLabel}
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
            {course.code}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {course.title}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          {materials.length} {materials.length === 1 ? 'file' : 'files'} available
        </p>
      </div>

      {materials.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            No materials uploaded for this course yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Check back later for {categoryLabel.toLowerCase()} for this course.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material: any) => {
            const fileUrl = getFileUrl(material, category);
            const title = material.title || 'Untitled';
            const description = material.description || '';
            const fileSize = material.fileSize || null;
            const createdAt = material.createdAt;
            const number = material.number; // For tutorial sheets

            return (
              <div
                key={material.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 shrink-0">
                    {getFileIcon(material, category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {title}
                      </h3>
                      {number !== undefined && number !== null && (
                        <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                          Tutorial {number}
                        </span>
                      )}
                      {material.isPreview && (
                        <span className="text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                          Preview
                        </span>
                      )}
                    </div>
                    {description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {createdAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(createdAt)}
                        </span>
                      )}
                      {fileSize && (
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3.5 h-3.5" />
                          {formatFileSize(fileSize)}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition min-h-[48px]"
                  >
                    {category === 'videos' ? (
                      <>
                        <PlayCircle className="w-4 h-4" />
                        Watch
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Open
                      </>
                    )}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
