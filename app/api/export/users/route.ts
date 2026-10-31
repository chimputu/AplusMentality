import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export async function GET() {
  const { role } = await requireAuth(['SUPER_ADMIN']);
  if (role !== 'SUPER_ADMIN') {
    return new Response('Unauthorized', { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      role: true,
      institution: {
        select: {
          name: true,
        },
      },
      programme: {
        select: {
          name: true,
        },
      },
      year: true,
      period: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const doc = new jsPDF({ orientation: 'landscape' });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('A+ Mentality — Users Report', 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  doc.text(`Total Users: ${users.length}`, 14, 28);

  // Table
  const tableData = users.map((user) => [
    user.name || '—',
    user.email,
    user.role,
    user.institution?.name || '—',
    user.programme?.name || '—',
    user.year?.toString() || '—',
    user.period || '—',
    new Date(user.createdAt).toLocaleDateString(),
  ]);

  (doc as any).autoTable({
    startY: 34,
    head: [['Name', 'Email', 'Role', 'Institution', 'Programme', 'Year', 'Period', 'Joined']],
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

  const pdfBlob = doc.output('blob');
  return new Response(pdfBlob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="users-report.pdf"',
    },
  });
}
