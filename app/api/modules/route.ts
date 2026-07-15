import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List all modules for a course
export async function GET(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const modules = await prisma.module.findMany({
      where: { courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            video: true,
            slides: true,
            quiz: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}

// POST - Create a new module
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(['ADMIN']);
    const body = await req.json();
    const { title, description, order, courseId } = body;

    if (!title || !courseId) {
      return NextResponse.json(
        { error: 'Title and course ID are required' },
        { status: 400 }
      );
    }

    // Check if user owns the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { createdBy: true },
    });

    if (!course || course.createdBy !== userId) {
      return NextResponse.json(
        { error: 'You can only add modules to your own courses' },
        { status: 403 }
      );
    }

    // Get the highest order number
    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });

    const module = await prisma.module.create({
      data: {
        title,
        description,
        order: order ?? (lastModule ? lastModule.order + 1 : 0),
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(module, { status: 201 });
  } catch (error: any) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    );
  }
}

// PUT - Update a module
export async function PUT(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const body = await req.json();
    const { id, title, description, order } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Module ID is required' },
        { status: 400 }
      );
    }

    const module = await prisma.module.update({
      where: { id },
      data: {
        title,
        description,
        order,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            video: true,
            slides: true,
            quiz: true,
          },
        },
      },
    });

    return NextResponse.json(module);
  } catch (error: any) {
    console.error('Error updating module:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a module
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Module ID is required' },
        { status: 400 }
      );
    }

    await prisma.module.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Module deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting module:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete module' },
      { status: 500 }
    );
  }
}