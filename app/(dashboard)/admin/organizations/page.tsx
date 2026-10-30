import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PageHeader from '@/components/PageHeader';
import { syncOrganizationToClerk } from '@/lib/actions/institution-crud';
import { revalidatePath } from 'next/cache';

// Client component for the Sync button
function SyncButton({ institutionId }: { institutionId: string }) {
  const handleSync = async () => {
    const result = await syncOrganizationToClerk(institutionId);
    if (result.success) {
      // Revalidate by reloading the page
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

export default async function OrganizationsPage() {
  // Auth handled by layout (ADMIN + SUPER_ADMIN) - SUPER_ADMIN only page
  let institutions: any[] = [];
  let usersWithoutMemberships = 0;
  try {
    // Fetch all institutions with clerkOrg fields
    institutions = await prisma.institution.findMany({
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
      <PageHeader
        title="Organizations"
        description="Monitor Clerk Organization linkage status for institutions."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Institutions</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{totalInstitutions}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Linked to Clerk</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{linkedInstitutions}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Not Linked</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{notLinkedInstitutions}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Users Without Memberships</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{usersWithoutMemberships}</p>
        </div>
      </div>

      {/* Institutions Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Clerk Org ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Clerk Org Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No institutions found.
                  </td>
                </tr>
              ) : (
                institutions.map((institution) => (
                  <tr
                    key={institution.id}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                      {institution.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {institution.slug}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      {institution.clerkOrgId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
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
