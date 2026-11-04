export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PageHeader from '@/components/PageHeader';
import { syncOrganizationToClerk, syncAllOrgsToClerk } from '@/lib/actions/institution-crud';
import { revalidatePath } from 'next/cache';

// Client component for the Sync button
function SyncButton({ institutionId }: { institutionId: string }) {
  const handleSync = async () => {
    const result = await syncOrganizationToClerk(institutionId);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.message || 'Failed to sync organization');
    }
  };

  return (
    <button
      type="button"
      onClick={handleSync}
      className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
    >
      Sync
    </button>
  );
}

// Client component for the Sync All button
function SyncAllButton({ notLinkedCount }: { notLinkedCount: number }) {
  const handleSyncAll = async () => {
    if (!confirm(`This will attempt to sync ${notLinkedCount} unlinked institutions with Clerk. Continue?`)) {
      return;
    }
    const result = await syncAllOrgsToClerk();
    if (result.success) {
      alert(result.message);
      window.location.reload();
    } else {
      alert(result.message || 'Failed to sync organizations');
    }
  };

  return (
    <button
      type="button"
      onClick={handleSyncAll}
      disabled={notLinkedCount === 0}
      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
    >
      Sync All ({notLinkedCount})
    </button>
  );
}

export default async function OrganizationsPage() {
  // Only SUPER_ADMIN can access this page - prevent org:admin privilege escalation
  await requireAuth(['SUPER_ADMIN']);

  let institutions: any[] = [];
  let usersWithoutMemberships = 0;
  try {
    // Fetch all institutions with clerkOrg fields
    institutions = await prisma.university.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        clerkOrgId: true,
        clerkOrgSlug: true,
      },
      orderBy: { name: 'asc' },
    });

    // Count users without org memberships
    const totalUsers = await prisma.user.count();
    const memberships = await prisma.organizationMembership.findMany({
      where: { status: 'active' },
      select: { userId: true },
    });
    const distinctUserIds = new Set(memberships.map((m) => m.userId));
    usersWithoutMemberships = totalUsers - distinctUserIds.size;
  } catch (err) {
    console.error('[Organizations] Failed to fetch data:', err);
  }

  const totalInstitutions = institutions.length;
  const linkedInstitutions = institutions.filter((i) => i.clerkOrgId !== null).length;
  const notLinkedInstitutions = totalInstitutions - linkedInstitutions;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Organizations"
          description="Monitor Clerk Organization linkage status for institutions."
        />
        <div className="flex items-center gap-3">
          <a
            href="/api/export/institutions"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Export PDF
          </a>
          <SyncAllButton notLinkedCount={notLinkedInstitutions} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <p className="text-sm text-muted-foreground">Total Institutions</p>
          <p className="text-3xl font-bold text-foreground mt-1">{totalInstitutions}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <p className="text-sm text-muted-foreground">Linked to Clerk</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{linkedInstitutions}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <p className="text-sm text-muted-foreground">Not Linked</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{notLinkedInstitutions}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-5">
          <p className="text-sm text-muted-foreground">Users Without Memberships</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{usersWithoutMemberships}</p>
        </div>
      </div>

      {/* Institutions Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-muted-foreground">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-muted-foreground">Clerk Org ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-muted-foreground">Clerk Org Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No institutions found.
                  </td>
                </tr>
              ) : (
                institutions.map((institution) => (
                  <tr
                    key={institution.id}
                    className="border-b border-gray-100 dark:border-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <td className="px-4 py-3 text-foreground font-medium">
                      {institution.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground">
                      {institution.slug}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground font-mono text-xs">
                      {institution.clerkOrgId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-muted-foreground font-mono text-xs">
                      {institution.clerkOrgSlug ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {institution.clerkOrgId ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                          Linked ✅
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          Not linked ⚠️
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!institution.clerkOrgId ? (
                        <SyncButton institutionId={institution.id} />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
