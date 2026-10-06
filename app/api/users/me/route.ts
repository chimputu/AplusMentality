import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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

    // Build update data
    const data: any = {};
    if (body.firstName !== undefined) data.firstName = body.firstName;
    if (body.lastName !== undefined) data.lastName = body.lastName;
    if (body.institutionId !== undefined) data.institutionId = body.institutionId || null;
    if (body.universityId !== undefined) data.universityId = body.universityId || null;
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

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
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
