import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { uploadTutorImage, deleteTutorImage } from '@/lib/actions/tutor-image';

// POST — upload tutor profile image
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user is admin
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const result = await uploadTutorImage(formData);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Upload error:', err);
    const status = err.message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status });
  }
}

// DELETE — remove tutor profile image
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user is admin
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tutorId = searchParams.get('tutorId');
    if (!tutorId) {
      return NextResponse.json({ error: 'Tutor ID is required' }, { status: 400 });
    }

    const result = await deleteTutorImage(tutorId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Delete error:', err);
    const status = err.message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status });
  }
}
