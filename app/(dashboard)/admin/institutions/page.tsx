import { listInstitutions } from '@/lib/actions/institution-crud';
import { requireAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import InstitutionTable from './_components/institution-table';

export default async function InstitutionsPage() {
  await requireAuth(['ADMIN', 'SUPER_ADMIN']);
  const institutions = await listInstitutions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutions"
        description="Manage universities, colleges, polytechnics, and other academic institutions."
      />

      <InstitutionTable institutions={institutions} />
    </div>
  );
}
