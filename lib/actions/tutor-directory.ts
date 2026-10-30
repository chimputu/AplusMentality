'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Fetch tutors for the Find-Tutor directory page.
 * Students can filter by their own university or view all universities.
 */
export async function getTutors(filters?: {
  institutionId?: string | null; // null = all universities
  search?: string;
}) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error: 'You must be logged in to view tutors.' };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { institutionId: true },
  });

  const where: any = {
    isActive: true,
    isVerified: true,
  };

  // If institutionId is provided and not null, filter by that institution
  if (filters?.institutionId) {
    where.universityId = filters.institutionId;
  }
  // If institutionId is null (or not provided), show all tutors

  if (filters?.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { bio: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const tutors = await prisma.tutor.findMany({
    where,
    include: {
      specialties: {
        include: {
          course: {
            select: {
              code: true,
              title: true,
            },
          },
        },
      },
      university: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    tutors,
    userInstitutionId: user?.institutionId,
  };
}
