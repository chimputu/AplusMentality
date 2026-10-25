'use client';
import { useRouter } from 'next/navigation';
import { BookOpen, Users, Calendar, Trash2, Edit, Eye, GraduationCap, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  isPublished: boolean;
  createdAt: string;
  creator: {
    name: string | null;
  };
  _count?: {
    modules: number;
    enrollments: number;
  };
  modules?: any[];
  enrollments?: any[];
}

interface CourseListProps {
  courses: Course[];
  isAdmin?: boolean;
}

export default function CourseList({ courses, isAdmin = false }: CourseListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // ✅ Prevent navigation when clicking delete
    if (!confirm('Are you sure you want to delete this course? This will also delete all modules and lessons.')) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/courses?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete course');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // ✅ Prevent navigation when clicking edit
    router.push(`/admin/courses/${id}/edit`);
  };

  const handleViewCourse = (id: string) => {
    router.push(`/admin/courses/${id}`);
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-xl">
        <BookOpen className="w-16 h-16 text-foreground dark:text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground">No courses yet</h3>
        <p className="text-muted-foreground text-sm mt-1">
          {isAdmin ? 'Create your first course to get started!' : 'No courses available yet.'}
        </p>
        {isAdmin && (
          <Link
            href="/admin/courses/create"
            className="inline-block mt-4 bg-blue-600 text-foreground px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Course
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => {
        const totalLessons = course.modules?.reduce(
          (acc, module) => acc + (module.lessons?.length || 0),
          0
        ) || 0;

        return (
          <div
            key={course.id}
            onClick={() => handleViewCourse(course.id)} // ✅ Click on whole card to view course
            className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-all duration-200 group cursor-pointer hover:border-blue-300 dark:hover:border-blue-600"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded">
                    {course.code}
                  </span>
                  <h3 className="font-semibold text-foreground text-lg mt-2 line-clamp-1">
                    {course.title}
                  </h3>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleEdit(course.id, e)}
                      className="p-1.5 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground transition rounded-lg hover:bg-muted "
                      title="Edit Course"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(course.id, e)}
                      disabled={deleting === course.id}
                      className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              {course.description && (
                <p className="text-sm text-muted-foreground dark:text-foreground mt-2 line-clamp-2">
                  {course.description}
                </p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {course.category && (
                  <span className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                    {course.category}
                  </span>
                )}
                {course.level && (
                  <span className={`text-xs px-2.5 py-1 rounded-full ${
                    course.level === 'Beginner' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    course.level === 'Intermediate' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                    course.level === 'Advanced' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                    'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  }`}>
                    {course.level}
                  </span>
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full ${
                  course.isPublished
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {course._count?.modules || course.modules?.length || 0} modules
                </span>
                <span className="flex items-center gap-1">
                  <PlayCircle className="w-3.5 h-3.5" />
                  {totalLessons} lessons
                </span>
                {isAdmin && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {course._count?.enrollments || course.enrollments?.length || 0} students
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(course.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex items-center gap-2">
                  {!isAdmin && course.isPublished && (
                    <Link
                      href={`/student/courses/${course.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition flex items-center gap-1"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <GraduationCap className="w-4 h-4" />
                      View Course
                    </Link>
                  )}
                  {isAdmin && (
                    <span className="text-xs text-muted-foreground">
                      by {course.creator?.name || 'Unknown'}
                    </span>
                  )}
                  {/* ✅ Clickable "View" link that works */}
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition flex items-center gap-1"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}