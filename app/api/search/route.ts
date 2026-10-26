import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Search across courses, past papers, lecture slides, videos, and announcements
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const [courses, pastPapers, slides, videos, announcements] = await Promise.all([
      // Courses
      prisma.course.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, code: true, description: true },
        take: 10,
      }),
      // Past papers
      prisma.pastPaper.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, description: true, year: true },
        take: 10,
      }),
      // Lecture slides
      prisma.lectureSlide.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, description: true },
        take: 10,
      }),
      // Videos
      prisma.video.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, description: true },
        take: 10,
      }),
      // Announcements
      prisma.announcement.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, content: true, createdAt: true },
        take: 10,
      }),
    ]);

    const results = [
      ...courses.map((c) => ({ type: 'course', ...c })),
      ...pastPapers.map((p) => ({ type: 'pastPaper', ...p })),
      ...slides.map((s) => ({ type: 'lectureSlide', ...s })),
      ...videos.map((v) => ({ type: 'video', ...v })),
      ...announcements.map((a) => ({ type: 'announcement', ...a })),
    ];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('GET /api/search error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
