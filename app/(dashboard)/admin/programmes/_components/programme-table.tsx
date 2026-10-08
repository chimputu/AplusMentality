'use client';

import { useState, useTransition, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  BookOpen,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
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

interface InstitutionOption {
  id: string;
  name: string;
}

interface ProgrammeTableProps {
  programmes: ProgrammeRow[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  search?: string;
  institutionId?: string;
  institutions?: InstitutionOption[];
  hasFilters?: boolean;
}

export default function ProgrammeTable({
  programmes,
  total = 0,
  page = 1,
  pageSize: _pageSize = 10,
  totalPages = 1,
  search: initialSearch = '',
  institutionId: initialInstitutionId = '',
  institutions = [],
  hasFilters = false,
}: ProgrammeTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filterInstitution, setFilterInstitution] = useState(initialInstitutionId);

  // Apply search and filter via URL query params
  const applyFilters = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (filterInstitution) params.set('institutionId', filterInstitution);
    router.push(`/admin/programmes?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterInstitution('');
    router.push('/admin/programmes');
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (filterInstitution) params.set('institutionId', filterInstitution);
    if (p > 1) params.set('page', String(p));
    router.push(`/admin/programmes?${params.toString()}`);
  };

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

  const isEmpty = programmes.length === 0;

  if (isEmpty) {
    return (
      <>
        {/* Search & filter bar */}
        {institutions.length > 0 && (
          <form onSubmit={applyFilters} className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search programmes…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={filterInstitution}
              onChange={(e) => setFilterInstitution(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All institutions</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
            <button type="submit"
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition min-h-[44px]">
              Search
            </button>
          </form>
        )}

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            {hasFilters ? 'No programmes match your filters' : 'No programmes yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {hasFilters
              ? 'Try adjusting your search or clearing filters.'
              : 'Add your first programme to get started.'}
          </p>
          {hasFilters ? (
            <button type="button" onClick={clearFilters}
              className="inline-flex items-center gap-2 mt-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium min-h-[44px]">
              Clear filters
            </button>
          ) : (
            <Link
              href="/admin/programmes/new"
              className="inline-flex items-center gap-2 mt-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium min-h-[44px]"
            >
              Add Programme
            </Link>
          )}
        </div>
      </>
    );
  }

  // Shared action buttons — used in both table and card layouts
  const renderActions = (prog: ProgrammeRow) => (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpenMenu(openMenu === prog.id ? null : prog.id)}
        // 44px minimum tap target on mobile, 40px on desktop
        className="h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        aria-label={`Actions for ${prog.name}`}
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
  );

  return (
    <>
      {/* Search & filter bar */}
      <form onSubmit={applyFilters} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search programmes by name or code…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterInstitution}
          onChange={(e) => setFilterInstitution(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All institutions</option>
          {institutions.map((inst) => (
            <option key={inst.id} value={inst.id}>{inst.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit"
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition min-h-[44px]">
            Search
          </button>
          {hasFilters && (
            <button type="button" onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition min-h-[44px]">
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Results count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {programmes.length} of {total} programme{total !== 1 ? 's' : ''}
        {hasFilters && ' matching your filters'}
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Desktop: native table */}
        <div className="hidden md:block overflow-x-auto">
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
                    {renderActions(prog)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: card list */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {programmes.map((prog) => (
            <div key={prog.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
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
                {renderActions(prog)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Code
                  </div>
                  <div className="text-gray-900 dark:text-gray-100 mt-0.5">
                    {prog.code || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Institution
                  </div>
                  <div className="text-gray-900 dark:text-gray-100 mt-0.5">
                    {prog.institution?.name || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Faculty
                  </div>
                  <div className="text-gray-900 dark:text-gray-100 mt-0.5">
                    {prog.faculty?.name || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Stats
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {prog._count.courses}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {prog._count.users}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
