import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get a single user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await requireAuth();
    const { id } = await params;

    // Users can only view themselves unless admin
    if (role !== 'ADMIN' && id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: id },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            courses: true,
            announcements: true,
            videos: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT - Update a user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    console.log('🔵 PUT request received:', { id, userId, role, body });

    // Only admins can change roles
    if (body.role && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can change roles' },
        { status: 403 }
      );
    }

    // Users can only update themselves unless admin
    if (role !== 'ADMIN' && id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: id },
    });

    if (!existingUser) {
      console.log('❌ User not found:', id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { clerkId: id },
      data: {
        name: body.name,
        role: body.role,
      },
    });

    console.log('✅ User updated:', updatedUser);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        clerkId: updatedUser.clerkId,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['ADMIN']);
    const { id } = await params;

    const user = await prisma.user.delete({
      where: { clerkId: id },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}