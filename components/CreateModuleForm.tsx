'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, BookOpen } from 'lucide-react';

interface CreateModuleFormProps {
  courseId: string;
  moduleId?: string;
  initialData?: {
    title: string;
    description: string | null;
    order: number;
  };
  isEditing?: boolean;
}

export default function CreateModuleForm({
  courseId,
  moduleId,
  initialData,
  isEditing = false,
}: CreateModuleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    order: initialData?.order || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/modules';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = isEditing
        ? { id: moduleId, ...formData }
        : { ...formData, courseId };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push(`/admin/courses/${courseId}`);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || `Failed to ${isEditing ? 'update' : 'create'} module`);
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
          Module Title *
        </label>
        <input
          type="text"
          placeholder="e.g., Introduction to Programming"
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
          placeholder="Module description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Module Order
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
          Modules are displayed in ascending order (0, 1, 2, ...)
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2 font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {isEditing ? 'Updating Module...' : 'Creating Module...'}
          </>
        ) : (
          <>
            <BookOpen className="w-5 h-5" />
            {isEditing ? 'Update Module' : 'Create Module'}
          </>
        )}
      </button>
    </form>
  );
}