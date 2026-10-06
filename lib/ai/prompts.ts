export function buildPublicPrompt(): string {
  return `You are the A+ Mentality assistant.

You help visitors understand the platform:
- What is A+ Mentality
- Features (courses, tutors, AI, assessments)
- How to sign up
- Supported universities
- Pricing

You do NOT have access to any personal data.
If someone asks about their performance, tell them to sign in.

Keep answers short, friendly, encouraging.`;
}

interface BuildStudentPromptData {
  attempts: Array<{
    assessment: { course: { code: string; title: string } };
    score: number | null;
    percentage: number | null;
    passed: boolean | null;
    submittedAt: Date | null;
  }>;
  formResponses: Array<{
    assessment: { course: { code: string; title: string } };
    score: number | null;
    status: string;
    submittedAt: Date | null;
  }>;
  courses: Array<{
    code: string;
    title: string;
    lectureSlides: Array<{ id: string; title: string; order: number }>;
    videos: Array<{ id: string; title: string }>;
    tutorialSheets: Array<{ id: string; title: string }>;
    assessments: Array<{ id: string; title: string; type: string }>;
    pastPapers: Array<{ id: string; title: string; year: number | null }>;
  }>;
  tutors: Array<{
    fullName: string;
    specialties: Array<{
      course: { code: string; title: string };
      personalRate: number | null;
      groupRate: number | null;
      personalEnabled: boolean;
      groupEnabled: boolean;
      currency: string;
    }>;
  }>;
}

export function buildStudentPrompt(
  student: {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    university?: { name: string; code: string } | null;
    programme?: { name: string; shortName?: string | null } | null;
    year?: number | null;
  },
  data: BuildStudentPromptData
): string {
  const name = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
  const uni = student.university?.name || 'Unknown';
  const prog = student.programme?.shortName || student.programme?.name || 'Unknown';
  const year = student.year ? `Year ${student.year}` : 'Unknown';

  let prompt = `You are ${name}'s academic advisor at A+ Mentality.

Student Profile:
- Name: ${name}
- University: ${uni}
- Programme: ${prog}
- ${year}

Your job:
1. Analyze their scores
2. Identify weak areas (< 60%)
3. Recommend specific resources (name them)
4. Suggest tutors if struggling (name + rate)
5. Give actionable study plans
6. Be encouraging, mentor-like
7. Never leak other students' data
8. Stay within their academic scope`;

  // Attempts
  if (data.attempts.length > 0) {
    prompt += '\n\nPerformance Data:';
    data.attempts.forEach((a) => {
      const course = a.assessment.course;
      const pct = a.percentage ?? 'N/A';
      const status = a.passed ? '✓' : a.passed === false ? '✗' : '—';
      prompt += `\n- ${course.code}: ${pct}% ${status}`;
    });
  }

  // Courses with resources
  if (data.courses.length > 0) {
    prompt += '\n\nAvailable Resources:';
    data.courses.forEach((c) => {
      prompt += `\n- ${c.code} ${c.title}:`;
      if (c.videos.length) prompt += ` Videos(${c.videos.length})`;
      if (c.lectureSlides.length) prompt += ` Slides(${c.lectureSlides.length})`;
      if (c.tutorialSheets.length) prompt += ` Tutorials(${c.tutorialSheets.length})`;
      if (c.assessments.length) prompt += ` Assessments(${c.assessments.length})`;
      if (c.pastPapers.length) prompt += ` PastPapers(${c.pastPapers.length})`;
    });
  }

  // Tutors
  if (data.tutors.length > 0) {
    prompt += '\n\nAvailable Tutors:';
    data.tutors.forEach((t) => {
      t.specialties.forEach((s) => {
        const rate = s.personalEnabled && s.personalRate
          ? `${s.currency} ${s.personalRate}/hr personal`
          : s.groupEnabled && s.groupRate
          ? `${s.currency} ${s.groupRate}/hr group`
          : 'Contact for rate';
        prompt += `\n- ${t.fullName} — ${s.course.code}: ${rate}`;
      });
    });
  }

  return prompt;
}
