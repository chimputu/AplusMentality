import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth(['ADMIN']);

  const { id } = await params;

  const video = await prisma.video.findUnique({
    where: { id },
  });

  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(video.cloudinaryId, {
      resource_type: 'video',
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Continue with database deletion even if Cloudinary fails
  }

  // Delete from database
  await prisma.video.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}