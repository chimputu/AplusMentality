'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  BookOpen,
  Users,
} from 'lucide-react';
import { deleteProgramme } from '@/lib/actions/programme-crud';
import { toast } from 'sonner';

interface ProgrammeRow {
  id: string;
  name: string;
  code: string | null;
  shortName: string | null;
  institution: { id: string; name: string; slug: string } | null;
  faculty: { id: string; name: string; code: string } | null;
  _count: {
    branches: number;
    courses: number;
    tutors: number;
    users: number;
  };
}

export default function ProgrammeTable({ programmes }: { programmes: ProgrammeRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        await deleteProgramme(deleteId);
        setDeleteId(null);
        router.refresh();
        toast.success('Programme deleted successfully');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete programme');
      }
    });
  };

  if (programmes.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <BookOpen className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
          No programmes yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Add your first programme to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Programme
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Code
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Institution
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Faculty
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Stats
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {programmes.map((prog) => (
                <tr
                  key={prog.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {prog.name}
                      </div>
                      {prog.shortName && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {prog.shortName}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {prog.code ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {prog.code}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {prog.institution ? (
                      <span className="text-gray-700 dark:text-gray-300">
                        {prog.institution.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {prog.faculty ? (
                      <div>
                        <div className="text-gray-700 dark:text-gray-300">
                          {prog.faculty.name}
                        </div>
                        {prog.faculty.code && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {prog.faculty.code}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {prog._count.courses}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {prog._count.users}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setOpenMenu(openMenu === prog.id ? null : prog.id)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                      {openMenu === prog.id && (
                        <div className="absolute right-0 z-10 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenu(null);
                              router.push(`/admin/programmes/${prog.id}/edit`);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenu(null);
                              handleDelete(prog.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Programme
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this programme? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={isPending}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isPending}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
