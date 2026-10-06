import { listProgrammes } from '@/lib/actions/programme-crud';
import PageHeader from '@/components/PageHeader';
import ProgrammeTable from './_components/programme-table';

export default async function ProgrammesPage() {
  const programmes = await listProgrammes();

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

      <ProgrammeTable programmes={programmes} />
    </div>
  );
}
