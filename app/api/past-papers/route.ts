// app/api/past-papers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — list past papers (optional filters: category, courseCode, year)
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const courseCode = searchParams.get('courseCode');
    const year = searchParams.get('year');

    const where: any = {};
    if (category) where.category = category;
    if (courseCode) where.courseCode = courseCode;
    if (year) where.year = parseInt(year);

    const papers = await prisma.pastPaper.findMany({
      where,
      include: {
        creator: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(papers);
  } catch (error) {
    console.error('[past-papers GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch past papers' },
      { status: 500 }
    );
  }
}

// POST — create a past paper (admin)
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
      courseCode,
      year,
      semester,
      category,
      fileUrl,
      fileType,
      fileSize,
    } = body;

    if (!title || !fileUrl) {
      return NextResponse.json(
        { error: 'Title and file URL are required' },
        { status: 400 }
      );
    }

    const paper = await prisma.pastPaper.create({
      data: {
        title,
        description: description || null,
        courseCode: courseCode || null,
        year: year ? parseInt(String(year)) : null,
        semester: semester || null,
        category: category || 'final_exam',
        fileUrl,
        fileType: fileType || null,
        fileSize: fileSize ? parseInt(String(fileSize)) : null,
        createdBy: auth.userId,
      },
    });

    return NextResponse.json(paper, { status: 201 });
  } catch (error: any) {
    console.error('[past-papers POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create past paper' },
      { status: 500 }
    );
  }
}