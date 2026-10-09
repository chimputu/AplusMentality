import NewProgrammeForm from './_components/new-programme-form';
import { prisma } from '@/lib/prisma';

export default async function NewProgrammePage() {
  const institutions = await prisma.institution.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <NewProgrammeForm institutions={institutions} />
    </div>
  );
}
