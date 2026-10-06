import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

export default async function AdminTutorsPage() {
  const tutors = await prisma.tutor.findMany({
    include: {
      university: true,
      programme: true,
      specialties: {
        include: { course: true },
      },
      _count: { select: { requests: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tutors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage tutor profiles and specialties</p>
        </div>
        <Link
          href="/admin/tutors/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Tutor
        </Link>
      </div>

      {tutors.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No tutors yet. Add your first tutor to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tutors.map((tutor: any) => (
            <div
              key={tutor.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                  {tutor.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{tutor.fullName}</h3>
                    {tutor.isVerified && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{tutor.email}</p>
                  {tutor.university && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {tutor.university.name} ({tutor.university.code})
                    </p>
                  )}
                  {tutor.programme && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {tutor.programme.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {tutor.specialties.slice(0, 3).map((s: any) => (
                  <span
                    key={s.id}
                    className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                  >
                    {s.course.code}
                  </span>
                ))}
                {tutor.specialties.length > 3 && (
                  <span className="text-xs text-gray-400">+{tutor.specialties.length - 3} more</span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 text-xs ${tutor.isActive ? 'text-green-600' : 'text-red-500'}`}>
                  {tutor.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {tutor.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-400">
                  {tutor.yearsExperience}yr exp
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/admin/tutors/${tutor.id}`}
                  className="flex-1 text-center text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  View
                </Link>
                <Link
                  href={`/admin/tutors/${tutor.id}/edit`}
                  className="flex-1 text-center text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
