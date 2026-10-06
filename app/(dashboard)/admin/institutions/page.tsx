import { listInstitutions } from '@/lib/actions/institution-crud';
import PageHeader from '@/components/PageHeader';
import InstitutionTable from './_components/institution-table';

export default async function InstitutionsPage() {
  const institutions = await listInstitutions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutions"
        description="Manage universities, colleges, polytechnics, and other academic institutions."
        action={{
          label: "Add Institution",
          href: "/admin/institutions/new",
        }}
      />

      <InstitutionTable institutions={institutions} />
    </div>
  );
}
