import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// POST: Lecturer creates a new quiz
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user || (user.role !== 'LECTURER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, courseId, timeLimit, questions } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Store questions as JSON in the description field for now
    // The Quiz model uses embedUrl/formUrl for Google Forms integration
    const quizData: any = {
      title,
      description: description || (questions ? JSON.stringify(questions) : null),
      embedUrl: '',
      formUrl: '',
      createdBy: userId,
    };
    if (courseId) quizData.courseId = courseId;

    const quiz = await prisma.quiz.create({
      data: quizData,
    });

    return NextResponse.json({ success: true, quiz }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/lecturer/quizzes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create quiz' },
      { status: 500 }
    );
  }
}
