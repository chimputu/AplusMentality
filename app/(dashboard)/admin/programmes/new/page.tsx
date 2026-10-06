import { getInstitutionsForDropdown } from '@/lib/actions/programme-crud';
import NewProgrammeForm from './_components/new-programme-form';

export default async function NewProgrammePage() {
  const institutions = await getInstitutionsForDropdown();

  return (
    <div className="max-w-3xl mx-auto">
      <NewProgrammeForm institutions={institutions} />
    </div>
  );
}
