import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateUserClerkOrgRole, APP_ROLE_TO_CLERK } from '@/lib/clerk-org';

// POST - Sync a user's Prisma role to their Clerk org membership
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId, role } = await requireAuth();

    // Only admins can sync roles
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId: targetClerkId } = body;

    if (!targetClerkId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: targetClerkId },
      include: {
        institution: { select: { clerkOrgId: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const clerkOrgRole = APP_ROLE_TO_CLERK[user.role];
    if (!clerkOrgRole) {
      return NextResponse.json(
        { error: `No Clerk role mapping for ${user.role}` },
        { status: 400 }
      );
    }

    let synced = false;

    // Sync to institution org
    if (user.institution?.clerkOrgId) {
      const result = await updateUserClerkOrgRole(
        user.clerkId,
        user.institution.clerkOrgId,
        clerkOrgRole,
      );
      if (result.success) synced = true;
    }

    // Sync to user's active org if different
    const activeOrgId = user.clerkOrgId;
    if (activeOrgId && activeOrgId !== user.institution?.clerkOrgId) {
      const result = await updateUserClerkOrgRole(user.clerkId, activeOrgId, clerkOrgRole);
      if (result.success) synced = true;
    }

    return NextResponse.json({
      success: true,
      role: user.role,
      synced,
    });
  } catch (error: any) {
    console.error('Sync role error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync role' },
      { status: 500 }
    );
  }
}
