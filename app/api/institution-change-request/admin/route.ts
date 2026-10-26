import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Admin fetches all change requests with filters
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const requests = await prisma.institutionChangeRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            institutionId: true,
            programmeId: true,
            year: true,
            period: true,
          },
        },
        currentInstitution: { select: { id: true, name: true, shortName: true } },
        newInstitution: { select: { id: true, name: true, shortName: true } },
        currentProgramme: { select: { id: true, name: true } },
        newProgramme: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('GET /api/institution-change-request/admin error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch change requests' },
      { status: 500 }
    );
  }
}

// PATCH: Admin approves or rejects a change request
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, status: newStatus, adminNotes } = body;

    if (!requestId || !newStatus) {
      return NextResponse.json({ error: 'Request ID and status are required' }, { status: 400 });
    }

    if (!['APPROVED', 'REJECTED'].includes(newStatus)) {
      return NextResponse.json({ error: 'Status must be APPROVED or REJECTED' }, { status: 400 });
    }

    const request = await prisma.institutionChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        newInstitution: { select: { id: true, name: true, shortName: true } },
        newProgramme: { select: { id: true, name: true } },
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json({ error: `Request has already been ${request.status.toLowerCase()}` }, { status: 409 });
    }

    // Update the request status
    const updatedRequest = await prisma.institutionChangeRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        adminNotes,
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
      },
    });

    // If approved, update the student's institution
    if (newStatus === 'APPROVED') {
      const updateData: any = {};
      if (request.newInstitutionId) updateData.institutionId = request.newInstitutionId;
      if (request.newProgrammeId) updateData.programmeId = request.newProgrammeId;
      if (request.newYear !== null && request.newYear !== undefined) updateData.year = request.newYear;
      if (request.newPeriod) updateData.period = request.newPeriod;

      await prisma.user.update({
        where: { id: request.userId },
        data: updateData,
      });
    }

    // Create a notification for the student
    try {
      const notificationTitle = newStatus === 'APPROVED'
        ? 'Institution Change Approved'
        : 'Institution Change Rejected';
      const notificationDescription = newStatus === 'APPROVED'
        ? `Your request to change to ${request.newInstitution?.name || 'the new institution'} has been approved.`
        : `Your institution change request has been rejected. ${adminNotes ? `Admin notes: ${adminNotes}` : 'Contact an admin for more details.'}`;

      await prisma.notification.create({
        data: {
          userId: request.userId,
          type: 'INSTITUTION_CHANGE',
          title: notificationTitle,
          description: notificationDescription,
          isRead: false,
        },
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the whole operation if notification fails
    }

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error: any) {
    console.error('PATCH /api/institution-change-request/admin error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update change request' },
      { status: 500 }
    );
  }
}
