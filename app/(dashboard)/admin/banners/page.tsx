import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Edit, Eye, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { deleteBanner, toggleBannerActive } from '@/lib/actions/banner';
import { formatDate } from '@/lib/date-format';

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams?: Promise<{ scope?: string }>;
}) {
  await requireAuth(['ADMIN']);

  const params = searchParams ? await searchParams : {};
  const scopeFilter = params.scope || undefined;

  const where: any = {};
  if (scopeFilter) {
    where.scope = scopeFilter;
  }

  const banners = await prisma.banner.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { startsAt: 'desc' }],
    include: {
      institution: {
        select: {
          id: true,
          name: true,
        },
      },
      targets: {
        include: {
          institution: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const serializedBanners = banners.map((b) => ({
    ...b,
    startsAt: b.startsAt.toISOString(),
    endsAt: b.endsAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    targets: b.targets.map((t) => ({
      id: t.id,
      institutionId: t.institutionId,
      institution: t.institution,
    })),
  }));

  const variantColors: Record<string, string> = {
    INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    WARNING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    DANGER: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    PROMO: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  };

  const placementLabels: Record<string, string> = {
    HOMEPAGE: 'Homepage',
    DASHBOARD: 'Dashboard',
    BOTH: 'Both',
  };

  const getTargetBadge = (banner: any) => {
    if (banner.scope === 'GLOBAL') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          🌍 Global
        </span>
      );
    }
    if (banner.scope === 'ALL') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
          🏫 All
        </span>
      );
    }
    const count = banner.targets?.length ?? 0;
    const names = banner.targets?.map((t: any) => t.institution?.name).filter(Boolean) ?? [];
    return (
      <span
        title={names.join(', ')}
        className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      >
        🎓 {count} {count === 1 ? 'uni' : 'unis'}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Banners</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Post announcements to the homepage and dashboard
          </p>
        </div>
        <Link
          href="/admin/banners/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          New Banner
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">Filter by scope:</span>
        <div className="flex gap-2">
          {[
            { value: '', label: 'All' },
            { value: 'GLOBAL', label: 'Global' },
            { value: 'ALL', label: 'All universities' },
            { value: 'SPECIFIC', label: 'Specific' },
          ].map((opt) => (
            <Link
              key={opt.value}
              href={opt.value ? `/admin/banners?scope=${opt.value}` : '/admin/banners'}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                (!scopeFilter && !opt.value) || scopeFilter === opt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {serializedBanners.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-4xl mb-4">📢</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No banners yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first banner to announce something to users.
          </p>
          <Link
            href="/admin/banners/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Create Banner
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Placement
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Variant
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Starts
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ends
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {serializedBanners.map((banner: any) => (
                  <tr key={banner.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {banner.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {banner.message}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {placementLabels[banner.placement] || banner.placement}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          variantColors[banner.variant] || variantColors.INFO
                        }`}
                      >
                        {banner.variant}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getTargetBadge(banner)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(banner.startsAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {banner.endsAt ? formatDate(banner.endsAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={async () => {
                          'use server';
                          await toggleBannerActive(banner.id);
                        }}
                      >
                        <button type="submit" className="cursor-pointer">
                          {banner.isActive ? (
                            <ToggleRight className="w-5 h-5 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/banners/${banner.id}/edit`}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link
                          href="/"
                          target="_blank"
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <form
                          action={async () => {
                            'use server';
                            if (confirm('Are you sure you want to delete this banner?')) {
                              await deleteBanner(banner.id);
                            }
                          }}
                        >
                          <button
                            type="submit"
                            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
