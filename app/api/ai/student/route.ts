import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { chatWithAI } from '@/lib/ai/openrouter';
import { buildStudentPrompt } from '@/lib/ai/prompts';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const student = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { university: true, programme: true, branch: true },
    });
    if (!student) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch attempts
    const attempts = await prisma.assessmentAttempt.findMany({
      where: { userId: student.id, submittedAt: { not: null } },
      include: {
        assessment: {
          include: { course: { select: { code: true, title: true } } },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    });

    // Fetch form responses
    const formResponses = await prisma.formResponse.findMany({
      where: { userId: student.id },
      include: {
        assessment: {
          include: { course: { select: { code: true, title: true } } },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    });

    // Fetch courses in scope with resources
    const courses = await prisma.course.findMany({
      where: {
        universityId: student.universityId!,
        programmeId: student.programmeId!,
        year: student.year!,
        ...(student.period && { period: student.period }),
      },
      include: {
        lectureSlides: { select: { id: true, title: true, order: true } },
        videos: { select: { id: true, title: true } },
        tutorialSheets: { select: { id: true, title: true } },
        assessments: { where: { isPublished: true }, select: { id: true, title: true, type: true } },
        pastPapers: { select: { id: true, title: true, year: true } },
      },
    });

    // Fetch tutors who teach those courses
    const courseIds = courses.map((c) => c.id);
    const tutors = await prisma.tutor.findMany({
      where: {
        isActive: true,
        specialties: { some: { courseId: { in: courseIds } } },
      },
      include: {
        specialties: {
          where: { courseId: { in: courseIds } },
          include: { course: { select: { code: true, title: true } } },
        },
      },
      take: 20,
    });

    // Convert Decimal rates to numbers for the prompt builder
    const tutorsForPrompt = tutors.map((t) => ({
      fullName: t.fullName,
      specialties: t.specialties.map((s) => ({
        course: s.course,
        personalRate: s.personalRate ? Number(s.personalRate) : null,
        groupRate: s.groupRate ? Number(s.groupRate) : null,
        personalEnabled: s.personalEnabled,
        groupEnabled: s.groupEnabled,
        currency: s.currency,
      })),
    }));

    const systemPrompt = buildStudentPrompt(student, {
      attempts,
      formResponses,
      courses,
      tutors: tutorsForPrompt,
    });

    const reply = await chatWithAI({
      systemPrompt,
      userMessage: message,
      maxTokens: 800,
    });

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Student AI error:', err);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
