'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  deleteInstitution,
  toggleInstitutionActive,
  toggleInstitutionVerified,
} from '@/lib/actions/institution-crud';
import { toast } from 'sonner';

const TYPE_EMOJI: Record<string, string> = {
  UNIVERSITY: '🎓',
  COLLEGE: '🏛️',
  POLYTECHNIC: '🔬',
  INSTITUTE: '🏫',
  MEDICAL_SCHOOL: '⚕️',
  BUSINESS_SCHOOL: '💼',
  TECHNICAL_COLLEGE: '🔧',
  VOCATIONAL_SCHOOL: '🛠️',
};

interface InstitutionRow {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  type: string;
  city: string | null;
  country: string | null;
  numLevels: number;
  numPeriods: number;
  isActive: boolean;
  isVerified: boolean;
  _count: {
    levels: number;
    periods: number;
    faculties: number;
    programmes: number;
    users: number;
  };
}

export default function InstitutionTable({ institutions }: { institutions: InstitutionRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleToggleVerified = (id: string) => {
    startTransition(async () => {
      try {
        await toggleInstitutionVerified(id);
        router.refresh();
        toast.success('Institution status updated');
      } catch (err: any) {
        toast.error(err.message || 'Failed to update institution');
      }
    });
  };

  const handleToggleActive = (id: string) => {
    startTransition(async () => {
      try {
        await toggleInstitutionActive(id);
        router.refresh();
        toast.success('Institution status updated');
      } catch (err: any) {
        toast.error(err.message || 'Failed to update institution');
      }
    });
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        await deleteInstitution(deleteId);
        setDeleteId(null);
        router.refresh();
        toast.success('Institution deleted successfully');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete institution');
      }
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Institution</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Location</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Structure</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Programmes</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {institutions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <AlertTriangle className="w-8 h-8 text-gray-400" />
                    <p className="text-base font-medium">No institutions yet</p>
                    <p className="text-sm">Click <span className="font-semibold">Add Institution</span> to create one.</p>
                  </div>
                </td>
              </tr>
            ) : (
              institutions.map((inst) => (
                <tr
                  key={inst.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition"
                >
                  {/* Institution */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl" role="img" aria-label={inst.type}>
                        {TYPE_EMOJI[inst.type] || '🏫'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{inst.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {inst.shortName && <span>{inst.shortName} · </span>}
                          <span className="font-mono">{inst.slug}</span>
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {inst.type.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {inst.city && <span>{inst.city}</span>
                    }{inst.city && inst.country && <span>, </span>}
                    {inst.country}
                  </td>

                  {/* Structure */}
                  <td className="px-4 py-3">
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="text-xs">{inst._count.levels} levels</span>
                      <span className="mx-1.5 text-gray-400">·</span>
                      <span className="text-xs">{inst._count.periods} periods</span>
                    </div>
                  </td>

                  {/* Programmes */}
                  <td className="px-4 py-3 text-center text-gray-900 dark:text-gray-100 font-medium">
                    {inst._count.programmes}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          inst.isVerified
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {inst.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          inst.isActive
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {inst.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenMenu(openMenu === inst.id ? null : inst.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>

                      {openMenu === inst.id && (
                        <div className="absolute right-0 top-8 z-20 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 text-sm">
                          <Link
                            href={`/admin/institutions/${inst.id}`}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                          <Link
                            href={`/admin/institutions/${inst.id}/edit`}
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Link>
                          <button
                            onClick={() => {
                              handleToggleVerified(inst.id);
                              setOpenMenu(null);
                            }}
                            disabled={isPending}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 disabled:opacity-50"
                          >
                            {inst.isVerified ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            {inst.isVerified ? 'Unverify' : 'Verify'}
                          </button>
                          <button
                            onClick={() => {
                              handleToggleActive(inst.id);
                              setOpenMenu(null);
                            }}
                            disabled={isPending}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 disabled:opacity-50"
                          >
                            {inst.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            {inst.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <hr className="my-1 border-gray-200 dark:border-gray-700" />
                          <button
                            onClick={() => {
                              handleDelete(inst.id);
                              setOpenMenu(null);
                            }}
                            disabled={isPending}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-red-600 dark:text-red-400 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Delete Institution?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  This will permanently delete <strong>all</strong> associated data:
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside space-y-0.5 mb-4">
                  <li>Academic levels and periods</li>
                  <li>Faculties and programmes</li>
                  <li>Courses and content</li>
                  <li>User associations</li>
                </ul>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Institution'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
