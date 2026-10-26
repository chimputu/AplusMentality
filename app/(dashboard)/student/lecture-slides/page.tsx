// app/(dashboard)/student/lecture-slides/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ExternalLink, FileText } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  code: string;
  university: { id: string; name: string; code: string } | null;
}

interface Creator {
  name: string;
}

interface LectureSlide {
  id: string;
  title: string;
  description: string | null;
  embedUrl: string | null;
  fileUrl: string | null;
  contentType: string | null;
  order: number;
  category: string | null;
  courseId: string | null;
  course: Course | null;
  creator: Creator | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Wraps a PDF URL with Google Docs Viewer for reliable inline display.
 * Works across all browsers — Windows, Mac, Android, iOS.
 */
function getGoogleDocsViewerUrl(fileUrl: string): string {
  const encoded = encodeURIComponent(fileUrl);
  return `https://docs.google.com/viewer?url=${encoded}&embedded=true`;
}

/**
 * Compute the "Open in new tab" URL for a slide:
 * - If it's a Google Slides embed → use embedUrl
 * - If it's a PDF file → wrap in Google Docs Viewer
 * - Otherwise → use the raw URL
 */
function getSlideOpenUrl(slide: LectureSlide): string {
  if (slide.embedUrl) return slide.embedUrl;
  if (!slide.fileUrl) return '#';

  const isPdf =
    slide.contentType === 'pdf' ||
    slide.fileUrl.toLowerCase().endsWith('.pdf');

  return isPdf ? getGoogleDocsViewerUrl(slide.fileUrl) : slide.fileUrl;
}

export default function StudentLectureSlidesPage() {
  const searchParams = useSearchParams();
  const universityFilter = searchParams.get('university') || '';
  const [slides, setSlides] = useState<LectureSlide[]>([]);
  const [filtered, setFiltered] = useState<LectureSlide[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams();
    if (universityFilter) params.set('university', universityFilter);
    fetch(`/api/lecture-slides${params.toString() ? '?' + params.toString() : ''}`)
      .then(async (res) => {
        if (!res.ok) {
          console.error('Failed to fetch lecture slides:', res.status);
          return [];
        }
        const data = await res.json();
        if (Array.isArray(data)) return data;
        console.error('Unexpected slides API response:', data);
        return [];
      })
      .then((data: LectureSlide[]) => {
        setSlides(data);
        setFiltered(data);
        const cats = [
          ...new Set(data.map((slide) => slide.category).filter(Boolean)),
        ] as string[];
        setCategories(cats);
        const courseParams = new URLSearchParams();
        courseParams.set('all', 'true');
        if (universityFilter) courseParams.set('university', universityFilter);
        fetch(`/api/courses?${courseParams.toString()}`)
          .then((res) => res.json())
          .then((coursesData: Course[]) => setCourses(coursesData))
          .catch(() => setCourses([]));
      })
      .catch(() => setSlides([]))
      .finally(() => setLoading(false));
  }, [universityFilter]);

  useEffect(() => {
    let result = slides;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (slide) =>
          slide.title.toLowerCase().includes(q) ||
          (slide.description && slide.description.toLowerCase().includes(q))
      );
    }
    if (categoryFilter) {
      result = result.filter((slide) => slide.category === categoryFilter);
    }
    if (courseFilter) {
      result = result.filter((slide) => slide.courseId === courseFilter);
    }
    setFiltered(result);
  }, [search, categoryFilter, courseFilter, slides]);

  if (loading) return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading lecture slides...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Lecture Slides</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search slides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
        {courses.length > 0 && (
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {slides.length === 0 ? 'No lecture slides for your current period' : 'No slides match your filters'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {slides.length === 0
              ? 'No slides have been uploaded for your year and semester yet. Check back later.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((slide) => (
            <div
              key={slide.id}
              className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition bg-white dark:bg-gray-800"
            >
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{slide.title}</h3>
              {slide.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {slide.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                {slide.category && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                    Category: {slide.category}
                  </span>
                )}
                {slide.course && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                    Course: {slide.course.title}
                  </span>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={getSlideOpenUrl(slide)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <ExternalLink className="w-4 h-4" /> Open
                </a>
                <Link
                  href={`/student/lecture-slides/${slide.id}`}
                  className="inline-flex items-center gap-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}