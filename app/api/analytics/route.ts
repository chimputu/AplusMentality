import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Analytics data for admin dashboard
export async function GET() {
  try {
    const [
      totalUsers,
      usersByRole,
      totalInstitutions,
      totalCourses,
      totalEnrollments,
      totalAssessments,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      prisma.institution.count({ where: { isActive: true } }),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.assessment.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          institution: { select: { shortName: true } },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        usersByRole,
        totalInstitutions,
        totalCourses,
        totalEnrollments,
        totalAssessments,
      },
      recentUsers,
    });
  } catch (error: any) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
