import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List all users (Admin only) with search, role, and institution filters
export async function GET(req: Request) {
  try {
    await requireAuth(['ADMIN']);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const institutionId = searchParams.get('institutionId');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (institutionId && institutionId !== 'ALL') {
      where.institutionId = institutionId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        username: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        role: true,
        institutionId: true,
        programmeId: true,
        year: true,
        period: true,
        onboarded: true,
        createdAt: true,
        updatedAt: true,
        institution: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            courses: true,
            announcements: true,
            videos: true,
            quizzes: true,
            tests: true,
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also fetch all institutions for the filter dropdown
    const institutions = await prisma.institution.findMany({
      where: { isActive: true },
      select: { id: true, name: true, shortName: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users, institutions });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}