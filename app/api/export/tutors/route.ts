import { requireAuth } from '@/lib/auth';
import { getOrgScope } from '@/lib/auth/org-scope';
import { prisma } from '@/lib/prisma';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET() {
  try {
    const { role, userId } = await requireAuth(['ADMIN', 'SUPER_ADMIN', 'LECTURER', 'TUTOR']);
  if (!['ADMIN', 'SUPER_ADMIN', 'LECTURER', 'TUTOR'].includes(role)) {
    return new Response('Unauthorized', { status: 403 });
  }

  let scope: any = null;
  try {
    scope = await getOrgScope();
  } catch {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { institutionId: true, institution: { select: { name: true, shortName: true } } },
    });
    if (!user?.institutionId) {
      return new Response('No institution found for this user', { status: 400 });
    }
    scope = {
      institutionId: user.institutionId,
      institutionName: user.institution?.name || 'Unknown',
      shortName: user.institution?.shortName || 'UNI',
      isSuperAdmin: role === 'SUPER_ADMIN',
    };
  }

  // Fetch institution shortName
  let shortName = scope.shortName;
  if (!shortName) {
    const inst = await prisma.institution.findUnique({
      where: { id: scope.institutionId },
      select: { shortName: true, name: true },
    });
    shortName = inst?.shortName || inst?.name || 'UNI';
  }

  // For Tutor model, we need to map institutionId to universityId
  // The Tutor uses universityId which links to University model
  // We need to find tutors associated with this institution
  let tutors: any[] = [];

  if (scope.isSuperAdmin) {
    // SUPER_ADMIN can see all tutors
    tutors = await prisma.tutor.findMany({
      include: {
        specialties: { include: { course: { select: { code: true, title: true } } } },
        university: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    // ADMIN: scope to their institution
    // Tutors have universityId, but we need to match by institution
    // Fetch the institution's associated university or match by name
    const institution = await prisma.institution.findUnique({
      where: { id: scope.institutionId },
      select: { name: true, slug: true },
    });

    // Find tutors by matching university name to institution name
    if (institution) {
      tutors = await prisma.tutor.findMany({
        where: {
          university: { name: institution.name },
        },
        include: {
          specialties: { include: { course: { select: { code: true, title: true } } } },
          university: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  const doc = new jsPDF({ orientation: 'landscape' });

  // Header bar
  doc.setFillColor(49, 51, 63);
  doc.rect(0, 0, 297, 35, 'F');

  // Title
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(`A+ Mentality — ${scope.institutionName}`, 14, 15);

  doc.setFontSize(12);
  doc.setTextColor(200, 200, 200);
  doc.text('Tutor Roster', 14, 23);

  // Date and count
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Generated: ${dateStr}`, 14, 30);
  doc.text(`Total Tutors: ${tutors.length}`, 230, 30);

  // Table
  const tableData = tutors.map((tutor) => {
    const courses = tutor.specialties
      .map((s: any) => s.course.code)
      .join(', ');
    return [
      tutor.fullName,
      tutor.email,
      courses || '—',
      tutor.isActive ? 'Active' : 'Inactive',
      tutor.isVerified ? 'Verified' : 'Pending',
      tutor.university?.name || '—',
    ];
  });

  autoTable(doc, {
    startY: 42,
    head: [['Name', 'Email', 'Assigned Courses', 'Status', 'Verified', 'University']],
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

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`A+ Mentality © ${new Date().getFullYear()} — ${scope.institutionName} Tutor Roster`, 14, finalY);

  // Dynamic filename
  const filenameShort = shortName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateFile = new Date().toISOString().split('T')[0];
  const filename = `${filenameShort}_Tutors_Report_${dateFile}.pdf`;

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
  } catch (error) {
    console.error('[Tutors Export] PDF generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
