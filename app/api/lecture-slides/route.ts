import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await requireAuth();
    const slides = await prisma.lectureSlide.findMany({
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { name: true, email: true } } },
    });
    return NextResponse.json(slides);
  } catch (error) {
    console.error('Error fetching lecture slides:', error);
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(['ADMIN']);
    const body = await req.json();
    const { title, description, embedUrl, order } = body;
    if (!title || !embedUrl) {
      return NextResponse.json({ error: 'Title and embed URL are required' }, { status: 400 });
    }
    const slide = await prisma.lectureSlide.create({
      data: {
        title,
        description,
        embedUrl,
        order: order || 0,
        createdBy: userId,
      },
    });
    return NextResponse.json(slide, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lecture slide:', error);
    return NextResponse.json({ error: 'Failed to create slide' }, { status: 500 });
  }
}