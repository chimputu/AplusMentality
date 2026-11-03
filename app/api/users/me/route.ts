import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { addUserToClerkOrg, APP_ROLE_TO_CLERK } from '@/lib/clerk-org';

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();

    // Block students from changing institution after onboarding
    if (user.onboarded && user.role === 'STUDENT') {
      const blockedFields = ['institutionId', 'programmeId', 'branchId'];
      for (const field of blockedFields) {
        if (body[field] !== undefined) {
          return NextResponse.json(
            { error: `Cannot change ${field} after onboarding. Contact an admin to update your institution.` },
            { status: 403 }
          );
        }
      }
    }

    // Only super admins can change user roles
    if (body.role !== undefined && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only super admins can change user roles.' },
        { status: 403 }
      );
    }

    // Build update data
    const data: any = {};
    if (body.firstName !== undefined) data.firstName = body.firstName;
    if (body.lastName !== undefined) data.lastName = body.lastName;
    if (body.institutionId !== undefined) data.institutionId = body.institutionId || null;
    if (body.programmeId !== undefined) data.programmeId = body.programmeId || null;
    if (body.branchId !== undefined) data.branchId = body.branchId || null;
    if (body.year !== undefined) data.year = body.year;
    if (body.period !== undefined) data.period = body.period;
    if (body.onboarded !== undefined) data.onboarded = body.onboarded;
    if (body.role !== undefined) data.role = body.role;

    const updated = await prisma.user.update({
      where: { clerkId: userId },
      data,
    });

    // If onboarding just completed, add the user to their institution's Clerk organization
    if (body.onboarded === true && body.institutionId) {
      const inst = await prisma.university.findUnique({
        where: { id: body.institutionId },
        select: { clerkOrgId: true },
      });
      const clerkOrgId = inst?.clerkOrgId ?? null;
      if (!clerkOrgId) {
        console.warn(
          `[Onboarding] User ${userId} joined institution ${body.institutionId} but no clerkOrgId found. Clerk org membership not created.`
        );
      }

      if (clerkOrgId) {
        const appRole = updated.role || 'STUDENT';
        const clerkRole = APP_ROLE_TO_CLERK[appRole] || 'org:member';

        // Fire-and-forget: if Clerk API fails, onboarding still succeeds
        addUserToClerkOrg(userId, clerkOrgId, clerkRole).catch((err) => {
          console.error('[Onboarding] Failed to add user to Clerk org:', err);
        });

        // User added to Clerk org on onboarding completion
      }
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error('PATCH /api/users/me error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        institution: { select: { name: true } },
        programme: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('GET /api/users/me error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
