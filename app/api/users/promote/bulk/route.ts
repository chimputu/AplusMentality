import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Bulk promote/demote users
export async function POST(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const body = await req.json();
    const { userIds, newRole } = body;

    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Array of user IDs is required' },
        { status: 400 }
      );
    }

    if (!newRole || !['ADMIN', 'STUDENT'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Valid role (ADMIN or STUDENT) is required' },
        { status: 400 }
      );
    }

    // Update all users
    const updatePromises = userIds.map((userId) =>
      prisma.user.update({
        where: { clerkId: userId },
        data: { role: newRole },
      })
    );

    const updatedUsers = await Promise.all(updatePromises);

    const action = newRole === 'ADMIN' ? 'promoted to Admin' : 'demoted to Student';

    return NextResponse.json({
      success: true,
      message: `${updatedUsers.length} users have been ${action}`,
      users: updatedUsers.map((u) => ({
        id: u.id,
        clerkId: u.clerkId,
        email: u.email,
        name: u.name,
        role: u.role,
      })),
    });
  } catch (error: any) {
    console.error('Bulk promotion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to bulk update user roles' },
      { status: 500 }
    );
  }
}