'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface MarkLessonCompleteButtonProps {
  courseId: string;
  lessonId: string;
  nextLessonId: string | null;
  isCompleted: boolean;
}

export default function MarkLessonCompleteButton({
  courseId,
  lessonId,
  nextLessonId,
  isCompleted,
}: MarkLessonCompleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

  const handleMarkComplete = async () => {
    if (completed) return;

    setLoading(true);
    try {
      const res = await fetch('/api/enrollments/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, lessonId }),
      });

      if (res.ok) {
        setCompleted(true);
        router.refresh();
        setTimeout(() => {
          if (nextLessonId) {
            router.push(`/student/lessons/${nextLessonId}`);
          } else {
            router.push(`/student/courses/${courseId}`);
          }
        }, 1500);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="text-green-600 font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> Lesson completed!
        </div>
        {nextLessonId ? (
          <button
            onClick={() => router.push(`/student/lessons/${nextLessonId}`)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Next Lesson <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => router.push(`/student/courses/${courseId}`)}
            className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition font-medium"
          >
            Back to Course
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleMarkComplete}
      disabled={loading}
      className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
    >
      {loading ? 'Updating...' : 'Mark as Complete'}
    </button>
  );
}