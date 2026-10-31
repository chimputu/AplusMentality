import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET() {
  try {
    const { role } = await requireAuth(['SUPER_ADMIN']);
  if (role !== 'SUPER_ADMIN') {
    return new Response('Unauthorized', { status: 403 });
  }

  const institutions = await prisma.university.findMany({
    select: {
      name: true,
      shortName: true,
      type: true,
      isActive: true,
      isVerified: true,
      clerkOrgId: true,
      _count: {
        select: {
          programmes: true,
          users: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const doc = new jsPDF({ orientation: 'landscape' });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('A+ Mentality — Institutions Report', 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  doc.text(`Total Institutions: ${institutions.length}`, 14, 28);

  // Table
  const tableData = institutions.map((inst) => [
    inst.name,
    inst.shortName || '—',
    inst.type,
    inst.isActive ? 'Active' : 'Inactive',
    inst.isVerified ? 'Verified' : 'Pending',
    inst.clerkOrgId ? 'Linked' : 'Not linked',
    String(inst._count.programmes),
    String(inst._count.users),
  ]);

  autoTable(doc, {
    startY: 34,
    head: [['Name', 'Short Name', 'Type', 'Status', 'Verified', 'Clerk', 'Programmes', 'Users']],
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

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="institutions-report.pdf"',
    },
  });
  } catch (error) {
    console.error('[Institutions Export] PDF generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
