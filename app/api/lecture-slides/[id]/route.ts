import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getScopeContext, isResourceInFullScope } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const scope = await getScopeContext();
    const slide = await prisma.lectureSlide.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, email: true } },
        course: { select: { id: true, title: true, code: true, universityId: true, year: true, period: true } },
      },
    });
    if (!slide) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // IDOR protection: check university, year, AND period match the user's scope
    if (!isResourceInFullScope(scope, slide.course)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(slide);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['ADMIN', 'SUPER_ADMIN']);
    const { id } = await params;
    const body = await req.json();
    const { title, description, embedUrl, fileUrl, contentType, order, category, courseId } = body;

    const slide = await prisma.lectureSlide.update({
      where: { id },
      data: {
        title,
        description,
        embedUrl: embedUrl || null,
        fileUrl: fileUrl || null,
        contentType: contentType || 'google_slides',
        order,
        category: category || null,
        courseId: courseId || null,
      },
    });
    return NextResponse.json(slide);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['ADMIN', 'SUPER_ADMIN']);
    const { id } = await params;
    await prisma.lectureSlide.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}