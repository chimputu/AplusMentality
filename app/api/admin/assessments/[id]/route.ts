// app/api/admin/assessments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — single assessment (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(['ADMIN', 'SUPER_ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        questions: { orderBy: { order: 'asc' } },
        _count: {
          select: {
            attempts: true,
            formResponses: true,
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('[admin/assessments/[id] GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}

// PUT — update an assessment (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(['ADMIN', 'SUPER_ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const { questions, ...updateData } = body;

    // Build update data with proper date parsing
    const data: any = { ...updateData };
    if (data.openAt) data.openAt = new Date(data.openAt);
    if (data.closeAt) data.closeAt = new Date(data.closeAt);
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.resultsReleasedAt) data.resultsReleasedAt = new Date(data.resultsReleasedAt);

    // Handle questions update if provided
    if (questions !== undefined) {
      // Delete existing questions
      await prisma.question.deleteMany({ where: { assessmentId: id } });

      // Create new questions
      for (const q of questions) {
        await prisma.question.create({
          data: {
            assessmentId: id,
            order: q.order ?? 0,
            type: q.type,
            prompt: q.prompt,
            imageUrl: q.imageUrl,
            options: q.options,
            correctId: q.correctId,
            correctText: q.correctText,
            points: q.points ?? 1,
            explanation: q.explanation,
          },
        });
      }
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        questions: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[admin/assessments/[id] PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

// DELETE — delete an assessment (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(['ADMIN', 'SUPER_ADMIN']);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.assessment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/assessments/[id] DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}
