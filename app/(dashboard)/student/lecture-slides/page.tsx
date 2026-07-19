'use client';
import { useState, useEffect } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  code: string;
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

export default function StudentLectureSlidesPage() {
  const [slides, setSlides] = useState<LectureSlide[]>([]);
  const [filtered, setFiltered] = useState<LectureSlide[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lecture-slides')
      .then(res => res.json())
      .then((data: LectureSlide[]) => {
        setSlides(data);
        setFiltered(data);
        const cats = [...new Set(data.map((slide) => slide.category).filter(Boolean))] as string[];
        setCategories(cats);
        fetch('/api/courses?all=true')
          .then(res => res.json())
          .then((coursesData: Course[]) => setCourses(coursesData))
          .catch(() => setCourses([]));
      })
      .catch(() => setSlides([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = slides;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((slide) =>
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

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Lecture Slides</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search slides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
        {courses.length > 0 && (
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No lecture slides found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((slide) => (
            <div key={slide.id} className="border rounded-xl p-4 hover:shadow-md transition bg-white dark:bg-gray-800">
              <h3 className="font-semibold text-lg">{slide.title}</h3>
              {slide.description && <p className="text-sm text-gray-600 mt-1">{slide.description}</p>}
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                {slide.category && <span className="bg-gray-100 px-2 py-1 rounded">Category: {slide.category}</span>}
                {slide.course && <span className="bg-gray-100 px-2 py-1 rounded">Course: {slide.course.title}</span>}
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={slide.embedUrl || slide.fileUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <ExternalLink className="w-4 h-4" /> Open
                </a>
                <Link
                  href={`/student/lecture-slides/${slide.id}`}
                  className="inline-flex items-center gap-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
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