import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Promise
) {
  try {
    const { userId, role } = await requireAuth();
    const { id } = await params;  // ✅ Await

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Promise
) {
  try {
    const { userId, role } = await requireAuth();
    const { id } = await params;  // ✅ Await
    const body = await req.json();

    if (body.role && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can change roles' },
        { status: 403 }
      );
    }

    if (role !== 'ADMIN' && id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const user = await prisma.user.update({
      where: { clerkId: id },
      data: {
        name: body.name,
        role: body.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Promise
) {
  try {
    await requireAuth(['ADMIN']);
    const { id } = await params;  // ✅ Await

    await prisma.user.delete({
      where: { clerkId: id },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}