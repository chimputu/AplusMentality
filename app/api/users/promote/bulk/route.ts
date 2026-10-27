import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma/client';
import { updateUserClerkOrgRole, APP_ROLE_TO_CLERK } from '@/lib/clerk-org';

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

    const validRoles = Object.values(Role);
    if (!newRole || !validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: `Valid role is required. Allowed: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const clerkOrgRole = APP_ROLE_TO_CLERK[newRole];

    // Update all users in DB, then sync each to Clerk
    const updatePromises = userIds.map(async (userId) => {
      const user = await prisma.user.update({
        where: { clerkId: userId },
        data: { role: newRole },
        include: { institution: { select: { clerkOrgId: true } } },
      });

      // Sync to Clerk org membership
      if (clerkOrgRole && user.clerkId) {
        if (user.institution?.clerkOrgId) {
          await updateUserClerkOrgRole(user.clerkId, user.institution.clerkOrgId, clerkOrgRole)
            .catch((err) => console.error('[BulkPromote] Failed to sync role to Clerk:', err));
        }
        const activeOrgId = user.clerkOrgId;
        if (activeOrgId && activeOrgId !== user.institution?.clerkOrgId) {
          await updateUserClerkOrgRole(user.clerkId, activeOrgId, clerkOrgRole)
            .catch((err) => console.error('[BulkPromote] Failed to sync role to Clerk (active org):', err));
        }
      }

      return user;
    });

    const updatedUsers = await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `${updatedUsers.length} users role changed to ${newRole}`,
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