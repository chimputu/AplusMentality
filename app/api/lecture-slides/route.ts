import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(); // any authenticated user
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const category = searchParams.get('category');

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (category) where.category = category;

    const slides = await prisma.lectureSlide.findMany({
      where,
      include: {
        creator: { select: { name: true } },
        course: { select: { id: true, title: true, code: true } },
      },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(slides);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(['ADMIN']);
    const body = await req.json();
    const { title, description, embedUrl, fileUrl, contentType, order, category, courseId } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (contentType === 'google_slides' && !embedUrl) {
      return NextResponse.json({ error: 'Embed URL is required for Google Slides' }, { status: 400 });
    }
    if (contentType === 'pdf' && !fileUrl) {
      return NextResponse.json({ error: 'File URL is required for PDF' }, { status: 400 });
    }

    const slide = await prisma.lectureSlide.create({
      data: {
        title,
        description,
        embedUrl: embedUrl || null,
        fileUrl: fileUrl || null,
        contentType: contentType || 'google_slides',
        order: order || 0,
        category: category || null,
        courseId: courseId || null,
        createdBy: userId,
      },
    });
    return NextResponse.json(slide, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create slide' }, { status: 500 });
  }
}