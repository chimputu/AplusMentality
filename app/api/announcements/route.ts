import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Create announcement (Admin only)
export async function POST(req: NextRequest) {
  const { userId } = await requireAuth(['ADMIN']);
  const body = await req.json();
  const { title, content } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: 'Title and content are required' },
      { status: 400 }
    );
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      authorId: userId,
    },
    include: {
      author: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(announcement, { status: 201 });
}

// GET - All announcements (Any authenticated user)
export async function GET() {
  await requireAuth();

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(announcements);
}