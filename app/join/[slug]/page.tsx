import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

export default async function JoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Check Institution first (via its slug field)
  const institution = await prisma.institution.findUnique({
    where: { slug },
  });

  if (institution) {
    redirect(`/onboarding?slug=${encodeURIComponent(slug)}&type=institution`);
  }

  // Then check University (via its joinSlug field)
  const university = await prisma.university.findUnique({
    where: { joinSlug: slug },
  });

  if (university) {
    redirect(`/onboarding?slug=${encodeURIComponent(slug)}&type=university`);
  }

  // Not found
  notFound();
}
