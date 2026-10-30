import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Create announcement (Admin or Super Admin only)
// ADMIN can only post to their own institution; SUPER_ADMIN can post globally or to any institution
export async function POST(req: NextRequest) {
  const { userId, role } = await requireAuth(['ADMIN', 'SUPER_ADMIN']);
  const body = await req.json();
  const { title, content, institutionId } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: 'Title and content are required' },
      { status: 400 }
    );
  }

  // Look up the author's institution
  const author = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { institutionId: true },
  });

  let announcementInstitutionId: string | null = null;

  if (role === 'SUPER_ADMIN') {
    // Super Admin can post globally (null) or to a specific institution
    announcementInstitutionId = institutionId ?? null;
  } else {
    // University Admin can only post to their own institution
    announcementInstitutionId = author?.institutionId ?? null;
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      authorId: userId,
      institutionId: announcementInstitutionId,
    },
    include: {
      author: {
        select: { name: true },
      },
      institution: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(announcement, { status: 201 });
}

// GET - Fetch announcements with institution scoping
// Students see announcements for their institution OR global announcements (institutionId = null)
// SUPER_ADMIN sees all announcements
// ADMIN sees announcements for their institution plus global ones
export async function GET(req: NextRequest) {
  const { userId, role } = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { institutionId: true, role: true },
  });

  const where: any = {};

  if (role === 'SUPER_ADMIN') {
    // Super Admin sees all announcements
  } else if (user?.institutionId) {
    // Students and University Admins see their institution's announcements + global ones
    where.OR = [
      { institutionId: user.institutionId },
      { institutionId: null },
    ];
  }

  const announcements = await prisma.announcement.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { name: true },
      },
      institution: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(announcements);
}