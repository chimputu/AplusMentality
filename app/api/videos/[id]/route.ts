import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getAuthUser } from '@/lib/auth';
import { isResourceInFullScopeFromUser } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';

// GET - Get a single video (with IDOR protection)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { name: true, email: true },
        },
        course: {
          select: {
            id: true,
            title: true,
            universityId: true,
            year: true,
            period: true,
          },
        },
        lessons: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // IDOR protection: check university, year, AND period match the user's scope
    if (!isResourceInFullScopeFromUser(authUser.user, video.course)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}

// PUT - Update a video
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Changed to Promise
) {
  try {
    await requireAuth(['ADMIN']);
    const { id } = await params;  // ✅ Added await
    const body = await req.json();
    const { title, description, thumbnail } = body;

    const video = await prisma.video.update({
      where: { id },
      data: {
        title,
        description,
        thumbnail,
      },
      include: {
        uploader: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(video);
  } catch (error: any) {
    console.error('Error updating video:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update video' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a video
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Changed to Promise
) {
  try {
    await requireAuth(['ADMIN']);
    const { id } = await params;  // ✅ Added await

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Delete from database
    await prisma.video.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting video:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete video' },
      { status: 500 }
    );
  }
}