'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, BookOpen, Video, Presentation, FileQuestion } from 'lucide-react';

interface CreateLessonFormProps {
  moduleId: string;
  lessonId?: string;
  initialData?: {
    title: string;
    description: string | null;
    order: number;
    videoId?: string | null;
    slidesId?: string | null;
    quizId?: string | null;
  };
  isEditing?: boolean;
}

export default function CreateLessonForm({
  moduleId,
  lessonId,
  initialData,
  isEditing = false,
}: CreateLessonFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    order: initialData?.order || 0,
    videoId: initialData?.videoId || '',
    slidesId: initialData?.slidesId || '',
    quizId: initialData?.quizId || '',
  });

  // ✅ Fetch available content
  const [videos, setVideos] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [videosRes, quizzesRes, slidesRes] = await Promise.all([
          fetch('/api/videos'),
          fetch('/api/quizzes'),
          fetch('/api/lecture-slides'),
        ]);
        const videosData = await videosRes.json();
        const quizzesData = await quizzesRes.json();
        const slidesData = await slidesRes.json();
        setVideos(videosData);
        setQuizzes(quizzesData);
        setSlides(slidesData);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setLoadingContent(false);
      }
    };
    fetchContent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/lessons';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = isEditing
        ? { id: lessonId, ...formData }
        : { ...formData, moduleId };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const path = window.location.pathname;
        const parts = path.split('/');
        const courseIdx = parts.indexOf('courses');
        const courseId = parts[courseIdx + 1];
        router.push(`/admin/courses/${courseId}`);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || `Failed to ${isEditing ? 'update' : 'create'} lesson`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Lesson Title *
        </label>
        <input
          type="text"
          placeholder="e.g., What is a Mole?"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          placeholder="Lesson description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* Order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Lesson Order
        </label>
        <input
          type="number"
          min="0"
          placeholder="0"
          value={formData.order}
          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Lessons are displayed in ascending order (0, 1, 2, ...)
        </p>
      </div>

      {/* Content Dropdowns */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Content</h3>

        {/* Video Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Video className="w-4 h-4 inline mr-1" />
            Video
          </label>
          <select
            value={formData.videoId}
            onChange={(e) => setFormData({ ...formData, videoId: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            disabled={loadingContent}
          >
            <option value="">None</option>
            {videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title} {v.description ? `– ${v.description}` : ''}
              </option>
            ))}
          </select>
          {loadingContent && <p className="text-xs text-gray-400 mt-1">Loading videos…</p>}
        </div>

        {/* Slides Dropdown */}
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Presentation className="w-4 h-4 inline mr-1" />
            Lecture Slides
          </label>
          <select
            value={formData.slidesId}
            onChange={(e) => setFormData({ ...formData, slidesId: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            disabled={loadingContent}
          >
            <option value="">None</option>
            {slides.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} {s.description ? `– ${s.description}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Quiz Dropdown */}
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <FileQuestion className="w-4 h-4 inline mr-1" />
            Quiz
          </label>
          <select
            value={formData.quizId}
            onChange={(e) => setFormData({ ...formData, quizId: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            disabled={loadingContent}
          >
            <option value="">None</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} {q.description ? `– ${q.description}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2 font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {isEditing ? 'Updating Lesson...' : 'Creating Lesson...'}
          </>
        ) : (
          <>
            <BookOpen className="w-5 h-5" />
            {isEditing ? 'Update Lesson' : 'Create Lesson'}
          </>
        )}
      </button>
    </form>
  );
}