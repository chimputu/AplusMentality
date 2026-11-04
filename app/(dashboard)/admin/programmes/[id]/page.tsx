export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProgrammeTreeClient from './ProgrammeTreeClient';

export default async function ProgrammeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Auth handled by layout (ADMIN + SUPER_ADMIN)
  const { id } = await params;

  const programme = await prisma.programme.findUnique({
    where: { id },
    include: {
      institution: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!programme) notFound();

  const institutionId = programme.institutionId;

  const levels = await prisma.academicLevel.findMany({
    where: { institutionId: institutionId || undefined },
    orderBy: { order: 'asc' },
  });

  const courses = await prisma.course.findMany({
    where: { programmeId: id },
    include: {
      academicPeriod: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const periods = await prisma.academicPeriod.findMany({
    where: { institutionId: institutionId || undefined },
    orderBy: { order: 'asc' },
  });

  const tree = {
    programme: { id: programme.id, name: programme.name, code: programme.code },
    institution: programme.institution,
    levels: levels.map((level) => ({
      id: level.id,
      name: level.name,
      order: level.order,
      courses: courses
        .filter((c) => c.levelId === level.id)
        .map((c) => ({
          id: c.id,
          code: c.code,
          name: c.title,
          description: c.description,
          yearNumber: c.yearNumber,
          period: c.academicPeriod,
          createdAt: c.createdAt.toISOString(),
        })),
    })),
  };

  return <ProgrammeTreeClient tree={tree} periods={periods} />;
}
