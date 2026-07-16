import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Promote/Demote a single user
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(['ADMIN']);
    const body = await req.json();
    const { targetUserId, newRole } = body;

    console.log('🔵 Promotion request:', { targetUserId, newRole, adminId: userId });

    // Validate input
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    if (!newRole || !['ADMIN', 'STUDENT'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Valid role (ADMIN or STUDENT) is required' },
        { status: 400 }
      );
    }

    // Prevent self-role change
    if (targetUserId === userId) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 403 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { clerkId: targetUserId },
    });

    if (!targetUser) {
      console.log('❌ Target user not found:', targetUserId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { clerkId: targetUserId },
      data: { role: newRole },
    });

    const action = newRole === 'ADMIN' ? 'promoted to Admin' : 'demoted to Student';

    console.log('✅ User updated:', updatedUser);

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.name || 'Unknown'} has been ${action}`,
      user: {
        id: updatedUser.id,
        clerkId: updatedUser.clerkId,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    console.error('Promotion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user role' },
      { status: 500 }
    );
  }
}