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
      // If no org scope, fall back to user's institution
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

    // Fetch institution shortName if not already available
    let shortName = scope.shortName;
    if (!shortName) {
      const inst = await prisma.university.findUnique({
        where: { id: scope.institutionId },
        select: { shortName: true, name: true },
      });
      shortName = inst?.shortName || inst?.name || 'UNI';
    }

    // Build query
    const where: any = { role: 'STUDENT' };
    if (!scope.isSuperAdmin) {
      where.institutionId = scope.institutionId;
    }

    const students = await prisma.user.findMany({
      where,
      select: {
        name: true,
        email: true,
        programme: { select: { name: true } },
        year: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

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
    doc.text('Enrolled Students Report', 14, 23);

    // Date and count
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Generated: ${dateStr}`, 14, 30);
    doc.text(`Total Students: ${students.length}`, 230, 30);

    // Table
    const tableData = students.map((student) => [
      student.name || '—',
      student.email,
      student.programme?.name || '—',
      student.year?.toString() || '—',
      new Date(student.createdAt).toLocaleDateString('en-GB'),
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Name', 'Email', 'Programme', 'Year', 'Joined']],
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
    doc.text(`A+ Mentality © ${new Date().getFullYear()} — ${scope.institutionName} Student Roster`, 14, finalY);

    // Dynamic filename
    const filenameShort = shortName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateFile = new Date().toISOString().split('T')[0];
    const filename = `${filenameShort}_Students_Report_${dateFile}.pdf`;

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Students Export] PDF generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
