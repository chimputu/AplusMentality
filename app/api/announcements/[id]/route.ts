import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Note: params is a Promise
) {
  await requireAuth(['ADMIN']);

  // ✅ Await the params to get the id
  const { id } = await params;

  await prisma.announcement.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}