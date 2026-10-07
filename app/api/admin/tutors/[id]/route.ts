import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — single tutor
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAuthUser(['ADMIN']);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tutor = await prisma.tutor.findUnique({
      where: { id },
      include: {
        university: { select: { code: true, name: true } },
        programme: { select: { name: true, shortName: true } },
        branch: { select: { name: true } },
        specialties: { include: { course: { select: { code: true, title: true } } } },
        requests: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!tutor) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(tutor);
  } catch (err) {
    console.error('Failed to get tutor:', err);
    return NextResponse.json({ error: 'Failed to get tutor' }, { status: 500 });
  }
}

// PUT — update tutor
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAuthUser(['ADMIN']);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const tutor = await prisma.tutor.update({
      where: { id },
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        bio: body.bio,
        universityId: body.universityId,
        programmeId: body.programmeId,
        branchId: body.branchId,
        yearsExperience: body.yearsExperience,
        availability: body.availability,
        mode: body.mode,
        isVerified: body.isVerified,
        isActive: body.isActive,
      },
      include: {
        specialties: { include: { course: { select: { code: true, title: true } } } },
      },
    });

    return NextResponse.json(tutor);
  } catch (err: any) {
    console.error('Failed to update tutor:', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update tutor' }, { status: 500 });
  }
}

// DELETE — delete tutor
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAuthUser(['ADMIN']);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.tutor.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete tutor:', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete tutor' }, { status: 500 });
  }
}
