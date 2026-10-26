import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// POST: Student submits a request to change their institution
export async function POST(req: Request) {
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
    const { newInstitutionId, newProgrammeId, newYear, newPeriod, reason } = body;

    if (!newInstitutionId) {
      return NextResponse.json({ error: 'New institution is required' }, { status: 400 });
    }

    // Check if there's already a pending request
    const existingPending = await prisma.institutionChangeRequest.findFirst({
      where: { userId: user.id, status: 'PENDING' },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: 'You already have a pending institution change request. Please wait for it to be reviewed.' },
        { status: 409 }
      );
    }

    const request = await prisma.institutionChangeRequest.create({
      data: {
        userId: user.id,
        currentInstitutionId: user.institutionId,
        currentProgrammeId: user.programmeId,
        currentYear: user.year,
        currentPeriod: user.period,
        newInstitutionId,
        newProgrammeId,
        newYear,
        newPeriod,
        reason,
      },
      include: {
        newInstitution: { select: { name: true, shortName: true } },
        newProgramme: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, request }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/institution-change-request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create change request' },
      { status: 500 }
    );
  }
}

// GET: Student fetches their change request history
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

    const requests = await prisma.institutionChangeRequest.findMany({
      where: { userId: user.id },
      include: {
        currentInstitution: { select: { name: true, shortName: true } },
        newInstitution: { select: { name: true, shortName: true } },
        newProgramme: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('GET /api/institution-change-request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch change requests' },
      { status: 500 }
    );
  }
}
