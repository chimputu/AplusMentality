export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import TutorAvatar from '@/components/tutor-avatar';

export default async function AdminTutorsPage() {
  let tutors: any[] = [];
  try {
    tutors = await prisma.tutor.findMany({
      include: {
        institution: true,
        programme: true,
        specialties: {
          include: { course: true },
        },
        _count: { select: { requests: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('[AdminTutors] Failed to fetch tutors:', err);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tutors</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tutor profiles and specialties</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/export/tutors"
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Export Tutors
          </a>
          <Link
            href="/admin/tutors/new"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Tutor
          </Link>
        </div>
      </div>

      {tutors.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">No tutors yet. Add your first tutor to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tutors.map((tutor: any) => (
            <div
              key={tutor.id}
              className="bg-card rounded-xl border border-border p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <TutorAvatar
                  tutor={{ fullName: tutor.fullName, avatarUrl: tutor.avatarUrl }}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{tutor.fullName}</h3>
                    {tutor.isVerified && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{tutor.email}</p>
                  {tutor.institution && (
                    <p className="text-xs text-gray-400 dark:text-muted-foreground mt-1">
                      {tutor.institution.name} ({tutor.institution.code})
                    </p>
                  )}
                  {tutor.programme && (
                    <p className="text-xs text-gray-400 dark:text-muted-foreground mt-1">
                      {tutor.programme.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {tutor.specialties.slice(0, 3).map((s: any) => (
                  <span
                    key={s.id}
                    className="inline-block px-2 py-0.5 text-xs bg-muted text-gray-600 dark:text-foreground rounded"
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
                  className="flex-1 text-center text-xs bg-muted text-gray-700 dark:text-foreground px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-muted transition"
                >
                  View
                </Link>
                <Link
                  href={`/admin/tutors/${tutor.id}`}
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
