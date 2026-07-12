import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([], { status: 200 });
    }

    // Search announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    // Search videos
    const videos = await prisma.video.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    // Format results
    const results = [
      ...announcements.map((a) => ({
        ...a,
        type: 'announcement',
      })),
      ...videos.map((v) => ({
        id: v.id,
        title: v.title,
        content: v.description,
        type: 'video',
      })),
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json([], { status: 200 });
  }
}