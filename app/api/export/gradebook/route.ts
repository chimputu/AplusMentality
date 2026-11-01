import { requireAuth } from '@/lib/auth';
import { getOrgScope } from '@/lib/auth/org-scope';
import { prisma } from '@/lib/prisma';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(request: Request) {
  try {
    const { role, userId } = await requireAuth(['ADMIN', 'SUPER_ADMIN', 'LECTURER', 'TUTOR']);
  if (!['ADMIN', 'SUPER_ADMIN', 'LECTURER', 'TUTOR'].includes(role)) {
    return new Response('Unauthorized', { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get('assignmentId');

  if (!assignmentId) {
    return new Response('Missing assignmentId parameter', { status: 400 });
  }

  // Fetch the assignment with course info
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          title: true,
          tutorId: true,
          programme: { select: { institutionId: true } },
        },
      },
    },
  });

  if (!assignment) {
    return new Response('Assignment not found', { status: 404 });
  }

  // Ownership checks
  if (role === 'TUTOR') {
    // Tutors can only export gradebooks for assignments in courses they teach
    if (!assignment.course?.tutorId) {
      return new Response('Unauthorized: No tutor assigned to this course', { status: 403 });
    }
    // Check if the tutor is assigned to this course
    const tutor = await prisma.tutor.findFirst({
      where: { userId: assignment.course.tutorId },
    });
    if (!tutor) {
      return new Response('Unauthorized: You do not teach this course', { status: 403 });
    }
  } else if (role === 'ADMIN' || role === 'LECTURER') {
    // ADMIN and LECTURER need institution scope
    try {
      const scope = await getOrgScope();
      if (!scope.isSuperAdmin) {
        // Check if the assignment's course belongs to this institution
        const course = assignment.course;
        if (course) {
          const courseFull = await prisma.course.findUnique({
            where: { id: course.id },
            select: { programme: { select: { institutionId: true } } },
          });
          // For ADMIN/LECTURER, verify the course is in their institution
          // by checking if the institution matches
          if (courseFull?.programme?.institutionId) {
            // If course institution doesn't match scope institution, block access
            if (courseFull.programme.institutionId !== scope.institutionId) {
              return new Response('Unauthorized: This assignment is not in your institution', { status: 403 });
            }
          }
        }
      }
    } catch {
      return new Response('Unauthorized: Could not verify institution access', { status: 403 });
    }
  }

  // Fetch all submissions for this assignment
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { submittedAt: 'asc' },
  });

  const course = assignment.course;
  const courseName = course?.title || 'Unknown Course';
  const courseCode = course?.code || 'UNK';
  const assignmentTitle = assignment.title;

  const doc = new jsPDF({ orientation: 'landscape' });

  // Header bar
  doc.setFillColor(49, 51, 63);
  doc.rect(0, 0, 297, 35, 'F');

  // Title
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(`A+ Mentality — ${courseName}`, 14, 15);

  doc.setFontSize(12);
  doc.setTextColor(200, 200, 200);
  doc.text(`${assignmentTitle} — Gradebook`, 14, 23);

  // Date and count
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Generated: ${dateStr}`, 14, 30);
  doc.text(`Total Submissions: ${submissions.length}`, 230, 30);

  // Calculate class average
  let classAverage = 0;
  const gradedSubmissions = submissions.filter((s) => s.score !== null && s.total !== null);
  if (gradedSubmissions.length > 0) {
    const totalPercentage = gradedSubmissions.reduce((sum, s) => {
      const score = s.score || 0;
      const total = s.total || 1;
      return sum + (score / total) * 100;
    }, 0);
    classAverage = Math.round((totalPercentage / gradedSubmissions.length) * 100) / 100;
  }

  // Table
  const tableData = submissions.map((sub) => {
    const score = sub.score ?? 0;
    const total = sub.total ?? assignment.maxScore ?? 100;
    const percentage = total > 0 ? Math.round((score / total) * 10000) / 100 : 0;
    return [
      sub.user.name || sub.user.email,
      assignmentTitle,
      score.toString(),
      total.toString(),
      `${percentage}%`,
    ];
  });

  autoTable(doc, {
    startY: 42,
    head: [['Student Name', 'Assignment', 'Score', 'Max Marks', 'Percentage']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [49, 51, 63],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { fontSize: 8 },
  });

  // Footer with class average
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setTextColor(49, 51, 63);
  doc.text(`Class Average: ${classAverage}%`, 14, finalY);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `A+ Mentality © ${new Date().getFullYear()} — ${courseCode} Gradebook`,
    14,
    finalY + 7
  );

  // Dynamic filename
  const safeAssignmentTitle = assignmentTitle.replace(/[^a-zA-Z0-9]/g, '_');
  const dateFile = new Date().toISOString().split('T')[0];
  const filename = `${courseCode}_Gradebook_${safeAssignmentTitle}_${dateFile}.pdf`;

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
  } catch (error) {
    console.error('[Gradebook Export] PDF generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
