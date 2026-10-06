import { prisma } from '@/lib/prisma';
import NewTutorForm from './_components/new-tutor-form';

export default async function NewTutorPage() {
  // Fetch all data server-side for the form
  const [universities, programmes, branches, courses] = await Promise.all([
    prisma.university.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
    prisma.programme.findMany({
      select: { id: true, name: true, code: true, universityId: true },
      orderBy: { name: 'asc' },
    }),
    prisma.branch.findMany({
      select: { id: true, name: true, programmeId: true },
      orderBy: { name: 'asc' },
    }),
    prisma.course.findMany({
      where: { isPublished: true },
      select: { id: true, code: true, title: true, universityId: true },
      orderBy: { title: 'asc' },
      take: 200,
    }),
  ]);

  return (
    <NewTutorForm
      universities={universities}
      programmes={programmes}
      branches={branches}
      courses={courses}
    />
  );
}
