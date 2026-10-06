import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// POST — send tutor request
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!student) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { courseNeeded, sessionType, quotedRate, preferredAt, message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const tutor = await prisma.tutor.findUnique({ where: { id } });
    if (!tutor || !tutor.isActive) {
      return NextResponse.json({ error: 'Tutor not found or inactive' }, { status: 404 });
    }

    const request = await prisma.tutorRequest.create({
      data: {
        tutorId: id,
        studentId: student.id,
        studentName: student.name || student.email,
        studentEmail: student.email,
        studentPhone: body.studentPhone,
        courseNeeded,
        sessionType: sessionType || 'PERSONAL',
        quotedRate: quotedRate ? parseFloat(quotedRate) : null,
        preferredAt,
        message,
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (err) {
    console.error('Failed to create tutor request:', err);
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
  }
}
