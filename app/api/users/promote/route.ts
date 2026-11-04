import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth, requireApiRole } from '@/lib/auth/api-auth';
import { checkRoleHierarchy } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma/client';
import { updateUserClerkOrgRole, APP_ROLE_TO_CLERK } from '@/lib/clerk-org';

// POST - Promote/Demote a single user
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Use API-safe auth — no redirects
    const authResult = await requireApiRole(['ADMIN', 'SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;
    const adminUser = authResult.user;

    const body = await req.json();
    const { targetUserId, newRole } = body;

    // Validate input
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    const validRoles = Object.values(Role);
    if (!newRole || !validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: `Valid role is required. Allowed: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Prevent self-role change
    if (targetUserId === adminUser.clerkId) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 403 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { clerkId: targetUserId },
      include: { institution: { select: { clerkOrgId: true } } },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Role hierarchy check: prevent privilege escalation
    const hierarchyCheck = checkRoleHierarchy(adminUser.role, targetUser.role, newRole);
    if (!hierarchyCheck.allowed) {
      console.warn('[Promote] %s attempted to change %s (%s → %s) — denied: %s', adminUser.clerkId, targetUserId, targetUser.role, newRole, hierarchyCheck.reason);
      return NextResponse.json(
        { error: hierarchyCheck.reason },
        { status: 403 }
      );
    }

    // Data isolation: ADMIN can only promote users in their own institution
    if (adminUser.role === 'ADMIN' && adminUser.institutionId) {
      if (targetUser.institutionId && targetUser.institutionId !== adminUser.institutionId) {
        return NextResponse.json(
          { error: 'Unauthorized: You can only manage users in your own university.' },
          { status: 403 }
        );
      }
    }

    // Update user role in DB
    const updatedUser = await prisma.user.update({
      where: { clerkId: targetUserId },
      data: { role: newRole },
    });

    // Sync role change to Clerk org membership so Clerk and DB stay in sync
    const clerkOrgRole = APP_ROLE_TO_CLERK[newRole];
    if (clerkOrgRole && targetUser.clerkId) {
      if (targetUser.institution?.clerkOrgId) {
        await updateUserClerkOrgRole(targetUser.clerkId, targetUser.institution.clerkOrgId, clerkOrgRole)
          .catch((err) => console.error('[Promote] Failed to sync role to Clerk:', err));
      }
      const activeOrgId = targetUser.clerkOrgId;
      if (activeOrgId && activeOrgId !== targetUser.institution?.clerkOrgId) {
        await updateUserClerkOrgRole(targetUser.clerkId, activeOrgId, clerkOrgRole)
          .catch((err) => console.error('[Promote] Failed to sync role to Clerk (active org):', err));
      }
    }

    const action = `role changed to ${newRole}`;

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
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}