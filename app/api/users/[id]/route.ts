import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateUserClerkOrgRole, APP_ROLE_TO_CLERK } from '@/lib/clerk-org';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Promise
) {
  try {
    const { userId, role } = await requireAuth();
    const { id } = await params;  // ✅ Await

    if (role !== 'ADMIN' && id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: id },
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

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Promise
) {
  try {
    const { userId, role } = await requireAuth();
    const { id } = await params;  // ✅ Await
    const body = await req.json();

    if (body.role && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can change roles' },
        { status: 403 }
      );
    }

    if (role !== 'ADMIN' && id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const user = await prisma.user.update({
      where: { clerkId: id },
      data: {
        name: body.name,
        role: body.role,
      },
      include: {
        institution: { select: { clerkOrgId: true } },
      },
    });

    // If role changed, sync to Clerk org membership so Clerk and DB stay in sync
    if (body.role) {
      const clerkOrgRole = APP_ROLE_TO_CLERK[body.role];
      if (clerkOrgRole && user.clerkId) {
        // Try to sync via the user's institution org
        if (user.institution?.clerkOrgId) {
          await updateUserClerkOrgRole(user.clerkId, user.institution.clerkOrgId, clerkOrgRole)
            .catch((err) => console.error('[API] Failed to sync role to Clerk:', err));
        }
        // Also check active clerkOrgId on the user
        const activeOrgId = user.clerkOrgId;
        if (activeOrgId && activeOrgId !== user.institution?.clerkOrgId) {
          await updateUserClerkOrgRole(user.clerkId, activeOrgId, clerkOrgRole)
            .catch((err) => console.error('[API] Failed to sync role to Clerk (active org):', err));
        }
      }
    }

    // Strip institution from response
    const { institution, ...userResponse } = user;

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: userResponse,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Promise
) {
  try {
    await requireAuth(['ADMIN']);
    const { id } = await params;  // ✅ Await

    await prisma.user.delete({
      where: { clerkId: id },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}