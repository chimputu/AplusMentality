import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  CalendarDays,
  Clock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ArrowLeft,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';

// ============================================
// Server Actions
// ============================================

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    throw new Error('Forbidden');
  }
  return user;
}

export async function createWindowAction(formData: FormData) {
  await requireAdmin();

  const opensAt = formData.get('opensAt') as string;
  const closesAt = formData.get('closesAt') as string;
  const publicMessage = formData.get('publicMessage') as string;
  const isOpen = formData.get('isOpen') === 'on';

  await prisma.applicationWindow.create({
    data: {
      opensAt: opensAt ? new Date(opensAt) : null,
      closesAt: closesAt ? new Date(closesAt) : null,
      publicMessage: publicMessage || null,
      isOpen,
    },
  });

  revalidatePath('/admin/tutor-applications/window');
}

export async function updateWindowAction(formData: FormData) {
  await requireAdmin();

  const id = formData.get('id') as string;
  const opensAt = formData.get('opensAt') as string;
  const closesAt = formData.get('closesAt') as string;
  const publicMessage = formData.get('publicMessage') as string;
  const isOpen = formData.get('isOpen') === 'on';

  await prisma.applicationWindow.update({
    where: { id },
    data: {
      opensAt: opensAt ? new Date(opensAt) : null,
      closesAt: closesAt ? new Date(closesAt) : null,
      publicMessage: publicMessage || null,
      isOpen,
    },
  });

  revalidatePath('/admin/tutor-applications/window');
}

export async function toggleWindowAction(id: string) {
  'use server';
  await requireAdmin();

  const window = await prisma.applicationWindow.findUnique({ where: { id } });
  if (!window) throw new Error('Window not found');

  await prisma.applicationWindow.update({
    where: { id },
    data: { isOpen: !window.isOpen },
  });

  revalidatePath('/admin/tutor-applications/window');
}

export async function deleteWindowAction(id: string) {
  'use server';
  await requireAdmin();

  await prisma.applicationWindow.delete({ where: { id } });

  revalidatePath('/admin/tutor-applications/window');
}

// ============================================
// Page Component
// ============================================

export default async function WindowManagementPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.user.findUnique({ where: { clerkId: userId! } });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    redirect('/unauthorized');
  }

  const windows = await prisma.applicationWindow.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/admin/tutor-applications"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Application Windows
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Control when tutor applications are open or closed.
        </p>
      </div>

      {/* Create New Window Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Create New Window
        </h2>
        <form action={createWindowAction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Opens At
              </label>
              <input
                type="datetime-local"
                name="opensAt"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Closes At
              </label>
              <input
                type="datetime-local"
                name="closesAt"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Public Message (optional)
            </label>
            <textarea
              name="publicMessage"
              rows={2}
              placeholder="e.g. Tutor applications are now open for the 2025 academic year."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isOpen"
                defaultChecked
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Open immediately
              </span>
            </label>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Create Window
          </button>
        </form>
      </div>

      {/* Windows List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Existing Windows
          </h2>
        </div>

        {windows.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>No application windows yet.</p>
            <p className="text-sm mt-1">Create one above to open tutor applications.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {windows.map((win) => (
              <WindowRow key={win.id} window={win} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Window Row Component
// ============================================

async function WindowRow({ window: win }: { window: any }) {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            {win.isOpen ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <Check className="w-3 h-3" />
                Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <X className="w-3 h-3" />
                Closed
              </span>
            )}
            {win.opensAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Opens: {new Date(win.opensAt).toLocaleString()}
              </span>
            )}
            {win.closesAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Closes: {new Date(win.closesAt).toLocaleString()}
              </span>
            )}
          </div>

          {/* Public message */}
          {win.publicMessage && (
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              &ldquo;{win.publicMessage}&rdquo;
            </p>
          )}

          {/* Metadata */}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Created {new Date(win.createdAt).toLocaleString()}
            {win.notifiedAt && ` · Notified ${new Date(win.notifiedAt).toLocaleString()}`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle open/closed */}
          <form action={() => toggleWindowAction(win.id)}>
            <button
              type="submit"
              className={`p-2 rounded-lg transition ${
                win.isOpen
                  ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
              title={win.isOpen ? 'Close window' : 'Open window'}
            >
              {win.isOpen ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Delete */}
          <form
            action={async () => {
              'use server';
              await deleteWindowAction(win.id);
            }}
          >
            <button
              type="submit"
              className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              title="Delete window"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

