import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkRoleHierarchy } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateUserClerkOrgRole, APP_ROLE_TO_CLERK } from '@/lib/clerk-org';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Promise
) {
  try {
    const { userId, role } = await requireAuth();
    const { id } = await params;  // ✅ Await

    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (!isAdmin && id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Data isolation: University admins can only view users in their own institution
    if (role === 'ADMIN') {
      const targetUser = await prisma.user.findUnique({
        where: { clerkId: id },
        select: { institutionId: true, role: true },
      });
      const adminUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { institutionId: true },
      });
      if (targetUser && adminUser && targetUser.institutionId && adminUser.institutionId
        && targetUser.institutionId !== adminUser.institutionId) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only manage users in your own university.' },
          { status: 403 }
        );
      }
      // Role hierarchy: ADMIN cannot view SUPER_ADMIN or peer ADMIN
      if (targetUser && (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN')) {
        return NextResponse.json(
          { error: 'Unauthorized: You do not have permission to view this user.' },
          { status: 403 }
        );
      }
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

    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (body.role && !isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can change roles' },
        { status: 403 }
      );
    }

    if (!isAdmin && id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Data isolation: University admins can only edit users in their own institution
    if (role === 'ADMIN') {
      const targetUser = await prisma.user.findUnique({
        where: { clerkId: id },
        select: { institutionId: true, role: true },
      });
      const adminUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { institutionId: true },
      });
      if (targetUser && adminUser && targetUser.institutionId && adminUser.institutionId
        && targetUser.institutionId !== adminUser.institutionId) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only manage users in your own university.' },
          { status: 403 }
        );
      }
      // Role hierarchy: ADMIN cannot modify SUPER_ADMIN or peer ADMIN (even without role change)
      if (targetUser && (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN')) {
        return NextResponse.json(
          { error: 'Unauthorized: You do not have permission to manage this user.' },
          { status: 403 }
        );
      }
    }

    // Role hierarchy check: prevent privilege escalation
    if (body.role) {
      const targetUser = await prisma.user.findUnique({
        where: { clerkId: id },
        select: { role: true },
      });
      if (targetUser) {
        const hierarchyCheck = checkRoleHierarchy(role, targetUser.role, body.role);
        if (!hierarchyCheck.allowed) {
          return NextResponse.json(
            { error: hierarchyCheck.reason },
            { status: 403 }
          );
        }
      }
    }

    const updateData: any = {
      name: body.name,
      role: body.role,
    };

    // Academic profile fields
    if (body.institutionId !== undefined) updateData.institutionId = body.institutionId || null;
    if (body.facultyId !== undefined) updateData.facultyId = body.facultyId || null;
    if (body.programmeId !== undefined) updateData.programmeId = body.programmeId || null;
    if (body.branchId !== undefined) updateData.branchId = body.branchId || null;
    if (body.year !== undefined) updateData.year = body.year ?? null;
    if (body.period !== undefined) updateData.period = body.period || null;

    const user = await prisma.user.update({
      where: { clerkId: id },
      data: updateData,
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
    const { userId, role } = await requireAuth(['ADMIN', 'SUPER_ADMIN']);
    const { id } = await params;  // ✅ Await

    // Data isolation: University admins can only delete users in their own institution
    if (role === 'ADMIN') {
      const targetUser = await prisma.user.findUnique({
        where: { clerkId: id },
        select: { institutionId: true, role: true },
      });
      const adminUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { institutionId: true },
      });
      if (targetUser && adminUser && targetUser.institutionId && adminUser.institutionId
        && targetUser.institutionId !== adminUser.institutionId) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only manage users in your own university.' },
          { status: 403 }
        );
      }
      // Role hierarchy check: prevent Admins from deleting peers or higher-privilege users
      if (targetUser) {
        const hierarchyCheck = checkRoleHierarchy(role, targetUser.role, targetUser.role);
        if (!hierarchyCheck.allowed) {
          return NextResponse.json(
            { error: hierarchyCheck.reason },
            { status: 403 }
          );
        }
      }
    }

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