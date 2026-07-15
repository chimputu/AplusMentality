import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List all assignments
export async function GET() {
  try {
    await requireAuth();

    const assignments = await prisma.assignment.findMany({
      include: {
        creator: {
          select: { name: true, email: true },
        },
        submissions: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

// POST - Create a new assignment
export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth(['ADMIN']);
    const body = await req.json();
    const { title, description, embedUrl, formUrl, dueDate, maxScore } = body;

    if (!title || !embedUrl || !formUrl) {
      return NextResponse.json(
        { error: 'Title, embed URL, and form URL are required' },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        embedUrl,
        formUrl,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ? parseInt(maxScore) : null,
        createdBy: userId,
        isPublished: true,
      },
      include: {
        creator: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}