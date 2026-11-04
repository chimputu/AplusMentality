import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth, requireApiRole } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

// GET - Search users by name or email (for admin use)
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireApiRole(['ADMIN', 'SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const adminUser = authResult.user;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Strict tenant isolation: ADMIN can only search users in their own institution
    if (adminUser.role === 'ADMIN' && adminUser.institutionId) {
      where.institutionId = adminUser.institutionId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
        institutionId: true,
        institution: {
          select: {
            name: true,
          },
        },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('[UserSearch] Error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
