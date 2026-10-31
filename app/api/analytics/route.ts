import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Analytics data for admin dashboard
export async function GET() {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      usersByRole,
      totalInstitutions,
      totalCourses,
      totalEnrollments,
      totalAssessments,
      recentUsers,
      // Time-series: user signups by date (last 7 days)
      userGrowth,
      // Time-series: enrollments by date (last 7 days)
      enrollmentActivity,
      // Top courses by enrollment count
      topCourses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      prisma.university.count({ where: { isActive: true } }),
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
      // User signups grouped by date
      prisma.user.groupBy({
        by: ['createdAt'],
        _count: { createdAt: true },
        where: { createdAt: { gte: last7Days } },
      }),
      // Enrollments grouped by date
      prisma.enrollment.groupBy({
        by: ['enrolledAt'],
        _count: { enrolledAt: true },
        where: { enrolledAt: { gte: last30Days } },
      }),
      // Top courses by enrollment count
      prisma.course.findMany({
        take: 5,
        orderBy: { enrollments: { _count: 'desc' } },
        select: {
          title: true,
          enrollments: { select: { id: true } },
        },
      }),
    ]);

    // Format user growth data for LineChart
    const userGrowthChart = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const daySignups = userGrowth
        .filter((u) => u.createdAt.toISOString().split('T')[0] === dateStr)
        .reduce((sum, u) => sum + u._count.createdAt, 0);
      return { date: dateStr, users: daySignups };
    });

    // Format enrollment activity data for AreaChart (last 7 days)
    const enrollmentActivityChart = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayEnrollments = enrollmentActivity
        .filter((e) => e.enrolledAt.toISOString().split('T')[0] === dateStr)
        .reduce((sum, e) => sum + e._count.enrolledAt, 0);
      return { date: dateStr, enrollments: dayEnrollments };
    });

    // Format top courses for BarChart
    const topCoursesChart = topCourses.map((c) => ({
      name: c.title,
      enrollments: c.enrollments.length,
    }));

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
      userGrowth: userGrowthChart,
      enrollmentActivity: enrollmentActivityChart,
      topCourses: topCoursesChart,
    });
  } catch (error: any) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
