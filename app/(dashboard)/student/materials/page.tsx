// app/(dashboard)/student/materials/page.tsx
import Link from 'next/link';
import { BookOpen, FileText, Presentation, Archive } from 'lucide-react';

const materialTypes = [
  {
    href: '/student/books',
    label: 'Books',
    description: 'Browse and save educational books from open libraries.',
    icon: BookOpen,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    href: '/student/lecture-slides',
    label: 'Lecture Slides',
    description: 'Access lecture slides from your courses.',
    icon: Presentation,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    href: '/student/past-papers',
    label: 'Past Papers',
    description: 'Practice with past examination papers.',
    icon: FileText,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    href: '/student/lessons',
    label: 'Lessons',
    description: 'View lesson content from your courses.',
    icon: Archive,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
];

export default function StudentMaterialsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Study Materials
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Browse books, slides, past papers, and lessons for your courses.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {materialTypes.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-start gap-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 ${item.bgColor} hover:ring-2 hover:ring-blue-500/50 transition-all`}
            >
              <Icon className={`w-6 h-6 mt-0.5 ${item.color}`} />
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  {item.label}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
