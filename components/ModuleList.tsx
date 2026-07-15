'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, 
  Edit, 
  Trash2, 
  Plus, 
  GripVertical,
  Video,
  Presentation,
  FileQuestion,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  video: any | null;
  slides: any | null;
  quiz: any | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

interface ModuleListProps {
  modules: Module[];
  courseId: string;
  isAdmin?: boolean;
}

export default function ModuleList({ modules, courseId, isAdmin = true }: ModuleListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map(m => m.id))
  );

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleDelete = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module and all its lessons?')) return;

    setDeleting(moduleId);
    try {
      const res = await fetch(`/api/modules?id=${moduleId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete module');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred');
    } finally {
      setDeleting(null);
    }
  };

  if (modules.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">No modules yet</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {isAdmin ? 'Add your first module to this course.' : 'No modules available for this course.'}
        </p>
        {isAdmin && (
          <Link
            href={`/admin/courses/${courseId}/modules/create`}
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Module
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {modules.map((module) => {
        const isExpanded = expandedModules.has(module.id);
        const totalLessons = module.lessons.length;

        return (
          <div
            key={module.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition"
          >
            {/* Module Header */}
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition flex items-center justify-between"
              onClick={() => toggleModule(module.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <button className="text-gray-400 dark:text-gray-500">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                    Module {module.order + 1}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    {totalLessons} {totalLessons === 1 ? 'lesson' : 'lessons'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  {module.title}
                </h3>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/admin/courses/${courseId}/modules/${module.id}/edit`}
                    className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                    title="Edit Module"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(module.id)}
                    disabled={deleting === module.id}
                    className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50"
                    title="Delete Module"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Module Description */}
            {module.description && (
              <div className="px-4 pb-2 text-sm text-gray-500 dark:text-gray-400">
                {module.description}
              </div>
            )}

            {/* Lessons List */}
            {isExpanded && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                {module.lessons.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400 dark:text-gray-500">
                    No lessons yet
                    {isAdmin && (
                      <Link
                        href={`/admin/courses/${courseId}/modules/${module.id}/lessons/create`}
                        className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Add Lesson →
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {lesson.order + 1}.
                          </span>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                            {lesson.title}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {lesson.video && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                Video
                              </span>
                            )}
                            {lesson.slides && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded flex items-center gap-1">
                                <Presentation className="w-3 h-3" />
                                Slides
                              </span>
                            )}
                            {lesson.quiz && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded flex items-center gap-1">
                                <FileQuestion className="w-3 h-3" />
                                Quiz
                              </span>
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <Link
                            href={`/admin/lessons/${lesson.id}/edit`}
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Lesson Button */}
                {isAdmin && (
                  <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                    <Link
                      href={`/admin/courses/${courseId}/modules/${module.id}/lessons/create`}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Add Lesson
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add Module Button (Admin) */}
      {isAdmin && (
        <div className="text-center pt-2">
          <Link
            href={`/admin/courses/${courseId}/modules/create`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </Link>
        </div>
      )}
    </div>
  );
}