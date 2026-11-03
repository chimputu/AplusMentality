import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, requireAuth } from '@/lib/auth';
import { isResourceInFullScopeFromUser } from '@/lib/auth/scope';
import { prisma } from '@/lib/prisma';

// GET - Get a single assignment
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Promise
) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;  // ✅ Await

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        creator: {
          select: { name: true, email: true },
        },
        course: {
          select: {
            year: true,
            period: true,
            programme: {
              select: { institutionId: true },
            },
          },
        },
        submissions: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // IDOR protection: verify the user has access to this assignment's course
    if (!isResourceInFullScopeFromUser(auth.user, assignment.course)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

// PUT - Update an assignment
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Promise
) {
  try {
    await requireAuth(['ADMIN', 'SUPER_ADMIN']);
    const { id } = await params;  // ✅ Await
    const body = await req.json();

    const assignment = await prisma.assignment.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(assignment);
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an assignment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Promise
) {
  try {
    await requireAuth(['ADMIN', 'SUPER_ADMIN']);
    const { id } = await params;  // ✅ Await

    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}