import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { chatWithAI } from '@/lib/ai/openrouter';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { institution: true, programme: true },
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

    // Fetch courses in scope
    const courses = await prisma.course.findMany({
      where: {
        programmeId: student.programmeId!,
        year: student.year!,
        ...(student.period && { period: student.period }),
      },
      include: {
        lectureSlides: { select: { id: true, title: true, order: true } },
        videos: { select: { id: true, title: true } },
        assessments: { where: { isPublished: true }, select: { id: true, title: true, type: true } },
      },
    });

    const systemPrompt = `You are an AI insights generator for A+ Mentality.
Student: ${student.name || 'Student'} at ${student.institution?.name || 'Unknown'}, ${student.programme?.shortName || student.programme?.name || 'Unknown'}.

Based on their data, generate 3-5 insight cards as a JSON array.
Each card has: { "type": "warning"|"success"|"tip", "title": "...", "description": "...", "action": { "label": "...", "href": "..." } }

Performance data:
${attempts.map((a) => `- ${a.assessment.course.code}: ${a.percentage ?? 'N/A'}% ${a.passed ? 'passed' : a.passed === false ? 'failed' : 'pending'}`).join('\n') || 'No attempts yet'}

Courses: ${courses.map((c) => c.code).join(', ') || 'None'}

Return ONLY the JSON array, no other text.`;

    const reply = await chatWithAI({
      systemPrompt,
      messages: [{ role: 'user', content: 'Generate insight cards for this student.' }],
      maxTokens: 1000,
    });

    // Parse the JSON from the reply
    let insights: Array<{
      type: string;
      title: string;
      description: string;
      action?: { label: string; href: string };
    }> = [];

    try {
      // Try to extract JSON from the response
      const jsonMatch = reply.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error('Failed to parse AI insights:', reply);
    }

    return NextResponse.json({ insights });
  } catch (err) {
    console.error('AI insights error:', err);
    return NextResponse.json(
      { error: 'Failed to generate insights', insights: [] },
      { status: 500 }
    );
  }
}
