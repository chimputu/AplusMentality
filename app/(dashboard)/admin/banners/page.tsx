import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Edit, Eye, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { deleteBanner, toggleBannerActive } from '@/lib/actions/banner';
import { formatDate } from '@/lib/date-format';

// Cached banner query with revalidation
const getCachedBanners = unstable_cache(
  async (scope?: string) => {
    const where: any = {};
    if (scope) where.scope = scope;

    const banners = await prisma.banner.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { startsAt: 'desc' }],
      include: {
        institution: {
          select: { id: true, name: true },
        },
        targets: {
          include: {
            institution: { select: { id: true, name: true } },
          },
        },
      },
    });

    return banners.map((b) => ({
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
  },
  ['banners-list'],
  { revalidate: 60, tags: ['banners'] }
);

function BannersSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

async function BannersContent({ scopeFilter }: { scopeFilter?: string }) {
  const serializedBanners = await getCachedBanners(scopeFilter);
  return <BannersTable banners={serializedBanners} scopeFilter={scopeFilter} />;
}

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams?: Promise<{ scope?: string }>;
}) {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  const params = searchParams ? await searchParams : {};
  const scopeFilter = params.scope || undefined;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banners</h1>
          <p className="text-gray-600 dark:text-muted-foreground text-sm">
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
        <span className="text-sm text-muted-foreground">Filter by scope:</span>
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
                  : 'border-gray-300 dark:border-border text-gray-600 dark:text-muted-foreground hover:border-gray-400'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      <Suspense fallback={<BannersSkeleton />}>
        <BannersContent scopeFilter={scopeFilter} />
      </Suspense>
    </div>
  );
}

function BannersTable({ banners, scopeFilter }: { banners: any[]; scopeFilter?: string }) {
  const variantColors: Record<string, string> = {
    INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    WARNING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
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
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
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
    const count = (Array.isArray(banner.targets) ? banner.targets : []).length;
    const names = (Array.isArray(banner.targets) ? banner.targets : [])
      .map((t: any) => t.institution?.name)
      .filter(Boolean);
    return (
      <span
        title={names.join(', ')}
        className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      >
        🎓 {count} {count === 1 ? 'uni' : 'unis'}
      </span>
    );
  };

  if (banners.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-xl border border-border">
        <div className="text-4xl mb-4">📢</div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No banners yet
        </h3>
        <p className="text-muted-foreground mb-4">
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
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Title
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Placement
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Variant
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Target
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Starts
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ends
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {(Array.isArray(banners) ? banners : []).map((banner: any) => (
              <tr key={banner.id} className="hover:bg-muted">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {banner.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                      {banner.message}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700 dark:text-foreground">
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
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDate(banner.startsAt)}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {banner.endsAt ? formatDate(banner.endsAt) : '—'}
                </td>
                <td className="px-4 py-3">
                  <form
                    action={async () => {
                      await toggleBannerActive(banner.id);
                    }}
                  >
                    <button type="submit" className="cursor-pointer" aria-label={banner.isActive ? 'Deactivate banner' : 'Activate banner'}>
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
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition"
                      title="Edit"
                      aria-label="Edit banner"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition"
                      title="Preview"
                      aria-label="Preview banner"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <form
                      action={async () => {
                        if (confirm('Are you sure you want to delete this banner?')) {
                          await deleteBanner(banner.id);
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition"
                        title="Delete"
                        aria-label="Delete banner"
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
  );
}
