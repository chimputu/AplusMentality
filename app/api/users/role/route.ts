import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Check user role
export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId') || userId;

    // Admins can check anyone, users can only check themselves
    if (role !== 'ADMIN' && targetUserId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only check your own role' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: targetUserId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        isAdmin: user.role === 'ADMIN',
        isStudent: user.role === 'STUDENT',
      },
    });
  } catch (error: any) {
    console.error('Role check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check user role' },
      { status: 500 }
    );
  }
}