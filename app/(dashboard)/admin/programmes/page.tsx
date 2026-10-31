import { listProgrammes } from '@/lib/actions/programme-crud';
import { prisma } from '@/lib/prisma';
import PageHeader from '@/components/PageHeader';
import ProgrammeTable from './_components/programme-table';

export default async function ProgrammesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; institutionId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const search = params.search || undefined;
  const institutionId = params.institutionId || undefined;

  const result = await listProgrammes({
    institutionId,
    search,
    page,
    pageSize: 10,
  });

  // Fetch all institutions for the filter dropdown
  const institutions = await prisma.university.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const hasFilters = !!(search || institutionId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programmes"
        description="Manage academic programmes across all institutions."
        action={{
          label: "Add Programme",
          href: "/admin/programmes/new",
        }}
      />

      <ProgrammeTable
        programmes={result.programmes}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        search={search}
        institutionId={institutionId}
        institutions={institutions}
        hasFilters={hasFilters}
      />
    </div>
  );
}
