import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PageHeader from '@/components/PageHeader';

export default async function OrganizationsPage() {
  // Restrict to SUPER_ADMIN only
  await requireAuth(['SUPER_ADMIN']);

  // Fetch all institutions with clerkOrg fields
  const institutions = await prisma.institution.findMany({
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
  const usersWithMemberships = await prisma.organizationMembership.count({
    where: { status: 'active' },
    distinct: ['userId'],
  });
  const usersWithoutMemberships = totalUsers - usersWithMemberships;

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
              </tr>
            </thead>
            <tbody>
              {institutions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
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
