'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Loader2 } from 'lucide-react';

// ✅ Define the props interface
interface CreateCourseFormProps {
  initialData?: {
    code: string;
    title: string;
    description: string;
    category: string;
    level: string;
  };
  isEditing?: boolean;
  courseId?: string;
}

export default function CreateCourseForm({
  initialData,
  isEditing = false,
  courseId,
}: CreateCourseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    level: initialData?.level || 'Beginner',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/courses';
      const method = isEditing ? 'PUT' : 'POST';
      
      const payload = isEditing
        ? { id: courseId, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const course = await res.json();
        if (isEditing) {
          router.push(`/admin/courses/${courseId}`);
        } else {
          router.push(`/admin/courses/${course.id}`);
        }
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || `Failed to ${isEditing ? 'update' : 'create'} course`);
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
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Course Code *
        </label>
        <input
          type="text"
          placeholder="e.g., CS101"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          required
          disabled={isEditing}
          className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
            isEditing ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        />
        {isEditing && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Course code cannot be changed
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Course Title *
        </label>
        <input
          type="text"
          placeholder="e.g., Introduction to Computer Science"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          placeholder="Course description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Category
        </label>
        <input
          type="text"
          placeholder="e.g., Computer Science, Mathematics"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Level
        </label>
        <select
          value={formData.level}
          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Expert">Expert</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2 font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {isEditing ? 'Updating Course...' : 'Creating Course...'}
          </>
        ) : (
          <>
            <BookOpen className="w-5 h-5" />
            {isEditing ? 'Update Course' : 'Create Course'}
          </>
        )}
      </button>
    </form>
  );
}