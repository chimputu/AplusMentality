import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { APP_ROLE_TO_CLERK } from '@/lib/clerk-org';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireApiRole(['ADMIN', 'SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;

    const { user: adminUser } = authResult;
    const body = await req.json();
    const { email, role } = body as { email?: string; role?: string };

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Security: Block ADMIN from inviting ADMIN or SUPER_ADMIN
    if (adminUser.role === 'ADMIN' && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized: You cannot invite users with equal or higher privileges.' },
        { status: 403 }
      );
    }

    // Resolve the institution's Clerk org ID
    let clerkOrgId: string | null = null;

    if (adminUser.role === 'ADMIN') {
      // ADMIN invites to their own institution
      if (!adminUser.institutionId) {
        return NextResponse.json(
          { error: 'Your institution is not configured.' },
          { status: 400 }
        );
      }
      const institution = await prisma.university.findUnique({
        where: { id: adminUser.institutionId },
        select: { clerkOrgId: true },
      });
      if (!institution?.clerkOrgId) {
        return NextResponse.json(
          { error: 'No Clerk organization configured for your institution.' },
          { status: 400 }
        );
      }
      clerkOrgId = institution.clerkOrgId;
    } else {
      // SUPER_ADMIN: invite to the first active institution's org, or require institutionId in body
      const targetInstitutionId = (body as { institutionId?: string }).institutionId;
      if (targetInstitutionId) {
        const institution = await prisma.university.findUnique({
          where: { id: targetInstitutionId },
          select: { clerkOrgId: true },
        });
        if (!institution?.clerkOrgId) {
          return NextResponse.json(
            { error: 'No Clerk organization configured for the target institution.' },
            { status: 400 }
          );
        }
        clerkOrgId = institution.clerkOrgId;
      } else {
        // Default to first active institution
        const firstInstitution = await prisma.university.findFirst({
          where: { isActive: true, clerkOrgId: { not: null } },
          select: { clerkOrgId: true },
        });
        if (!firstInstitution?.clerkOrgId) {
          return NextResponse.json(
            { error: 'No Clerk organization available. Please specify an institution.' },
            { status: 400 }
          );
        }
        clerkOrgId = firstInstitution.clerkOrgId;
      }
    }

    // Map app role to Clerk org role
    const clerkRole = APP_ROLE_TO_CLERK[role];
    if (!clerkRole) {
      return NextResponse.json(
        { error: `Invalid role: ${role}` },
        { status: 400 }
      );
    }

    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin`;

    // Call Clerk API to create invitation
    const response = await fetch(
      `https://api.clerk.com/v1/organizations/${clerkOrgId}/invitations`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          role: clerkRole,
          redirect_url: redirectUrl,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Invite] Clerk API error:', errorText);
      return NextResponse.json(
        { error: `Failed to send invitation: ${errorText}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      invitationUrl: data.url,
      emailSent: true,
    });
  } catch (error: any) {
    console.error('[Invite] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
