// app/api/lecture-slides/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List lecture slides
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const category = searchParams.get('category');

    // ⭐ THE FIX: only filter if the param is provided
    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (category) where.category = category;

    const slides = await prisma.lectureSlide.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        course: { select: { id: true, title: true, code: true } },
        creator: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(slides);
  } catch (error) {
    console.error('[lecture-slides GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lecture slides' },
      { status: 500 }
    );
  }
}

// POST - Create a lecture slide (admin)
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(['ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      embedUrl,
      fileUrl,
      contentType,
      order,
      category,
      courseId,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const slide = await prisma.lectureSlide.create({
      data: {
        title,
        description: description || null,
        embedUrl: embedUrl || null,
        fileUrl: fileUrl || null,
        contentType: contentType || null,
        order: order ? parseInt(String(order)) : 0,
        category: category || null,
        courseId: courseId || null,
        createdBy: auth.userId,
      },
    });

    return NextResponse.json(slide, { status: 201 });
  } catch (error: any) {
    console.error('[lecture-slides POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create lecture slide' },
      { status: 500 }
    );
  }
}